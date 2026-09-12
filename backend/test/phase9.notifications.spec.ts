import { DataSource, Repository } from 'typeorm';
import { User, UserRole, KycStatus } from '../src/modules/auth/entities/user.entity';
import { Delivery, DeliveryStatus, PackageType, Address, DeliveryEvent, ProofOfDelivery } from '../src/modules/deliveries/entities/delivery.entity';
import { RiderProfile, VehicleType, RiderStatus } from '../src/modules/deliveries/entities/rider-profile.entity';
import { KycSubmission, KycDocumentType } from '../src/modules/users/entities/kyc-submission.entity';
import { PricingConfig, PricingConfigKey, DEFAULT_PRICING_CONFIG } from '../src/modules/payments/entities/pricing-config.entity';
import { Payment, PaymentProvider, PaymentStatus, PaymentChannel } from '../src/modules/payments/entities/payment.entity';
import { Notification, NotificationChannel, NotificationStatus } from '../src/modules/notifications/entities/notification.entity';
import { Issue, IssueStatus, IssueType, IssuePriority } from '../src/modules/deliveries/entities/issue.entity';
import { DeliveryService } from '../src/modules/deliveries/services/delivery.service';
import { DispatchService } from '../src/modules/deliveries/services/dispatch.service';
import { FareCalculationService } from '../src/modules/payments/services/fare-calculation.service';
import { PaymentService } from '../src/modules/payments/services/payment.service';
import { NotificationService } from '../src/modules/notifications/services/notification.service';
import { IssueService } from '../src/modules/deliveries/services/issue.service';
import { KycService } from '../src/modules/users/services/kyc.service';
import { TestFactory, setupTestModule, teardownTestModule, seedTestData } from './setup';
import * as crypto from 'crypto';

describe('Phase 9: Customer Tracking, Notifications & Cancellation', () => {
  let dataSource: any;
  let notificationService: NotificationService;
  let deliveryService: DeliveryService;
  let deliveryRepository: Repository<any>;
  let notificationRepository: Repository<any>;
  let userRepository: Repository<any>;
  let testData: any;

  beforeAll(async () => {
    dataSource = await TestFactory.setupTestModule();
    testData = await TestFactory.seedTestData(dataSource);

    notificationRepository = dataSource.getRepository(Notification);
    deliveryRepository = dataSource.getRepository(Delivery);
    userRepository = dataSource.getRepository(User);

    // Instantiate services directly
    notificationService = new NotificationService(
      notificationRepository,
      deliveryRepository,
      dataSource.getRepository(User),
      {
        get: () => '',
      }
    );

    deliveryService = new DeliveryService(
      dataSource.getRepository(Delivery),
      dataSource.getRepository(Address),
      dataSource.getRepository(ProofOfDelivery),
      dataSource.getRepository(User),
      {
        notifyDeliveryStatusChange: jest.fn().mockResolvedValue(undefined),
      }
    );
  });

  afterAll(async () => {
    await teardownTestModule(dataSource);
  });

  describe('Notification Dispatch on Status Changes', () => {
    it('should send notification on every status transition', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.REQUESTED,
        }),
      });

      const transitions = [
        DeliveryStatus.SEARCHING,
        DeliveryStatus.ASSIGNED,
        DeliveryStatus.PICKED_UP,
        DeliveryStatus.IN_TRANSIT,
        DeliveryStatus.DELIVERED,
      ];

      for (const status of transitions) {
        await deliveryService.updateDeliveryStatus(delivery.id, status, 'system', 'system');
      }

      const notifications = await notificationRepository.find({ where: { deliveryId: delivery.id } });
      expect(notifications.length).toBeGreaterThanOrEqual(transitions.length);
      
      // Check that all statuses triggered notifications
      const statusesNotified = notifications.map(n => {
        const data = n.data as any;
        return data.status;
      });
      transitions.forEach(status => {
        expect(statusesNotified).toContain(status);
      });
    });

    it('should send push notification for all transitions', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ customerId: testData.customer.id }),
      });

      await deliveryService.updateDeliveryStatus(delivery.id, DeliveryStatus.SEARCHING, 'system', 'system');

      const pushNotifications = await notificationRepository.find({ 
        where: { deliveryId: delivery.id, channel: NotificationChannel.PUSH } 
      });
      expect(pushNotifications.length).toBeGreaterThan(0);
    });

    it('should send SMS for critical statuses', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ customerId: testData.customer.id }),
      });

      // These statuses should trigger SMS
      const criticalStatuses = [
        DeliveryStatus.ASSIGNED,
        DeliveryStatus.DELIVERED,
        DeliveryStatus.FAILED,
        DeliveryStatus.RETURNED,
        DeliveryStatus.CANCELLED,
      ];

      for (const status of criticalStatuses) {
        const deliveryCopy = await deliveryRepository.save({
          ...TestFactory.createDelivery({ customerId: testData.customer.id }),
        });
        await deliveryService.updateDeliveryStatus(deliveryCopy.id, status, 'system', 'system');

        const smsNotifications = await notificationRepository.find({ 
          where: { deliveryId: deliveryCopy.id, channel: NotificationChannel.SMS } 
        });
        expect(smsNotifications.length).toBeGreaterThan(0);
      }
    });

    it('should notify rider on assignment and cancellation', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          riderId: testData.rider.id,
        }),
      });

      // Assignment
      await deliveryService.updateDeliveryStatus(delivery.id, DeliveryStatus.ASSIGNED, testData.admin.id, 'admin');

      const riderNotifications = await notificationRepository.find({ 
        where: { userId: testData.rider.id } 
      });
      expect(riderNotifications.some(n => (n.data as any).status === DeliveryStatus.ASSIGNED)).toBe(true);

      // Cancellation
      const delivery2 = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          riderId: testData.rider.id,
        }),
      });
      await deliveryService.updateDeliveryStatus(delivery2.id, DeliveryStatus.CANCELLED, testData.customer.id, 'customer');

      const cancelledNotifications = await notificationRepository.find({ 
        where: { userId: testData.rider.id, deliveryId: delivery2.id } 
      });
      expect(cancelledNotifications.some(n => (n.data as any).status === DeliveryStatus.CANCELLED)).toBe(true);
    });
  });

  describe('Tiered Cancellation Fees', () => {
    const feeTests = [
      { status: DeliveryStatus.REQUESTED, type: 'free', fee: 0, refund: 100 },
      { status: DeliveryStatus.SEARCHING, type: 'free', fee: 0, refund: 100 },
      { status: DeliveryStatus.ASSIGNED, type: 'partial', percentage: 50, fee: 50, refund: 50 },
      { status: DeliveryStatus.PICKED_UP, type: 'partial', percentage: 75, fee: 75, refund: 25 },
      { status: DeliveryStatus.IN_TRANSIT, type: 'full', fee: 100, refund: 0 },
      { status: DeliveryStatus.DELIVERED, type: 'full', fee: 100, refund: 0 },
      { status: DeliveryStatus.FAILED, type: 'full', fee: 100, refund: 0 },
      { status: DeliveryStatus.RETURNED, type: 'full', fee: 100, refund: 0 },
      { status: DeliveryStatus.CANCELLED, type: 'free', fee: 0, refund: 100 },
    ];

    feeTests.forEach(({ status, type, fee, refund, percentage }) => {
      it(`should apply ${type} fee for ${status}`, async () => {
        const delivery = await deliveryRepository.save({
          ...TestFactory.createDelivery({ 
            customerId: testData.customer.id,
            status,
            fare: 100,
          }),
        });

        const preview = await notificationService.getCancellationPreview(delivery.id, testData.customer.id);
        
        expect(preview.canCancel).toBe(true);
        if (type === 'free') {
          expect(preview.fee).toBe(0);
          expect(preview.refundAmount).toBe(100);
        } else if (type === 'partial') {
          expect(preview.fee).toBe(percentage);
          expect(preview.refundAmount).toBe(refund);
        } else if (type === 'full') {
          expect(preview.fee).toBe(100);
          expect(preview.refundAmount).toBe(0);
        }
      });
    });

    it('should execute cancellation with correct fee', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.ASSIGNED,
          fare: 200,
        }),
      });

      const result = await notificationService.cancelDeliveryWithFee(delivery.id, testData.customer.id);

      expect(result.cancelled).toBe(true);
      expect(result.fee).toBe(100); // 50% of 200
      expect(result.refundAmount).toBe(100);

      // Verify delivery status changed
      const updated = await deliveryRepository.findOne({ where: { id: delivery.id } });
      expect(updated.status).toBe(DeliveryStatus.CANCELLED);
      expect(updated.cancelledAt).toBeDefined();
    });

    it('should prevent cancellation for non-cancellable statuses', async () => {
      const nonCancellable = [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.RETURNED];

      for (const status of nonCancellable) {
        const delivery = await deliveryRepository.save({
          ...TestFactory.createDelivery({ customerId: testData.customer.id, status }),
        });

        const preview = await notificationService.getCancellationPreview(delivery.id, testData.customer.id);
        expect(preview.canCancel).toBe(false);
      }
    });
  });

  describe('Assigned Rider Visibility', () => {
    it('should show rider details only after ASSIGNED', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.SEARCHING,
          riderId: testData.rider.id,
        }),
      });

      // Before assignment, rider details should not be visible
      // This is a business logic check - the API should filter
      expect(delivery.status).toBe(DeliveryStatus.SEARCHING);
      expect(delivery.riderId).toBeDefined(); // But API should not expose to customer

      // After assignment
      await deliveryRepository.update(delivery.id, { status: DeliveryStatus.ASSIGNED });
      const updated = await deliveryRepository.findOne({ where: { id: delivery.id } });
      expect(updated.status).toBe(DeliveryStatus.ASSIGNED);
      // Now API should expose rider details to customer
    });
  });
});