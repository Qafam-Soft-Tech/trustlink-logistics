import { Test, TestingModule } from '@nestjs/testing';
import { Delivery, DeliveryStatus, PackageType, Address } from '../src/modules/deliveries/entities/delivery.entity';
import { ProofOfDelivery } from '../src/modules/deliveries/entities/proof-of-delivery.entity';
import { User, KycStatus } from '../src/modules/auth/entities/user.entity';
import { RiderProfile, VehicleType, RiderStatus } from '../src/modules/deliveries/entities/rider-profile.entity';
import { PricingConfig } from '../src/modules/payments/entities/pricing-config.entity';
import { DeliveryService } from '../src/modules/deliveries/services/delivery.service';
import { DispatchService } from '../src/modules/deliveries/services/dispatch.service';
import { FareCalculationService } from '../src/modules/payments/services/fare-calculation.service';
import { MockDb, TestFactory, seedBaseData, notificationServiceMock } from './mock-db';

describe('Phase 7: Dispatch, Assignment & Rider Job Flow', () => {
  let module: TestingModule;
  let db: MockDb;
  let dispatchService: DispatchService;
  let deliveryService: DeliveryService;
  let deliveryRepository: any;
  let riderProfileRepository: any;
  let userRepository: any;
  let testData: any;

  beforeAll(async () => {
    db = new MockDb();
    testData = seedBaseData(db);

    deliveryRepository = db.repo('Delivery');
    riderProfileRepository = db.repo('RiderProfile');
    userRepository = db.repo('User');

    module = await Test.createTestingModule({
      providers: [
        DispatchService,
        DeliveryService,
        FareCalculationService,
        ...db.providers([Delivery, Address, ProofOfDelivery, User, RiderProfile, PricingConfig]),
        notificationServiceMock,
      ],
    }).compile();

    dispatchService = module.get<DispatchService>(DispatchService);
    deliveryService = module.get<DeliveryService>(DeliveryService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Rider Eligibility', () => {
    it('should return only online, KYC-approved riders', async () => {
      // Create additional riders with different statuses
      const offlineRider = userRepository.create(TestFactory.createRider({ phone: '08022222222', id: 'rider-offline' }));
      offlineRider.kycStatus = KycStatus.APPROVED;
      await userRepository.save(offlineRider);
      await riderProfileRepository.save(TestFactory.createRiderProfile({
        userId: offlineRider.id,
        status: RiderStatus.OFFLINE,
      }));

      const pendingRider = userRepository.create(TestFactory.createRider({ phone: '08033333333', id: 'rider-pending' }));
      pendingRider.kycStatus = KycStatus.PENDING;
      await userRepository.save(pendingRider);
      await riderProfileRepository.save(TestFactory.createRiderProfile({
        userId: pendingRider.id,
        status: RiderStatus.ONLINE,
      }));

      const rejectedRider = userRepository.create(TestFactory.createRider({ phone: '08044444444', id: 'rider-rejected' }));
      rejectedRider.kycStatus = KycStatus.REJECTED;
      await userRepository.save(rejectedRider);
      await riderProfileRepository.save(TestFactory.createRiderProfile({
        userId: rejectedRider.id,
        status: RiderStatus.ONLINE,
      }));

      // Create a delivery in SEARCHING status
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.SEARCHING,
          packageType: PackageType.DOCUMENT,
          packageWeight: 0.5,
          pickupLatitude: 9.0579,
          pickupLongitude: 7.4891,
        }),
      });

      const eligibleRiders = await dispatchService.getEligibleRiders(delivery.id);

      // Should only return testData.rider (online + approved + correct vehicle)
      expect(eligibleRiders.length).toBeGreaterThanOrEqual(1);
      expect(eligibleRiders.every(r => r.rider.status === RiderStatus.ONLINE)).toBe(true);
      expect(eligibleRiders.every(r => r.rider.user.kycStatus === KycStatus.APPROVED)).toBe(true);
    });

    it('should filter by vehicle compatibility', async () => {
      // Create a heavy parcel delivery
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.SEARCHING,
          packageType: PackageType.PARCEL,
          packageWeight: 20, // 20kg - needs van/truck
          pickupLatitude: 9.0579,
          pickupLongitude: 7.4891,
        }),
      });

      // testData.rider has motorcycle (max 10kg) - should be filtered out
      const eligibleRiders = await dispatchService.getEligibleRiders(delivery.id);

      // Should not include motorcycle rider for 20kg parcel
      const motorcycleRiders = eligibleRiders.filter(r => r.rider.vehicleType === VehicleType.MOTORCYCLE);
      expect(motorcycleRiders.length).toBe(0);
    });

    it('should filter by zone/distance', async () => {
      // Create rider far away
      const farRider = userRepository.create(TestFactory.createRider({ phone: '08055555555', id: 'rider-far' }));
      farRider.kycStatus = KycStatus.APPROVED;
      await userRepository.save(farRider);
      await riderProfileRepository.save(TestFactory.createRiderProfile({
        userId: farRider.id,
        status: RiderStatus.ONLINE,
        currentLatitude: 9.5, // Far from pickup
        currentLongitude: 7.5,
      }));

      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.SEARCHING,
          pickupLatitude: 9.0579,
          pickupLongitude: 7.4891,
        }),
      });

      const eligibleRiders = await dispatchService.getEligibleRiders(delivery.id);

      // Should not include rider > 20km away
      const farRiders = eligibleRiders.filter(r => r.distanceKm > 20);
      expect(farRiders.length).toBe(0);
    });
  });

  describe('Rider Assignment', () => {
    it('should assign rider and update statuses', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.SEARCHING,
          packageType: PackageType.DOCUMENT,
          packageWeight: 0.5,
        }),
      });

      const assigned = await dispatchService.assignRider(delivery.id, testData.rider.id, testData.admin.id);

      expect(assigned.riderId).toBe(testData.rider.id);
      expect(assigned.status).toBe(DeliveryStatus.ASSIGNED);
      expect(assigned.assignedAt).toBeDefined();

      // Check rider status updated
      const riderProfile = await riderProfileRepository.findOne({ where: { userId: testData.rider.id } });
      expect(riderProfile.status).toBe(RiderStatus.ON_TRIP);
    });

    it('should reject assignment of non-approved rider', async () => {
      const rejectedRider = userRepository.create(TestFactory.createRider({ phone: '08099999999', id: 'rider-rejected2' }));
      rejectedRider.kycStatus = KycStatus.REJECTED;
      await userRepository.save(rejectedRider);
      await riderProfileRepository.save(TestFactory.createRiderProfile({
        userId: rejectedRider.id,
        status: RiderStatus.ONLINE,
      }));

      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.SEARCHING,
        }),
      });

      await expect(dispatchService.assignRider(delivery.id, rejectedRider.id, testData.admin.id))
        .rejects.toThrow('Rider KYC not approved');
    });

    it('should reject assignment of offline rider', async () => {
      const offlineRider = userRepository.create(TestFactory.createRider({ phone: '08088888888', id: 'rider-offline2' }));
      offlineRider.kycStatus = KycStatus.APPROVED;
      await userRepository.save(offlineRider);
      await riderProfileRepository.save(TestFactory.createRiderProfile({
        userId: offlineRider.id,
        status: RiderStatus.OFFLINE,
      }));

      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.SEARCHING,
        }),
      });

      await expect(dispatchService.assignRider(delivery.id, offlineRider.id, testData.admin.id))
        .rejects.toThrow('Rider is not online');
    });

    it('should reject assignment for wrong vehicle type', async () => {
      // Make sure testData.rider is ONLINE again for this test
      const profile = await riderProfileRepository.findOne({ where: { userId: testData.rider.id } });
      profile.status = RiderStatus.ONLINE;
      await riderProfileRepository.save(profile);

      // Create delivery with heavy parcel
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.SEARCHING,
          packageType: PackageType.PARCEL,
          packageWeight: 20,
        }),
      });

      // testData.rider has motorcycle - not compatible with 20kg
      await expect(dispatchService.assignRider(delivery.id, testData.rider.id, testData.admin.id))
        .rejects.toThrow('Rider vehicle type not compatible');
    });
  });

  describe('Rider Reassignment', () => {
    it('should reassign delivery to new rider', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.ASSIGNED,
          riderId: testData.rider.id,
        }),
      });

      // Create new rider
      const newRider = userRepository.create(TestFactory.createRider({ phone: '08077777777', id: 'rider-new' }));
      newRider.kycStatus = KycStatus.APPROVED;
      await userRepository.save(newRider);
      await riderProfileRepository.save(TestFactory.createRiderProfile({
        userId: newRider.id,
        status: RiderStatus.ONLINE,
      }));

      const reassigned = await dispatchService.reassignRider(delivery.id, newRider.id, testData.admin.id, 'Rider unavailable');

      expect(reassigned.riderId).toBe(newRider.id);
      expect(reassigned.status).toBe(DeliveryStatus.ASSIGNED);

      // Old rider should be ONLINE
      const oldProfile = await riderProfileRepository.findOne({ where: { userId: testData.rider.id } });
      expect(oldProfile.status).toBe(RiderStatus.ONLINE);

      // New rider should be ON_TRIP
      const newProfile = await riderProfileRepository.findOne({ where: { userId: newRider.id } });
      expect(newProfile.status).toBe(RiderStatus.ON_TRIP);
    });
  });

  describe('Rider Job Acknowledgment', () => {
    it('should allow rider to acknowledge assigned job', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.ASSIGNED,
          riderId: testData.rider.id,
        }),
      });

      const acknowledged = await dispatchService.riderAcknowledgeJob(delivery.id, testData.rider.id);

      expect(acknowledged.id).toBe(delivery.id);
    });

    it('should reject acknowledgment from wrong rider', async () => {
      const otherRider = userRepository.create(TestFactory.createRider({ phone: '08066666666', id: 'rider-other' }));
      otherRider.kycStatus = KycStatus.APPROVED;
      await userRepository.save(otherRider);

      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.ASSIGNED,
          riderId: testData.rider.id,
        }),
      });

      await expect(dispatchService.riderAcknowledgeJob(delivery.id, otherRider.id))
        .rejects.toThrow('Not assigned to this delivery');
    });

    it('should reject acknowledgment for non-ASSIGNED delivery', async () => {
      const delivery = await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.PICKED_UP,
          riderId: testData.rider.id,
        }),
      });

      await expect(dispatchService.riderAcknowledgeJob(delivery.id, testData.rider.id))
        .rejects.toThrow('Delivery not in ASSIGNED status');
    });
  });

  describe('Rider Status Management', () => {
    it('should allow rider to go ONLINE', async () => {
      const riderProfile = await riderProfileRepository.findOne({ where: { userId: testData.rider.id } });
      riderProfile.status = RiderStatus.OFFLINE;
      await riderProfileRepository.save(riderProfile);

      const updated = await dispatchService.setRiderStatus(testData.rider.id, RiderStatus.ONLINE);
      expect(updated.status).toBe(RiderStatus.ONLINE);
    });

    it('should prevent going ONLINE with active deliveries', async () => {
      // Rider is currently ON_TRIP with an active delivery
      const riderProfile = await riderProfileRepository.findOne({ where: { userId: testData.rider.id } });
      riderProfile.status = RiderStatus.ON_TRIP;
      await riderProfileRepository.save(riderProfile);

      await deliveryRepository.save({
        ...TestFactory.createDelivery({
          customerId: testData.customer.id,
          status: DeliveryStatus.ASSIGNED,
          riderId: testData.rider.id,
        }),
      });

      await expect(dispatchService.setRiderStatus(testData.rider.id, RiderStatus.ONLINE))
        .rejects.toThrow('Cannot go ONLINE while having active deliveries');
    });

    it('should allow rider to go OFFLINE when no active deliveries', async () => {
      // Ensure no active deliveries
      await deliveryRepository.delete({ riderId: testData.rider.id });

      const updated = await dispatchService.setRiderStatus(testData.rider.id, RiderStatus.OFFLINE);
      expect(updated.status).toBe(RiderStatus.OFFLINE);
    });
  });

  describe('Live Delivery Board', () => {
    it('should return all active deliveries for admin', async () => {
      // Isolate the board to only the seeded deliveries
      db.clear('Delivery');
      await deliveryRepository.save([
        TestFactory.createDelivery({ customerId: testData.customer.id, status: DeliveryStatus.REQUESTED }),
        TestFactory.createDelivery({ customerId: testData.customer.id, status: DeliveryStatus.SEARCHING }),
        TestFactory.createDelivery({ customerId: testData.customer.id, status: DeliveryStatus.ASSIGNED }),
        TestFactory.createDelivery({ customerId: testData.customer.id, status: DeliveryStatus.PICKED_UP }),
        TestFactory.createDelivery({ customerId: testData.customer.id, status: DeliveryStatus.IN_TRANSIT }),
        TestFactory.createDelivery({ customerId: testData.customer.id, status: DeliveryStatus.DELIVERED }), // Should not appear
      ]);

      const board = await dispatchService.getLiveDeliveryBoard();

      expect(board.length).toBe(5); // All except DELIVERED
      expect(board.every(d => d.status !== DeliveryStatus.DELIVERED)).toBe(true);
    });
  });
});