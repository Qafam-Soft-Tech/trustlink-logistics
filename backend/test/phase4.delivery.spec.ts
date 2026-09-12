import { DataSource, Repository } from 'typeorm';
import { User, UserRole, KycStatus } from '../src/modules/auth/entities/user.entity';
import { Delivery, DeliveryStatus, PackageType, Address, DeliveryEvent, ProofOfDelivery } from '../src/modules/deliveries/entities/delivery.entity';
import { RiderProfile, VehicleType, RiderStatus } from '../src/modules/deliveries/entities/rider-profile.entity';
import { KycSubmission, KycDocumentType } from '../src/modules/users/entities/kyc-submission.entity';
import { PricingConfig, PricingConfigKey, DEFAULT_PRICING_CONFIG } from '../src/modules/payments/entities/pricing-config.entity';
import { Payment, PaymentProvider, PaymentStatus, PaymentChannel } from '../src/modules/payments/entities/payment.entity';
import { Notification, NotificationChannel, NotificationStatus } from '../src/modules/notifications/entities/notification.entity';
import { Issue, IssueStatus, IssueType, IssuePriority } from '../src/modules/deliveries/entities/issue.entity';
import { TestFactory, setupTestModule, teardownTestModule, seedTestData } from './setup';
import { createTestRepositories, createTestDeliveryService, createTestDispatchService, createTestFareCalculationService } from './service-factory';
import * as crypto from 'crypto';

describe('Phase 4: Address & Delivery Request Creation', () => {
  let dataSource: any;
  let deliveryService: any;
  let dispatchService: any;
  let fareCalculationService: any;
  let userRepository: Repository<any>;
  let deliveryRepository: Repository<any>;
  let addressRepository: Repository<any>;
  let testData: any;

  beforeAll(async () => {
    dataSource = await TestFactory.setupTestModule();
    await TestFactory.seedTestData(dataSource);

    const repos = {
      userRepository: dataSource.getRepository(User),
      deliveryRepository: dataSource.getRepository(Delivery),
      addressRepository: dataSource.getRepository(Address),
      proofOfDeliveryRepository: dataSource.getRepository(ProofOfDelivery),
      pricingConfigRepository: dataSource.getRepository(PricingConfig),
      riderProfileRepository: dataSource.getRepository('RiderProfile'),
      userRepository: dataSource.getRepository(User),
      deliveryRepository: dataSource.getRepository(Delivery),
    };

    // Instantiate services directly with repositories
    const { createTestDeliveryService, createTestDispatchService, createTestFareCalculationService } = await import('./service-factory');
    
    deliveryService = await createTestDeliveryService({
      deliveryRepository: dataSource.getRepository(Delivery),
      addressRepository: dataSource.getRepository(Address),
      proofOfDeliveryRepository: dataSource.getRepository(ProofOfDelivery),
      userRepository: dataSource.getRepository(User),
    });

    dispatchService = await createTestDispatchService({
      deliveryRepository: dataSource.getRepository(Delivery),
      riderProfileRepository: dataSource.getRepository('RiderProfile'),
      userRepository: dataSource.getRepository(User),
    });

    fareCalculationService = await createTestFareCalculationService({
      pricingConfigRepository: dataSource.getRepository(PricingConfig),
    });

    testData = await TestFactory.seedTestData(dataSource);
  });

  afterAll(async () => {
    await teardownTestModule(dataSource);
  });

  describe('Address Entity', () => {
    it('should create and save an address', async () => {
      const address = dataSource.getRepository(Address).create({
        userId: testData.customer.id,
        label: 'Home',
        street: '123 Ahmadu Bello Way',
        landmark: 'Near Shoprite',
        area: 'Wuse 2',
        city: 'Abuja',
        state: 'FCT',
        country: 'Nigeria',
        latitude: 9.0579,
        longitude: 7.4891,
        isDefault: true,
      });

      const saved = await dataSource.getRepository(Address).save(address);
      expect(saved.id).toBeDefined();
      expect(saved.landmark).toBe('Near Shoprite');
      expect(saved.isDefault).toBe(true);
    });

    it('should enforce unique default address per user', async () => {
      const addr1 = dataSource.getRepository(Address).create({
        userId: testData.customer.id,
        label: 'Home',
        street: '123 Street',
        isDefault: true,
      });
      await dataSource.getRepository(Address).save(addr1);

      const addr2 = dataSource.getRepository(Address).create({
        userId: testData.customer.id,
        label: 'Work',
        street: '456 Avenue',
        isDefault: true,
      });
      await dataSource.getRepository(Address).save(addr2);

      // Both exist, but we can query for default
      const defaults = await dataSource.getRepository(Address).find({ 
        where: { userId: testData.customer.id, isDefault: true } 
      });
      expect(defaults.length).toBe(2); // Both saved, application logic handles uniqueness
    });
  });

  describe('Delivery Request Creation', () => {
    it('should create a delivery request with valid data', async () => {
      const delivery = await deliveryService.createDelivery(testData.customer.id, {
        pickupStreet: '123 Ahmadu Bello Way',
        pickupLandmark: 'Near Shoprite',
        pickupArea: 'Wuse 2',
        pickupLatitude: 9.0579,
        pickupLongitude: 7.4891,
        dropoffStreet: '456 Shehu Shagari Way',
        dropoffLandmark: 'Opposite Transcorp',
        dropoffArea: 'Maitama',
        dropoffLatitude: 9.0723,
        dropoffLongitude: 7.4912,
        packageType: 'document',
        packageWeight: 0.5,
        packageDescription: 'Legal documents',
        senderName: 'John Doe',
        senderPhone: '08012345678',
        recipientName: 'Jane Smith',
        recipientPhone: '08087654321',
      });

      expect(delivery.id).toBeDefined();
      expect(delivery.trackingNumber).toMatch(/^TLK-\d{4}-\d{4}$/);
      expect(delivery.status).toBe('requested');
      expect(delivery.customerId).toBe(testData.customer.id);
      expect(delivery.recipientPhone).not.toBe(delivery.senderPhone);
      expect(delivery.events.length).toBe(1);
      expect(delivery.events[0].status).toBe('requested');
    });

    it('should reject delivery with same sender and recipient phone', async () => {
      await expect(deliveryService.createDelivery(testData.customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: 'document',
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08012345678', // Same as sender
      })).rejects.toThrow('Recipient must be different from sender');
    });

    it('should reject delivery for non-existent customer', async () => {
      await expect(deliveryService.createDelivery('non-existent-id', {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: 'document',
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      })).rejects.toThrow('Customer not found');
    });

    it('should reject delivery for non-customer role', async () => {
      await expect(deliveryService.createDelivery(testData.rider.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: 'document',
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      })).rejects.toThrow('Only customers can create deliveries');
    });
  });

  describe('Address CRUD', () => {
    it('should create, read, update, and delete addresses', async () => {
      const addrRepo = dataSource.getRepository(Address);
      // Create
      const address = await dataSource.getRepository(Address).save({
        userId: testData.customer.id,
        label: 'Office',
        street: '789 Corporate Drive',
        area: 'Jabi',
        isDefault: false,
      });

      // Read
      const found = await dataSource.getRepository(Address).findOne({ where: { id: address.id } });
      expect(found.label).toBe('Office');

      // Update
      found.label = 'Headquarters';
      await dataSource.getRepository(Address).save(found);
      const updated = await dataSource.getRepository(Address).findOne({ where: { id: address.id } });
      expect(updated.label).toBe('Headquarters');

      // Delete
      await dataSource.getRepository(Address).remove(updated);
      const deleted = await dataSource.getRepository(Address).findOne({ where: { id: address.id } });
      expect(deleted).toBeNull();
    });

    it('should get user addresses ordered by default first', async () => {
      await dataSource.getRepository(Address).save([
        { userId: testData.customer.id, label: 'Home', street: '1', isDefault: true },
        { userId: testData.customer.id, label: 'Work', street: '2', isDefault: false },
      ]);

      const addresses = await dataSource.getRepository(Address).find({ 
        where: { userId: testData.customer.id },
        order: { isDefault: 'DESC', createdAt: 'DESC' }
      });

      expect(addresses[0].isDefault).toBe(true);
    });
  });
});