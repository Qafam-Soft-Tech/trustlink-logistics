import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole, KycStatus } from '../src/modules/auth/entities/user.entity';
import { Delivery, DeliveryEvent, DeliveryStatus, PackageType, Address } from '../src/modules/deliveries/entities/delivery.entity';
import { ProofOfDelivery } from '../src/modules/deliveries/entities/proof-of-delivery.entity';
import { RiderProfile, RiderStatus } from '../src/modules/deliveries/entities/rider-profile.entity';
import { KycSubmission } from '../src/modules/users/entities/kyc-submission.entity';
import { PricingConfig, PricingConfigKey, DEFAULT_PRICING_CONFIG } from '../src/modules/payments/entities/pricing-config.entity';
import { DeliveryService } from '../src/modules/deliveries/services/delivery.service';
import { DispatchService } from '../src/modules/deliveries/services/dispatch.service';
import { FareCalculationService } from '../src/modules/payments/services/fare-calculation.service';
import { DistanceService } from '../src/modules/payments/services/distance.service';
import { KycService } from '../src/modules/users/services/kyc.service';
import { MockDb, TestFactory, seedBaseData, notificationServiceMock, recipientOtpServiceMock } from './mock-db';

describe('Phase 11: Admin Account Management & Reporting', () => {
  let module: TestingModule;
  let db: MockDb;
  let userRepository: any;
  let deliveryRepository: any;
  let riderProfileRepository: any;
  let pricingRepository: any;
  let kycRepository: any;
  let kycService: KycService;
  let dispatchService: DispatchService;
  let deliveryService: DeliveryService;
  let fareCalculationService: FareCalculationService;
  let testData: any;

  beforeAll(async () => {
    db = new MockDb();
    testData = seedBaseData(db);

    userRepository = db.repo('User');
    deliveryRepository = db.repo('Delivery');
    riderProfileRepository = db.repo('RiderProfile');
    pricingRepository = db.repo('PricingConfig');
    kycRepository = db.repo('KycSubmission');

    module = await Test.createTestingModule({
      providers: [
        KycService,
        DispatchService,
        DeliveryService,
        FareCalculationService,
        DistanceService,
        ...db.providers([User, Delivery, DeliveryEvent, RiderProfile, KycSubmission, PricingConfig, Address, ProofOfDelivery]),
        notificationServiceMock,
        recipientOtpServiceMock,
      ],
    }).compile();

    kycService = module.get<KycService>(KycService);
    dispatchService = module.get<DispatchService>(DispatchService);
    deliveryService = module.get<DeliveryService>(DeliveryService);
    fareCalculationService = module.get<FareCalculationService>(FareCalculationService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Customer Management', () => {
    it('should list customers with pagination', async () => {
      for (let i = 0; i < 5; i++) {
        const customer = userRepository.create(TestFactory.createCustomer({
          phone: `080${i}0000000`,
          id: `customer-list-${i}`,
        }));
        await userRepository.save(customer);
      }

      const allUsers = await userRepository.find({ where: { role: UserRole.CUSTOMER } });
      expect(allUsers.length).toBeGreaterThanOrEqual(5);
    });

    it('should suspend customer and prevent new deliveries', async () => {
      const customer = userRepository.create(TestFactory.createCustomer({ phone: '08088888888', id: 'customer-suspend' }));
      await userRepository.save(customer);

      // Verify can create delivery
      const delivery = await deliveryService.createDelivery(customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      });
      expect(delivery.id).toBeDefined();

      // Suspend customer
      customer.isActive = false;
      await userRepository.save(customer);

      // Try to create new delivery - should fail
      await expect(deliveryService.createDelivery(customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      })).rejects.toThrow('Customer not found');

      // But history should remain
      const history = await deliveryService.getCustomerDeliveries(customer.id);
      expect(history.length).toBe(1);
    });

    it('should reactivate suspended customer', async () => {
      const customer = userRepository.create(TestFactory.createCustomer({ phone: '08077777777', id: 'customer-reactivate' }));
      customer.isActive = false;
      await userRepository.save(customer);

      customer.isActive = true;
      await userRepository.save(customer);

      const delivery = await deliveryService.createDelivery(customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      });

      expect(delivery.id).toBeDefined();
    });
  });

  describe('Rider KYC Management', () => {
    it('should approve KYC and allow rider to go online', async () => {
      const rider = userRepository.create(TestFactory.createRider({ phone: '08055555555', id: 'rider-kyc-test' }));
      rider.kycStatus = KycStatus.PENDING;
      await userRepository.save(rider);

      await riderProfileRepository.save(TestFactory.createRiderProfile({
        userId: rider.id,
        status: RiderStatus.OFFLINE,
      }));

      db.add('KycSubmission', TestFactory.createKycSubmission({
        id: 'kyc-approve-1',
        userId: rider.id,
        status: KycStatus.PENDING,
      }));

      await kycService.approveKyc(testData.admin.id, rider.id);

      const updatedRider = await userRepository.findOne({ where: { id: rider.id } });
      expect(updatedRider.kycStatus).toBe(KycStatus.APPROVED);

      // Rider should now be able to go online
      const canGoOnline = await dispatchService.setRiderStatus(rider.id, RiderStatus.ONLINE);
      expect(canGoOnline.status).toBe(RiderStatus.ONLINE);
    });

    it('should reject KYC with required reason', async () => {
      const rider = userRepository.create(TestFactory.createRider({ phone: '08066666666', id: 'rider-reject-test' }));
      rider.kycStatus = KycStatus.PENDING;
      await userRepository.save(rider);

      await riderProfileRepository.save(TestFactory.createRiderProfile({
        userId: rider.id,
        status: RiderStatus.OFFLINE,
      }));

      db.add('KycSubmission', TestFactory.createKycSubmission({
        id: 'kyc-reject-1',
        userId: rider.id,
        status: KycStatus.PENDING,
      }));

      await expect(kycService.rejectKyc(testData.admin.id, rider.id, ''))
        .rejects.toThrow('Rejection reason is required');

      // Valid rejection
      await kycService.rejectKyc(testData.admin.id, rider.id, 'Invalid NIN document');

      const rejectedRider = await userRepository.findOne({ where: { id: rider.id } });
      expect(rejectedRider.kycStatus).toBe(KycStatus.REJECTED);

      const rejectedSubmission = await kycRepository.findOne({ where: { userId: rider.id } });
      expect(rejectedSubmission.status).toBe(KycStatus.REJECTED);
      expect(rejectedSubmission.rejectionReason).toBe('Invalid NIN document');

      // Rejected rider cannot go online
      await expect(dispatchService.setRiderStatus(rider.id, RiderStatus.ONLINE))
        .rejects.toThrow('Rider KYC not approved');
    });

    it('should re-review rejected KYC', async () => {
      const rider = userRepository.create(TestFactory.createRider({ phone: '08077777777', id: 'rider-rereview' }));
      rider.kycStatus = KycStatus.REJECTED;
      rider.kycRejectionReason = 'Old reason';
      await userRepository.save(rider);

      db.add('KycSubmission', TestFactory.createKycSubmission({
        id: 'kyc-rereview-1',
        userId: rider.id,
        status: KycStatus.REJECTED,
      }));

      await kycService.approveKyc(testData.admin.id, rider.id);

      const updatedRider = await userRepository.findOne({ where: { id: rider.id } });
      expect(updatedRider.kycStatus).toBe(KycStatus.APPROVED);

      const updatedSubmission = await kycRepository.findOne({ where: { userId: rider.id } });
      expect(updatedSubmission.status).toBe(KycStatus.APPROVED);
      expect(updatedSubmission.rejectionReason).toBeNull();
    });
  });

  describe('Pricing Configuration', () => {
    it('should update pricing config without restart', async () => {
      const oldRate = await pricingRepository.findOne({ where: { key: PricingConfigKey.PER_KM_RATE } });
      expect(Number(oldRate.value)).toBe(150);

      await pricingRepository.update(
        { key: PricingConfigKey.PER_KM_RATE },
        { value: 200, updatedBy: testData.admin.id },
      );

      const updated = await pricingRepository.findOne({ where: { key: PricingConfigKey.PER_KM_RATE } });
      expect(Number(updated.value)).toBe(200);

      const result = await fareCalculationService.calculateFare({
        distanceKm: 10,
        weightKg: 1,
        packageType: PackageType.DOCUMENT,
      });

      // distance: 10 * 200 * 1.0 = 2000
      expect(result.distanceCharge).toBe(2400);
    });

    it('should get all pricing configs', async () => {
      const configs = await pricingRepository.find();
      expect(configs.length).toBe(Object.keys(DEFAULT_PRICING_CONFIG).length);
    });
  });

  describe('Reporting & Analytics', () => {
    it('should generate correct dashboard stats', async () => {
      // Isolate the reporting data
      db.clear('Delivery');
      await deliveryRepository.save([
        TestFactory.createDelivery({ status: DeliveryStatus.DELIVERED }),
        TestFactory.createDelivery({ status: DeliveryStatus.DELIVERED }),
        TestFactory.createDelivery({ status: DeliveryStatus.CANCELLED }),
        TestFactory.createDelivery({ status: DeliveryStatus.FAILED }),
      ]);

      const allDeliveries = await deliveryRepository.find();
      const delivered = allDeliveries.filter((d: any) => d.status === DeliveryStatus.DELIVERED).length;
      const cancelled = allDeliveries.filter((d: any) => d.status === DeliveryStatus.CANCELLED).length;
      const failed = allDeliveries.filter((d: any) => d.status === DeliveryStatus.FAILED).length;

      expect(delivered).toBe(2);
      expect(cancelled).toBe(1);
      expect(failed).toBe(1);

      const successRate = (delivered / (delivered + cancelled + failed)) * 100;
      expect(successRate).toBeCloseTo(50, 0);
    });

    it('should track rider performance', async () => {
      const rider = await userRepository.findOne({ where: { id: testData.rider.id } });
      const profile = await riderProfileRepository.findOne({ where: { userId: testData.rider.id } });

      expect(rider).toBeDefined();
      expect(profile.totalDeliveries).toBe(156);
      expect(profile.rating).toBe(4.9);
    });

    it('should track top delivery areas', async () => {
      // Isolate the area data
      db.clear('Delivery');
      await deliveryRepository.save([
        TestFactory.createDelivery({ pickupArea: 'Wuse 2', dropoffArea: 'Garki' }),
        TestFactory.createDelivery({ pickupArea: 'Wuse 2', dropoffArea: 'Maitama' }),
        TestFactory.createDelivery({ pickupArea: 'Maitama', dropoffArea: 'Asokoro' }),
      ]);

      const all = await deliveryRepository.find();
      const areaCounts = all.reduce((acc: Record<string, number>, d: any) => {
        acc[d.pickupArea] = (acc[d.pickupArea] || 0) + 1;
        return acc;
      }, {});

      expect(areaCounts['Wuse 2']).toBe(2);
      expect(areaCounts['Maitama']).toBe(1);
    });
  });

  describe('User Search & Filter', () => {
    it('should filter users by role', async () => {
      const customers = await userRepository.find({ where: { role: UserRole.CUSTOMER } });
      const riders = await userRepository.find({ where: { role: UserRole.RIDER } });
      const admins = await userRepository.find({ where: { role: UserRole.ADMIN } });

      expect(customers.length).toBeGreaterThan(0);
      expect(riders.length).toBeGreaterThan(0);
      expect(admins.length).toBeGreaterThan(0);
    });

    it('should filter users by status', async () => {
      const activeUsers = await userRepository.find({ where: { isActive: true } });
      expect(activeUsers.length).toBeGreaterThan(0);
      // inactive users could be 0 initially
    });

    it('should search users by phone/email/name', async () => {
      const results = await userRepository
        .createQueryBuilder('user')
        .where('user.phone LIKE :search', { search: '%12345678%' })
        .getMany();

      expect(results.length).toBeGreaterThan(0);
    });
  });
});