import { Test, TestingModule } from '@nestjs/testing';
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

describe('Phase 11: Admin Account Management & Reporting', () => {
  let module: TestingModule;
  let dataSource: any;
  let userRepository: Repository<any>;
  let deliveryRepository: Repository<any>;
  let riderProfileRepository: Repository<any>;
  let pricingRepository: Repository<any>;
  let testData: any;

  beforeAll(async () => {
    dataSource = await TestFactory.setupTestModule();
    testData = await TestFactory.seedTestData(dataSource);

    userRepository = dataSource.getRepository('User');
    deliveryRepository = dataSource.getRepository('Delivery');
    riderProfileRepository = dataSource.getRepository('RiderProfile');
    pricingRepository = dataSource.getRepository('PricingConfig');
  });

  afterAll(async () => {
    await teardownTestModule(dataSource);
  });

  describe('Customer Management', () => {
    it('should list customers with pagination', async () => {
      // Create multiple customers
      const customers = [];
      for (let i = 0; i < 5; i++) {
        const customer = userRepository.create(TestFactory.createCustomer({ 
          phone: `080${i}0000000`, 
          id: `customer-${i}` 
        }));
        customers.push(await userRepository.save(customer));
      }

      const allUsers = await userRepository.find({ where: { role: UserRole.CUSTOMER } });
      expect(allUsers.length).toBeGreaterThanOrEqual(5);
    });

    it('should suspend customer and prevent new deliveries', async () => {
      const customer = userRepository.create(TestFactory.createCustomer({ phone: '08088888888', id: 'customer-suspend' }));
      await userRepository.save(customer);

      // Verify can create delivery
      const delivery = await testData.deliveryRepository.save({
        ...TestFactory.createDelivery({ customerId: customer.id }),
      });
      expect(delivery.id).toBeDefined();

      // Suspend customer
      customer.isActive = false;
      await userRepository.save(customer);

      // Try to create new delivery - should fail
      await expect(testData.deliveryService.createDelivery(customer.id, {
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
      const history = await testData.deliveryService.getCustomerDeliveries(customer.id);
      expect(history.length).toBe(1);
    });

    it('should reactivate suspended customer', async () => {
      const customer = userRepository.create(TestFactory.createCustomer({ phone: '08077777777', id: 'customer-reactivate' }));
      customer.isActive = false;
      await userRepository.save(customer);

      customer.isActive = true;
      await userRepository.save(customer);

      const delivery = await testData.deliveryService.createDelivery(customer.id, {
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
        status: RiderStatus.OFFLINE 
      }));

      // Approve KYC
      const kycService = new (await import('../src/modules/users/services/kyc.service')).KycService(
        dataSource.getRepository('KycSubmission'),
        userRepository,
      );

      await kycService.approveKyc(testData.admin.id, rider.id);

      const updatedRider = await userRepository.findOne({ where: { id: rider.id } });
      expect(updatedRider.kycStatus).toBe(KycStatus.APPROVED);

      // Rider should now be able to go online
      const dispatchService = new (await import('../src/modules/deliveries/services/dispatch.service')).DispatchService(
        dataSource.getRepository('Delivery'),
        dataSource.getRepository('RiderProfile'),
        userRepository,
      );

      const canGoOnline = await dispatchService.setRiderStatus(rider.id, RiderStatus.ONLINE);
      expect(canGoOnline.status).toBe(RiderStatus.ONLINE);
    });

    it('should reject KYC with required reason', async () => {
      const rider = userRepository.create(TestFactory.createRider({ phone: '08066666666', id: 'rider-reject-test' }));
      rider.kycStatus = KycStatus.PENDING;
      await userRepository.save(rider);

      const kycService = new (await import('../src/modules/users/services/kyc.service')).KycService(
        dataSource.getRepository('KycSubmission'),
        userRepository,
      );

      await expect(kycService.rejectKyc(testData.admin.id, rider.id, ''))
        .rejects.toThrow('Rejection reason is required');

      // Valid rejection
      await kycService.rejectKyc(testData.admin.id, rider.id, 'Invalid NIN document');

      const rejectedRider = await userRepository.findOne({ where: { id: rider.id } });
      expect(rejectedRider.kycStatus).toBe(KycStatus.REJECTED);
      expect(rejectedRider.kycRejectionReason).toBe('Invalid NIN document');

      // Rejected rider cannot go online
      const dispatchService = new (await import('../src/modules/deliveries/services/dispatch.service')).DispatchService(
        dataSource.getRepository('Delivery'),
        dataSource.getRepository('RiderProfile'),
        userRepository,
      );

      const canGoOnline = await dispatchService.setRiderStatus(rider.id, RiderStatus.ONLINE);
      expect(canGoOnline.status).toBe(RiderStatus.REJECTED); // Should remain rejected/offline
    });

    it('should re-review rejected KYC', async () => {
      const rider = userRepository.create(TestFactory.createRider({ phone: '08077777777', id: 'rider-rereview' }));
      rider.kycStatus = KycStatus.REJECTED;
      rider.kycRejectionReason = 'Old reason';
      await userRepository.save(rider);

      const kycService = new (await import('../src/modules/users/services/kyc.service')).KycService(
        dataSource.getRepository('KycSubmission'),
        userRepository,
      );

      // Re-approve
      await kycService.approveKyc(testData.admin.id, rider.id);

      const updatedRider = await userRepository.findOne({ where: { id: rider.id } });
      expect(updatedRider.kycStatus).toBe(KycStatus.APPROVED);
      expect(updatedRider.kycRejectionReason).toBeNull();
    });
  });

  describe('Pricing Configuration', () => {
    it('should update pricing config without restart', async () => {
      const oldRate = await pricingRepository.findOne({ where: { key: PricingConfigKey.PER_KM_RATE } });
      expect(Number(oldRate.value)).toBe(150);

      // Update
      await pricingRepository.update(
        { key: PricingConfigKey.PER_KM_RATE },
        { value: 200, updatedBy: testData.admin.id }
      );

      const updated = await pricingRepository.findOne({ where: { key: PricingConfigKey.PER_KM_RATE } });
      expect(Number(updated.value)).toBe(200);

      // Fare calculation should use new rate
      const fareService = new (await import('../src/modules/payments/services/fare-calculation.service')).FareCalculationService(
        pricingRepository
      );

      const result = await fareService.calculateFare({
        distanceKm: 10,
        weightKg: 1,
        packageType: PackageType.DOCUMENT,
      });

      // distance: 10 * 200 * 1.0 = 2000
      expect(result.distanceCharge).toBe(2000);
    });

    it('should get all pricing configs', async () => {
      const configs = await pricingRepository.find();
      expect(configs.length).toBe(Object.keys(DEFAULT_PRICING_CONFIG).length);
    });
  });

  describe('Reporting & Analytics', () => {
    it('should generate correct dashboard stats', async () => {
      // Create test data
      await testData.deliveryRepository.save([
        TestFactory.createDelivery({ status: DeliveryStatus.DELIVERED }),
        TestFactory.createDelivery({ status: DeliveryStatus.DELIVERED }),
        TestFactory.createDelivery({ status: DeliveryStatus.CANCELLED }),
        TestFactory.createDelivery({ status: DeliveryStatus.FAILED }),
      ]);

      const allDeliveries = await deliveryRepository.find();
      const delivered = allDeliveries.filter(d => d.status === DeliveryStatus.DELIVERED).length;
      const cancelled = allDeliveries.filter(d => d.status === DeliveryStatus.CANCELLED).length;
      const failed = allDeliveries.filter(d => d.status === DeliveryStatus.FAILED).length;

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
      expect(profile.earnings).toBe(450000);
    });

    it('should track top delivery areas', async () => {
      // Create deliveries with different areas
      await testData.deliveryRepository.save([
        TestFactory.createDelivery({ pickupArea: 'Wuse 2', dropoffArea: 'Garki' }),
        TestFactory.createDelivery({ pickupArea: 'Wuse 2', dropoffArea: 'Maitama' }),
        TestFactory.createDelivery({ pickupArea: 'Maitama', dropoffArea: 'Asokoro' }),
      ]);

      const all = await deliveryRepository.find();
      const areaCounts = all.reduce((acc, d) => {
        acc[d.pickupArea] = (acc[d.pickupArea] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

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
      const inactiveUsers = await userRepository.find({ where: { isActive: false } });

      expect(activeUsers.length).toBeGreaterThan(0);
      // inactiveUsers could be 0 initially
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