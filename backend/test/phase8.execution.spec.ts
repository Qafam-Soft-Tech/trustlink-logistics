import { Test, TestingModule } from '@nestjs/testing';
import { Delivery, DeliveryEvent, DeliveryStatus, PackageType, Address } from '../src/modules/deliveries/entities/delivery.entity';
import { ProofOfDelivery } from '../src/modules/deliveries/entities/proof-of-delivery.entity';
import { RiderProfile } from '../src/modules/deliveries/entities/rider-profile.entity';
import { User } from '../src/modules/auth/entities/user.entity';
import { DeliveryService } from '../src/modules/deliveries/services/delivery.service';
import { MockDb, TestFactory, seedBaseData, notificationServiceMock } from './mock-db';

describe('Phase 8: Delivery Execution & Proof of Delivery', () => {
  let module: TestingModule;
  let db: MockDb;
  let deliveryService: DeliveryService;
  let deliveryRepository: any;
  let proofOfDeliveryRepository: any;
  let testData: any;

  beforeAll(async () => {
    db = new MockDb();
    testData = seedBaseData(db);

    deliveryRepository = db.repo('Delivery');
    proofOfDeliveryRepository = db.repo('ProofOfDelivery');

    module = await Test.createTestingModule({
      providers: [
        DeliveryService,
        ...db.providers([Delivery, Address, DeliveryEvent, ProofOfDelivery, RiderProfile, User]),
        notificationServiceMock,
      ],
    }).compile();

    deliveryService = module.get<DeliveryService>(DeliveryService);
  });

  afterAll(async () => {
    await module.close();
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
        delivery.id, DeliveryStatus.SEARCHING, 'system', 'admin',
      );
      expect(updated.status).toBe(DeliveryStatus.SEARCHING);

      // Assign rider
      updated = await deliveryService.updateDeliveryStatus(
        delivery.id, DeliveryStatus.ASSIGNED, testData.admin.id, 'admin',
      );
      expect(updated.status).toBe(DeliveryStatus.ASSIGNED);
      expect(updated.assignedAt).toBeDefined();

      // Record the assigned rider so completion can be validated
      await deliveryRepository.update(delivery.id, { riderId: testData.rider.id });

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
      })).rejects.toThrow('Photo proof is required');

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
      const otherRider = await (db.repo('User')).save(TestFactory.createRider({ phone: '08099999999', id: 'rider-other' }));

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

    it('should transition to RETURNED on second failure', async () => {
      // Second failure happens during the redelivery attempt, while on the road again
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.IN_TRANSIT,
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
          riderId: testData.rider.id,
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
          redeliveryAttempts: 2,
        }),
      });

      // Only one redelivery is allowed (attempt 1 -> redelivery; attempt 2 -> RETURNED)
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

      const proof = await proofOfDeliveryRepository.save({
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