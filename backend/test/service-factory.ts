import { Repository, DataSource } from 'typeorm';
import { DeliveryService } from '../src/modules/deliveries/services/delivery.service';
import { DispatchService } from '../src/modules/deliveries/services/dispatch.service';
import { FareCalculationService } from '../src/modules/payments/services/fare-calculation.service';
import { PaymentService } from '../src/modules/payments/services/payment.service';
import { NotificationService } from '../src/modules/notifications/services/notification.service';
import { IssueService } from '../src/modules/deliveries/services/issue.service';
import { KycService } from '../src/modules/users/services/kyc.service';
import { OtpService } from '../src/modules/auth/services/otp.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { User, UserRole, KycStatus } from '../src/modules/auth/entities/user.entity';
import { OtpCode } from '../src/modules/auth/entities/otp-code.entity';
import { Delivery, DeliveryStatus, PackageType, Address, DeliveryEvent, ProofOfDelivery } from '../src/modules/deliveries/entities/delivery.entity';
import { RiderProfile, VehicleType, RiderStatus } from '../src/modules/deliveries/entities/rider-profile.entity';
import { KycSubmission, KycDocumentType } from '../src/modules/users/entities/kyc-submission.entity';
import { PricingConfig, PricingConfigKey, DEFAULT_PRICING_CONFIG } from '../src/modules/payments/entities/pricing-config.entity';
import { Payment, PaymentProvider, PaymentStatus, PaymentChannel } from '../src/modules/payments/entities/payment.entity';
import { Notification, NotificationChannel, NotificationStatus } from '../src/modules/notifications/entities/notification.entity';
import { Issue, IssueStatus, IssueType, IssuePriority } from '../src/modules/deliveries/entities/issue.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface TestRepositories {
  userRepository: any;
  otpRepository: any;
  deliveryRepository: any;
  addressRepository: any;
  riderProfileRepository: any;
  kycSubmissionRepository: any;
  proofOfDeliveryRepository: any;
  pricingConfigRepository: any;
  paymentRepository: any;
  notificationRepository: any;
  issueRepository: any;
}

export function createTestRepositories(dataSource: any): TestRepositories {
  return {
    userRepository: dataSource.getRepository('User'),
    otpRepository: dataSource.getRepository('OtpCode'),
    deliveryRepository: dataSource.getRepository('Delivery'),
    addressRepository: dataSource.getRepository('Address'),
    riderProfileRepository: dataSource.getRepository('RiderProfile'),
    kycSubmissionRepository: dataSource.getRepository('KycSubmission'),
    proofOfDeliveryRepository: dataSource.getRepository('ProofOfDelivery'),
    pricingConfigRepository: dataSource.getRepository('PricingConfig'),
    paymentRepository: dataSource.getRepository('Payment'),
    notificationRepository: dataSource.getRepository('Notification'),
    issueRepository: dataSource.getRepository('Issue'),
  };
}

export function createMockNotificationService() {
  return {
    notifyDeliveryStatusChange: jest.fn().mockResolvedValue(undefined),
    sendNotification: jest.fn().mockResolvedValue({}),
    notifyDeliveryStatusChange: jest.fn().mockResolvedValue(undefined),
    getCancellationPreview: jest.fn().mockResolvedValue({ canCancel: true, fee: 0, refundAmount: 100, reason: 'Free cancellation' }),
    cancelDeliveryWithFee: jest.fn().mockResolvedValue({ cancelled: true, fee: 0, refundAmount: 100 }),
  };
}

export function createMockConfigService() {
  return {
    get: (key: string) => {
      if (key === 'PAYSTACK_SECRET_KEY') return 'test-secret';
      if (key === 'FLUTTERWAVE_SECRET_KEY') return 'test-secret';
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_EXPIRES_IN') return '7d';
      return '';
    },
  };
}

export function createMockJwtService() {
  return {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ sub: 'test-user-id', phone: '08012345678', role: 'customer' }),
  };
}

export async function createTestDeliveryService(repos: TestRepositories) {
  const notificationService = createMockNotificationService();
  
  // Create a minimal DeliveryService instance with mocked repositories
  const service = new (require('../src/modules/deliveries/services/delivery.service').DeliveryService)(
    repos.deliveryRepository,
    repos.addressRepository,
    repos.proofOfDeliveryRepository,
    repos.userRepository,
    notificationService
  );
  
  // Override the private repositories to use our test repositories
  Object.defineProperty(service, 'deliveryRepository', { value: repos.deliveryRepository, writable: true });
  Object.defineProperty(service, 'addressRepository', { value: repos.addressRepository, writable: true });
  Object.defineProperty(service, 'proofOfDeliveryRepository', { value: repos.proofOfDeliveryRepository, writable: true });
  Object.defineProperty(service, 'userRepository', { value: repos.userRepository, writable: true });
  Object.defineProperty(service, 'notificationService', { value: notificationService, writable: true });
  
  return service;
}

export async function createTestDispatchService(repos: TestRepositories) {
  const service = new (require('../src/modules/deliveries/services/dispatch.service').DispatchService)(
    repos.deliveryRepository,
    repos.riderProfileRepository,
    repos.userRepository,
  );
  
  Object.defineProperty(service, 'deliveryRepository', { value: repos.deliveryRepository, writable: true });
  Object.defineProperty(service, 'riderProfileRepository', { value: repos.riderProfileRepository, writable: true });
  Object.defineProperty(service, 'userRepository', { value: repos.userRepository, writable: true });
  
  return service;
}

export async function createTestFareCalculationService(repos: TestRepositories) {
  const service = new (require('../src/modules/payments/services/fare-calculation.service').FareCalculationService)(
    repos.pricingConfigRepository
  );
  
  Object.defineProperty(service, 'pricingConfigRepository', { value: repos.pricingConfigRepository, writable: true });
  
  return service;
}

export async function createTestPaymentService(repos: TestRepositories) {
  const configService = createMockConfigService();
  
  const service = new (require('../src/modules/payments/services/payment.service').PaymentService)(
    repos.paymentRepository,
    repos.deliveryRepository,
    configService,
  );
  
  Object.defineProperty(service, 'paymentRepository', { value: repos.paymentRepository, writable: true });
  Object.defineProperty(service, 'deliveryRepository', { value: repos.deliveryRepository, writable: true });
  Object.defineProperty(service, 'configService', { value: configService, writable: true });
  
  return service;
}

export async function createTestNotificationService(repos: TestRepositories) {
  const configService = createMockConfigService();
  
  const service = new (require('../src/modules/notifications/services/notification.service').NotificationService)(
    repos.notificationRepository,
    repos.deliveryRepository,
    repos.userRepository,
    configService,
  );
  
  Object.defineProperty(service, 'notificationRepository', { value: repos.notificationRepository, writable: true });
  Object.defineProperty(service, 'deliveryRepository', { value: repos.deliveryRepository, writable: true });
  Object.defineProperty(service, 'userRepository', { value: repos.userRepository, writable: true });
  Object.defineProperty(service, 'configService', { value: configService, writable: true });
  
  return service;
}

export async function createTestIssueService(repos: TestRepositories) {
  const service = new (require('../src/modules/deliveries/services/issue.service').IssueService)(
    repos.issueRepository,
    repos.deliveryRepository,
    repos.proofOfDeliveryRepository,
    repos.userRepository,
  );
  
  Object.defineProperty(service, 'issueRepository', { value: repos.issueRepository, writable: true });
  Object.defineProperty(service, 'deliveryRepository', { value: repos.deliveryRepository, writable: true });
  Object.defineProperty(service, 'proofOfDeliveryRepository', { value: repos.proofOfDeliveryRepository, writable: true });
  Object.defineProperty(service, 'userRepository', { value: repos.userRepository, writable: true });
  
  return service;
}

export async function createTestKycService(repos: TestRepositories) {
  const service = new (require('../src/modules/users/services/kyc.service').KycService)(
    repos.kycSubmissionRepository,
    repos.userRepository,
  );
  
  Object.defineProperty(service, 'kycRepository', { value: repos.kycSubmissionRepository, writable: true });
  Object.defineProperty(service, 'userRepository', { value: repos.userRepository, writable: true });
  
  return service;
}

export async function createTestOtpService(repos: TestRepositories) {
  const service = new (require('../src/modules/auth/services/otp.service').OtpService)(
    repos.otpRepository,
  );
  
  Object.defineProperty(service, 'otpRepository', { value: repos.otpRepository, writable: true });
  
  return service;
}

export async function createTestAuthService(repos: TestRepositories) {
  const jwtService = createMockJwtService();
  const configService = createMockConfigService();
  
  const service = new (require('../src/modules/auth/auth.service').AuthService)(
    repos.userRepository,
    repos.otpRepository,
    jwtService,
    configService,
  );
  
  Object.defineProperty(service, 'userRepository', { value: repos.userRepository, writable: true });
  Object.defineProperty(service, 'otpRepository', { value: repos.otpRepository, writable: true });
  Object.defineProperty(service, 'jwtService', { value: jwtService, writable: true });
  Object.defineProperty(service, 'configService', { value: configService, writable: true });
  
  return service;
}