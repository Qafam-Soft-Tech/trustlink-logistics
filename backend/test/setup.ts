import { DataSource, Repository, DeepPartial } from 'typeorm';
import { User, UserRole, KycStatus } from '../src/modules/auth/entities/user.entity';
import { OtpCode } from '../src/modules/auth/entities/otp-code.entity';
import { Delivery, DeliveryStatus, PackageType, Address, DeliveryEvent, ProofOfDelivery } from '../src/modules/deliveries/entities/delivery.entity';
import { RiderProfile, VehicleType, RiderStatus } from '../src/modules/deliveries/entities/rider-profile.entity';
import { KycSubmission, KycDocumentType } from '../src/modules/users/entities/kyc-submission.entity';
import { PricingConfig, PricingConfigKey, DEFAULT_PRICING_CONFIG } from '../src/modules/payments/entities/pricing-config.entity';
import { Payment, PaymentProvider, PaymentStatus, PaymentChannel } from '../src/modules/payments/entities/payment.entity';
import { Notification, NotificationChannel, NotificationStatus } from '../src/modules/notifications/entities/notification.entity';
import { Issue, IssueStatus, IssueType, IssuePriority } from '../src/modules/deliveries/entities/issue.entity';
import * as crypto from 'crypto';

let testDataSource: DataSource;

export const TestFactory = {
  createCustomer(overrides = {}) {
    return {
      id: crypto.randomUUID(),
      phone: '08012345678',
      email: 'customer@test.com',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.CUSTOMER,
      passwordHash: 'hashed',
      kycStatus: KycStatus.PENDING,
      isActive: true,
      isPhoneVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  createRider(overrides = {}) {
    return {
      id: crypto.randomUUID(),
      phone: '08087654321',
      email: 'rider@test.com',
      firstName: 'Mike',
      lastName: 'Johnson',
      role: UserRole.RIDER,
      passwordHash: 'hashed',
      kycStatus: KycStatus.APPROVED,
      isActive: true,
      isPhoneVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  createAdmin(overrides = {}) {
    return {
      id: crypto.randomUUID(),
      phone: '08011111111',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      passwordHash: 'hashed',
      kycStatus: KycStatus.APPROVED,
      isActive: true,
      isPhoneVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  createDelivery(overrides = {}) {
    return {
      id: crypto.randomUUID(),
      trackingNumber: `TLK-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      customerId: '',
      riderId: null,
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
      status: DeliveryStatus.REQUESTED,
      fare: 1500,
      paymentReference: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      events: [],
      ...overrides,
    };
  },

  createRiderProfile(overrides = {}) {
    return {
      id: crypto.randomUUID(),
      userId: '',
      vehicleType: VehicleType.MOTORCYCLE,
      vehiclePlate: 'ABC 123 XY',
      vehicleModel: 'Honda CG 125',
      vehicleColor: 'Red',
      zone: 'Wuse',
      status: RiderStatus.ONLINE,
      currentLatitude: 9.0579,
      currentLongitude: 7.4891,
      lastLocationUpdate: new Date(),
      rating: 4.9,
      totalDeliveries: 156,
      cancelledDeliveries: 2,
      failedDeliveries: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  createPricingConfig(key: PricingConfigKey, overrides = {}) {
    const defaultConfig = DEFAULT_PRICING_CONFIG[key];
    return {
      id: crypto.randomUUID(),
      key,
      value: defaultConfig.value,
      description: defaultConfig.description,
      ...overrides,
    };
  },
};

export async function setupTestModule() {
  const { DataSource } = await import('typeorm');
  
  testDataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [
      User, OtpCode, Delivery, DeliveryEvent, Address, ProofOfDelivery,
      RiderProfile, KycSubmission, PricingConfig, Payment, Notification, Issue
    ],
    synchronize: true,
    logging: false,
  });

  await testDataSource.initialize();
  global.__TEST_DATA_SOURCE__ = testDataSource;

  return testDataSource;
}

export async function teardownTestModule() {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
}

export async function seedTestData(dataSource: any) {
  const userRepo = dataSource.getRepository(User);
  const pricingRepo = dataSource.getRepository(PricingConfig);
  
  // Create test users
  const customer = userRepo.create({
    id: 'customer-1',
    phone: '08012345678',
    email: 'customer@test.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CUSTOMER,
    passwordHash: 'hashed',
    kycStatus: KycStatus.PENDING,
    isActive: true,
    isPhoneVerified: true,
  });

  const rider = userRepo.create({
    id: 'rider-1',
    phone: '08087654321',
    email: 'rider@test.com',
    firstName: 'Mike',
    lastName: 'Johnson',
    role: UserRole.RIDER,
    passwordHash: 'hashed',
    kycStatus: KycStatus.APPROVED,
    isActive: true,
    isPhoneVerified: true,
  });

  const admin = userRepo.create({
    id: 'admin-1',
    phone: '08011111111',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    passwordHash: 'hashed',
    kycStatus: KycStatus.APPROVED,
    isActive: true,
    isPhoneVerified: true,
  });

  await userRepo.save([customer, rider, admin]);

  // Create rider profile
  const riderProfileRepo = dataSource.getRepository('RiderProfile');
  const riderProfile = riderProfileRepo.create({
    id: 'rider-profile-1',
    userId: 'rider-1',
    vehicleType: 'motorcycle',
    vehiclePlate: 'ABC 123 XY',
    vehicleModel: 'Honda CG 125',
    vehicleColor: 'Red',
    zone: 'Wuse',
    status: 'online',
    currentLatitude: 9.0579,
    currentLongitude: 7.4891,
    lastLocationUpdate: new Date(),
    rating: 4.9,
    totalDeliveries: 156,
    cancelledDeliveries: 2,
    failedDeliveries: 1,
  });
  await riderProfileRepo.save(riderProfile);

  // Create pricing configs
  const pricingConfigs = Object.keys(DEFAULT_PRICING_CONFIG).map(key => 
    pricingRepo.create({
      id: `pricing-${key}`,
      key,
      value: DEFAULT_PRICING_CONFIG[key].value,
      description: DEFAULT_PRICING_CONFIG[key].description,
    })
  );
  await pricingRepo.save(pricingConfigs);

  return { customer, rider, admin, riderProfile };
}

export async function teardownTestModule() {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
}

export { TestFactory, setupTestModule, teardownTestModule, seedTestData };