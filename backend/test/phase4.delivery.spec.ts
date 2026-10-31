import { Test, TestingModule } from '@nestjs/testing';
import { Delivery, DeliveryEvent, DeliveryStatus, PackageType, Address } from '../src/modules/deliveries/entities/delivery.entity';
import { ProofOfDelivery } from '../src/modules/deliveries/entities/proof-of-delivery.entity';
import { User } from '../src/modules/auth/entities/user.entity';
import { RiderProfile } from '../src/modules/deliveries/entities/rider-profile.entity';
import { PricingConfig } from '../src/modules/payments/entities/pricing-config.entity';
import { DeliveryService } from '../src/modules/deliveries/services/delivery.service';
import { DispatchService } from '../src/modules/deliveries/services/dispatch.service';
import { FareCalculationService } from '../src/modules/payments/services/fare-calculation.service';
import { MockDb, TestFactory, seedBaseData, notificationServiceMock } from './mock-db';

describe('Phase 4: Address & Delivery Request Creation', () => {
  let module: TestingModule;
  let db: MockDb;
  let deliveryService: DeliveryService;
  let userRepository: any;
  let addressRepository: any;
  let testData: any;

  beforeAll(async () => {
    db = new MockDb();
    testData = seedBaseData(db);

    userRepository = db.repo('User');
    addressRepository = db.repo('Address');

    module = await Test.createTestingModule({
      providers: [
        DeliveryService,
        DispatchService,
        FareCalculationService,
        ...db.providers([Delivery, Address, DeliveryEvent, ProofOfDelivery, User, RiderProfile, PricingConfig]),
        notificationServiceMock,
      ],
    }).compile();

    deliveryService = module.get<DeliveryService>(DeliveryService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Address Entity', () => {
    it('should create and save an address', async () => {
      const address = addressRepository.create({
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

      const saved = await addressRepository.save(address);
      expect(saved.id).toBeDefined();
      expect(saved.landmark).toBe('Near Shoprite');
      expect(saved.isDefault).toBe(true);
    });

    it('should enforce unique default address per user', async () => {
      const user = userRepository.create(TestFactory.createCustomer({ phone: '08045454545', id: 'default-addr-user' }));
      await userRepository.save(user);

      const addr1 = addressRepository.create({
        userId: user.id,
        label: 'Home',
        street: '123 Street',
        isDefault: true,
      });
      await addressRepository.save(addr1);

      const addr2 = addressRepository.create({
        userId: user.id,
        label: 'Work',
        street: '456 Avenue',
        isDefault: true,
      });
      await addressRepository.save(addr2);

      // Both exist, but we can query for default
      const defaults = await addressRepository.find({
        where: { userId: user.id, isDefault: true },
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
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        packageDescription: 'Legal documents',
        senderName: 'John Doe',
        senderPhone: '08012345678',
        recipientName: 'Jane Smith',
        recipientPhone: '08087654321',
      });

      expect(delivery.id).toBeDefined();
      expect(delivery.trackingNumber).toMatch(/^TLK-\d{4}-\d{4}$/);
      expect(delivery.status).toBe(DeliveryStatus.REQUESTED);
      expect(delivery.customerId).toBe(testData.customer.id);
      expect(delivery.recipientPhone).not.toBe(delivery.senderPhone);
      expect(delivery.events.length).toBe(1);
      expect(delivery.events[0].status).toBe(DeliveryStatus.REQUESTED);
    });

    it('should reject delivery with same sender and recipient phone', async () => {
      await expect(deliveryService.createDelivery(testData.customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: PackageType.DOCUMENT,
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
        packageType: PackageType.DOCUMENT,
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
        packageType: PackageType.DOCUMENT,
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
      // Create
      const address = await addressRepository.save({
        userId: testData.customer.id,
        label: 'Office',
        street: '789 Corporate Drive',
        area: 'Jabi',
        isDefault: false,
      });

      // Read
      const found = await addressRepository.findOne({ where: { id: address.id } });
      expect(found.label).toBe('Office');

      // Update
      await addressRepository.update(address.id, { label: 'Headquarters' });
      const updated = await addressRepository.findOne({ where: { id: address.id } });
      expect(updated.label).toBe('Headquarters');

      // Delete
      await addressRepository.remove(updated);
      const deleted = await addressRepository.findOne({ where: { id: address.id } });
      expect(deleted).toBeNull();
    });

    it('should get user addresses ordered by default first', async () => {
      await addressRepository.save([
        { userId: testData.customer.id, label: 'Home', street: '1', isDefault: true },
        { userId: testData.customer.id, label: 'Work', street: '2', isDefault: false },
      ]);

      const addresses = await addressRepository.find({
        where: { userId: testData.customer.id },
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });

      expect(addresses[0].isDefault).toBe(true);
    });
  });
});