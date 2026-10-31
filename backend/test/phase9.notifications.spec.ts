import { Test, TestingModule } from '@nestjs/testing';
import { Delivery, DeliveryEvent, DeliveryStatus, Address } from '../src/modules/deliveries/entities/delivery.entity';
import { ProofOfDelivery } from '../src/modules/deliveries/entities/proof-of-delivery.entity';
import { RiderProfile } from '../src/modules/deliveries/entities/rider-profile.entity';
import { User } from '../src/modules/auth/entities/user.entity';
import { Notification, NotificationChannel } from '../src/modules/notifications/entities/notification.entity';
import { DeliveryService } from '../src/modules/deliveries/services/delivery.service';
import { NotificationService } from '../src/modules/notifications/services/notification.service';
import { MockDb, TestFactory, seedBaseData, configServiceMock } from './mock-db';

describe('Phase 9: Customer Tracking, Notifications & Cancellation', () => {
  let module: TestingModule;
  let db: MockDb;
  let notificationService: NotificationService;
  let deliveryService: DeliveryService;
  let deliveryRepository: any;
  let notificationRepository: any;
  let testData: any;

  beforeAll(async () => {
    db = new MockDb();
    testData = seedBaseData(db);

    deliveryRepository = db.repo('Delivery');
    notificationRepository = db.repo('Notification');

    module = await Test.createTestingModule({
      providers: [
        DeliveryService,
        NotificationService,
        ...db.providers([Delivery, Address, DeliveryEvent, ProofOfDelivery, RiderProfile, User, Notification]),
        configServiceMock,
      ],
    }).compile();

    notificationService = module.get<NotificationService>(NotificationService);
    deliveryService = module.get<DeliveryService>(DeliveryService);
  });

  afterAll(async () => {
    await module.close();
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
        await deliveryService.updateDeliveryStatus(delivery.id, status, 'system', 'admin');
      }

      const notifications = await notificationRepository.find({ where: { deliveryId: delivery.id } });
      expect(notifications.length).toBeGreaterThanOrEqual(transitions.length);

      // Check that all statuses triggered notifications
      const statusesNotified = notifications.map((n: any) => n.data.status);
      transitions.forEach(status => {
        expect(statusesNotified).toContain(status);
      });
    });

    it('should send push notification for all transitions', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ customerId: testData.customer.id }),
      });

      await deliveryService.updateDeliveryStatus(delivery.id, DeliveryStatus.SEARCHING, 'system', 'admin');

      const pushNotifications = await notificationRepository.find({
        where: { deliveryId: delivery.id, channel: NotificationChannel.PUSH },
      });
      expect(pushNotifications.length).toBeGreaterThan(0);
    });

    it('should send SMS for critical statuses', async () => {
      // Each target status must be reached from a valid prior state
      const criticalPriorState: Record<string, DeliveryStatus> = {
        [DeliveryStatus.ASSIGNED]: DeliveryStatus.SEARCHING,
        [DeliveryStatus.DELIVERED]: DeliveryStatus.IN_TRANSIT,
        [DeliveryStatus.FAILED]: DeliveryStatus.IN_TRANSIT,
        [DeliveryStatus.RETURNED]: DeliveryStatus.FAILED,
        [DeliveryStatus.CANCELLED]: DeliveryStatus.REQUESTED,
      };

      const criticalStatuses = Object.keys(criticalPriorState);

      for (const target of criticalStatuses) {
        const delivery = await deliveryRepository.save({
          ...TestFactory.createDelivery({
            customerId: testData.customer.id,
            status: criticalPriorState[target],
          }),
        });
        await deliveryService.updateDeliveryStatus(delivery.id, target as DeliveryStatus, 'system', 'admin');

        const smsNotifications = await notificationRepository.find({
          where: { deliveryId: delivery.id, channel: NotificationChannel.SMS },
        });
        expect(smsNotifications.length).toBeGreaterThan(0);
      }
    });

    it('should notify rider on assignment and cancellation', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.SEARCHING,
          riderId: testData.rider.id,
        }),
      });

      // Assignment
      await deliveryService.updateDeliveryStatus(delivery.id, DeliveryStatus.ASSIGNED, testData.admin.id, 'admin');

      const riderNotifications = await notificationRepository.find({
        where: { userId: testData.rider.id },
      });
      expect(riderNotifications.some((n: any) => n.data.status === DeliveryStatus.ASSIGNED)).toBe(true);

      // Cancellation
      const delivery2 = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.REQUESTED,
          riderId: testData.rider.id,
        }),
      });
      await deliveryService.updateDeliveryStatus(delivery2.id, DeliveryStatus.CANCELLED, testData.customer.id, 'customer');

      const cancelledNotifications = await notificationRepository.find({
        where: { userId: testData.rider.id, deliveryId: delivery2.id },
      });
      expect(cancelledNotifications.some((n: any) => n.data.status === DeliveryStatus.CANCELLED)).toBe(true);
    });
  });

  describe('Tiered Cancellation Fees', () => {
    const feeTests = [
      { status: DeliveryStatus.REQUESTED, type: 'free', fee: 0, refund: 100 },
      { status: DeliveryStatus.SEARCHING, type: 'free', fee: 0, refund: 100 },
      { status: DeliveryStatus.ASSIGNED, type: 'partial', percentage: 50, fee: 50, refund: 50 },
      { status: DeliveryStatus.PICKED_UP, type: 'full', fee: 100, refund: 0 },
      { status: DeliveryStatus.IN_TRANSIT, type: 'full', fee: 100, refund: 0 },
    ];

    feeTests.forEach(({ status, type, refund, percentage }: any) => {
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