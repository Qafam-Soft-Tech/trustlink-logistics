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

describe('Phase 8: Delivery Execution & Proof of Delivery', () => {
  let dataSource: any;
  let deliveryService: DeliveryService;
  let deliveryRepository: Repository<any>;
  let proofOfDeliveryRepository: Repository<any>;
  let testData: any;

  beforeAll(async () => {
    dataSource = await TestFactory.setupTestModule();
    testData = await TestFactory.seedTestData(dataSource);

    deliveryRepository = dataSource.getRepository(Delivery);
    proofOfDeliveryRepository = dataSource.getRepository(ProofOfDelivery);

    // Instantiate service directly with repositories
    deliveryService = new DeliveryService(
      dataSource.getRepository(Delivery),
      dataSource.getRepository(Address),
      dataSource.getRepository(ProofOfDelivery),
      dataSource.getRepository(User),
      // Mock notification service
      {
        notifyDeliveryStatusChange: jest.fn().mockResolvedValue(undefined),
      }
    );
  });

  afterAll(async () => {
    await teardownTestModule(dataSource);
  });

  describe('Happy Path State Walk', () => {
    it('should walk delivery from REQUESTED to DELIVERED', async () => {
      // Create delivery in REQUESTED
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.REQUESTED,
          packageType: PackageType.DOCUMENT,
          packageWeight: 0.5,
        }),
      });

      // Transition to SEARCHING (after payment)
      let updated = await deliveryService.updateDeliveryStatus(
        delivery.id, DeliveryStatus.SEARCHING, 'system', 'system'
      );
      expect(updated.status).toBe(DeliveryStatus.SEARCHING);

      // Assign rider
      updated = await deliveryService.updateDeliveryStatus(
        delivery.id, DeliveryStatus.ASSIGNED, testData.admin.id, 'admin'
      );
      expect(updated.status).toBe(DeliveryStatus.ASSIGNED);
      expect(updated.assignedAt).toBeDefined();

      // Rider picks up
      updated = await deliveryService.markPickedUp(delivery.id, testData.rider.id, 9.0579, 7.4891);
      expect(updated.status).toBe(DeliveryStatus.PICKED_UP);
      expect(updated.pickedUpAt).toBeDefined();

      // In transit
      updated = await deliveryService.markInTransit(delivery.id, testData.rider.id, 9.0600, 7.4900);
      expect(updated.status).toBe(DeliveryStatus.IN_TRANSIT);

      // Complete with proof
      updated = await deliveryService.completeDelivery(delivery.id, testData.rider.id, {
        photoUrl: 'https://example.com/proof.jpg',
        recipientOtp: '123456',
        recipientName: 'Jane Smith',
        recipientPhone: '08087654321',
        latitude: 9.0723,
        longitude: 7.4912,
      });

      expect(updated.status).toBe(DeliveryStatus.DELIVERED);
      expect(updated.deliveredAt).toBeDefined();

      // Verify proof of delivery created
      const proof = await proofOfDeliveryRepository.findOne({ where: { deliveryId: delivery.id } });
      expect(proof).toBeDefined();
      expect(proof.photoUrl).toBe('https://example.com/proof.jpg');
      expect(proof.recipientOtp).toBe('123456');
    });
  });

  describe('Proof of Delivery Validation', () => {
    it('should require photo and OTP for completion', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.IN_TRANSIT,
          riderId: testData.rider.id,
        }),
      });

      // Missing photo
      await expect(deliveryService.completeDelivery(delivery.id, testData.rider.id, {
        photoUrl: '',
        recipientOtp: '123456',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      })).rejects.toThrow('Valid 6-digit recipient OTP required');

      // Missing OTP
      await expect(deliveryService.completeDelivery(delivery.id, testData.rider.id, {
        photoUrl: 'https://example.com/photo.jpg',
        recipientOtp: '',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      })).rejects.toThrow('Valid 6-digit recipient OTP required');

      // Invalid OTP length
      await expect(deliveryService.completeDelivery(delivery.id, testData.rider.id, {
        photoUrl: 'https://example.com/photo.jpg',
        recipientOtp: '12345',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      })).rejects.toThrow('Valid 6-digit recipient OTP required');
    });

    it('should only allow completion from IN_TRANSIT status', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.PICKED_UP,
          riderId: testData.rider.id,
        }),
      });

      await expect(deliveryService.completeDelivery(delivery.id, testData.rider.id, {
        photoUrl: 'https://example.com/photo.jpg',
        recipientOtp: '123456',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      })).rejects.toThrow('Delivery must be IN_TRANSIT to complete');
    });

    it('should only allow assigned rider to complete', async () => {
      const otherRider = await dataSource.getRepository(User).save(TestFactory.createRider({ phone: '08099999999', id: 'rider-other' }));

      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.IN_TRANSIT,
          riderId: testData.rider.id,
        }),
      });

      await expect(deliveryService.completeDelivery(delivery.id, otherRider.id, {
        photoUrl: 'https://example.com/photo.jpg',
        recipientOtp: '123456',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      })).rejects.toThrow('Not assigned to this delivery');
    });
  });

  describe('Failure Handling', () => {
    it('should require reason for failure', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.IN_TRANSIT,
          riderId: testData.rider.id,
        }),
      });

      await expect(deliveryService.reportFailure(delivery.id, testData.rider.id, '', 9.0, 7.0))
        .rejects.toThrow('Failure reason is required');
    });

    it('should transition from IN_TRANSIT to FAILED on first failure', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.IN_TRANSIT,
          riderId: testData.rider.id,
          redeliveryAttempts: 0,
        }),
      });

      const updated = await deliveryService.reportFailure(delivery.id, testData.rider.id, 'Customer not available', 9.0, 7.0);

      expect(updated.status).toBe(DeliveryStatus.FAILED);
      expect(updated.failureReason).toBe('Customer not available');
      expect(updated.redeliveryAttempts).toBe(1);
    });

    it('should transition from FAILED to RETURNED on second failure', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.FAILED,
          riderId: testData.rider.id,
          redeliveryAttempts: 1,
        }),
      });

      const updated = await deliveryService.reportFailure(delivery.id, testData.rider.id, 'Still no one home', 9.0, 7.0);

      expect(updated.status).toBe(DeliveryStatus.RETURNED);
      expect(updated.failureReason).toBe('Still no one home');
      expect(updated.redeliveryAttempts).toBe(2);
    });

    it('should not allow failure from non-active status', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.DELIVERED,
        }),
      });

      await expect(deliveryService.reportFailure(delivery.id, testData.rider.id, 'Test', 9.0, 7.0))
        .rejects.toThrow('Can only report failure from PICKED_UP or IN_TRANSIT status');
    });
  });

  describe('Redelivery Cap Enforcement', () => {
    it('should allow one redelivery for FAILED delivery', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.FAILED,
          riderId: testData.rider.id,
          redeliveryAttempts: 1,
        }),
      });

      const updated = await deliveryService.scheduleRedelivery(delivery.id, testData.admin.id);

      expect(updated.status).toBe(DeliveryStatus.SEARCHING);
      expect(updated.riderId).toBeNull();
    });

    it('should reject redelivery after maximum attempts', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.FAILED,
          riderId: testData.rider.id,
          redeliveryAttempts: 1,
        }),
      });

      // First redelivery
      await deliveryService.scheduleRedelivery(delivery.id, testData.admin.id);

      // Try second redelivery
      const updated = await deliveryRepository.findOne({ where: { id: delivery.id } });
      updated.status = DeliveryStatus.FAILED;
      updated.redeliveryAttempts = 1;
      await deliveryRepository.save(updated);

      await expect(deliveryService.scheduleRedelivery(delivery.id, testData.admin.id))
        .rejects.toThrow('Maximum redelivery attempts reached');
    });
  });

  describe('Proof of Delivery Retrieval', () => {
    it('should retrieve proof of delivery', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.DELIVERED,
          riderId: testData.rider.id,
        }),
      });

      const proof = await dataSource.getRepository(ProofOfDelivery).save({
        deliveryId: delivery.id,
        photoUrl: 'https://example.com/proof.jpg',
        recipientOtp: '123456',
        recipientName: 'Jane Smith',
        recipientPhone: '08087654321',
        latitude: 9.0723,
        longitude: 7.4912,
      });

      const retrieved = await deliveryService.getProofOfDelivery(delivery.id);
      expect(retrieved.id).toBe(proof.id);
      expect(retrieved.photoUrl).toBe('https://example.com/proof.jpg');
    });

    it('should return null for non-delivered deliveries', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({ 
          customerId: testData.customer.id,
          status: DeliveryStatus.IN_TRANSIT,
        }),
      });

      const proof = await deliveryService.getProofOfDelivery(delivery.id);
      expect(proof).toBeNull();
    });
  });
});