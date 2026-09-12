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
import { KycController } from '../src/modules/users/kyc.controller';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { Roles } from '../src/common/decorators/roles.decorator';
import { CurrentUser } from '../src/common/decorators/current-user.decorator';
import { TestFactory, setupTestModule, teardownTestModule, seedTestData } from './setup';
import * as crypto from 'crypto';

describe('Phase 6: Payments Integration', () => {
  let module: TestingModule;
  let dataSource: any;
  let paymentService: PaymentService;
  let deliveryService: DeliveryService;
  let fareCalculationService: FareCalculationService;
  let paymentRepository: Repository<any>;
  let deliveryRepository: Repository<any>;
  let userRepository: Repository<any>;
  let testData: any;

  beforeAll(async () => {
    dataSource = await TestFactory.setupTestModule();
    testData = await TestFactory.seedTestData(dataSource);

    paymentRepository = dataSource.getRepository('Payment');
    deliveryRepository = dataSource.getRepository('Delivery');
    userRepository = dataSource.getRepository('User');

    module = await Test.createTestingModule({
      providers: [
        PaymentService,
        DeliveryService,
        FareCalculationService,
        {
          provide: 'PaymentRepository',
          useValue: paymentRepository,
        },
        {
          provide: 'DeliveryRepository',
          useValue: deliveryRepository,
        },
        {
          provide: 'UserRepository',
          useValue: userRepository,
        },
        {
          provide: 'ConfigService',
          useValue: {
            get: (key: string) => {
              if (key === 'PAYSTACK_SECRET_KEY') return 'test-secret';
              if (key === 'FLUTTERWAVE_SECRET_KEY') return 'test-secret';
              return '';
            },
          },
        },
      ],
    }).compile();

    paymentService = module.get<PaymentService>(PaymentService);
    deliveryService = module.get<DeliveryService>(DeliveryService);
    fareCalculationService = module.get<FareCalculationService>(FareCalculationService);
  });

  afterAll(async () => {
    await teardownTestModule(dataSource);
    await module.close();
  });

  describe('Payment Initialization', () => {
    it('should initialize Paystack payment for REQUESTED delivery', async () => {
      // Create a delivery
      const delivery = await deliveryService.createDelivery(testData.customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      });

      // Calculate fare
      const fare = await fareCalculationService.calculateFare({
        distanceKm: 5,
        weightKg: 0.5,
        packageType: PackageType.DOCUMENT,
      });

      // Set fare on delivery
      await deliveryRepository.update(delivery.id, { fare: fare.totalFare });

      // Initialize payment
      const result = await paymentService.initializePayment({
        deliveryId: delivery.id,
        amount: Math.round(fare.totalFare * 100), // Convert to kobo
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.PAYSTACK,
      });

      expect(result.paymentId).toBeDefined();
      expect(result.reference).toMatch(/^TLK_/);
      expect(result.authorizationUrl).toBeDefined();
      expect(result.status).toBe(PaymentStatus.PROCESSING);

      // Verify payment record
      const payment = await paymentRepository.findOne({ where: { reference: result.reference } });
      expect(payment).toBeDefined();
      expect(payment.amount).toBe(Math.round(fare.totalFare * 100));
      expect(payment.provider).toBe(PaymentProvider.PAYSTACK);
      expect(payment.status).toBe(PaymentStatus.PROCESSING);
    });

    it('should reject payment for non-REQUESTED delivery', async () => {
      const delivery = await deliveryService.createDelivery(testData.customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      });

      // Set status to ASSIGNED
      await deliveryRepository.update(delivery.id, { status: DeliveryStatus.ASSIGNED });

      await expect(paymentService.initializePayment({
        deliveryId: delivery.id,
        amount: 150000,
        email: 'test@test.com',
        phone: '08012345678',
        provider: PaymentProvider.PAYSTACK,
      })).rejects.toThrow('Payment can only be initiated for REQUESTED deliveries');
    });

    it('should initialize Flutterwave payment', async () => {
      const delivery = await deliveryService.createDelivery(testData.customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      });

      const fare = await fareCalculationService.calculateFare({
        distanceKm: 5,
        weightKg: 0.5,
        packageType: PackageType.DOCUMENT,
      });

      await deliveryRepository.update(delivery.id, { fare: fare.totalFare });

      const result = await paymentService.initializePayment({
        deliveryId: delivery.id,
        amount: Math.round(fare.totalFare * 100),
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.FLUTTERWAVE,
      });

      expect(result.paymentId).toBeDefined();
      expect(result.reference).toMatch(/^TLK_/);
      expect(result.authorizationUrl).toBeDefined();
      expect(result.provider).toBe(PaymentProvider.FLUTTERWAVE);
    });
  });

  describe('Payment Verification', () => {
    it('should verify successful payment and transition delivery to SEARCHING', async () => {
      const delivery = await deliveryService.createDelivery(testData.customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      });

      const fare = await fareCalculationService.calculateFare({
        distanceKm: 5,
        weightKg: 0.5,
        packageType: PackageType.DOCUMENT,
      });

      await deliveryRepository.update(delivery.id, { fare: fare.totalFare });

      const initResult = await paymentService.initializePayment({
        deliveryId: delivery.id,
        amount: Math.round(fare.totalFare * 100),
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.PAYSTACK,
      });

      // Verify payment (mock will return SUCCESS)
      const verifyResult = await paymentService.verifyPayment(initResult.reference);

      expect(verifyResult.status).toBe(PaymentStatus.SUCCESS);
      expect(verifyResult.amount).toBeDefined();
      expect(verifyResult.paidAt).toBeDefined();

      // Check delivery status transitioned to SEARCHING
      const updatedDelivery = await deliveryRepository.findOne({ where: { id: delivery.id } });
      expect(updatedDelivery.status).toBe(DeliveryStatus.SEARCHING);
      expect(updatedDelivery.paymentReference).toBe(initResult.reference);
    });

    it('should handle failed payment', async () => {
      const delivery = await deliveryService.createDelivery(testData.customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      });

      const fare = await fareCalculationService.calculateFare({
        distanceKm: 5,
        weightKg: 0.5,
        packageType: PackageType.DOCUMENT,
      });

      await deliveryRepository.update(delivery.id, { fare: fare.totalFare });

      const initResult = await paymentService.initializePayment({
        deliveryId: delivery.id,
        amount: Math.round(fare.totalFare * 100),
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.PAYSTACK,
      });

      // Manually set payment to FAILED
      await paymentRepository.update(
        { reference: initResult.reference },
        { status: PaymentStatus.FAILED }
      );

      const updatedDelivery = await deliveryRepository.findOne({ where: { id: delivery.id } });
      expect(updatedDelivery.status).toBe(DeliveryStatus.REQUESTED); // Should remain REQUESTED
    });
  });

  describe('Webhook Handling', () => {
    it('should validate Paystack webhook signature', async () => {
      const payload = { event: 'charge.success', data: { reference: 'TLK_test_123' } };
      const secret = 'test-secret';
      const signature = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');

      // This should not throw
      await expect(paymentService.handlePaystackWebhook(payload, signature)).resolves.toEqual({ received: true });
    });

    it('should reject invalid Paystack webhook signature', async () => {
      const payload = { event: 'charge.success', data: { reference: 'TLK_test_123' } };
      const invalidSignature = 'invalid_signature';

      await expect(paymentService.handlePaystackWebhook(payload, invalidSignature))
        .rejects.toThrow('Invalid webhook signature');
    });

    it('should process charge.success webhook idempotently', async () => {
      const reference = 'TLK_test_' + Date.now();
      const payload = {
        event: 'charge.success',
        data: {
          reference,
          amount: 150000,
          channel: 'card',
          paid_at: new Date().toISOString(),
          gateway_response: 'Approved',
        },
      };
      const secret = 'test-secret';
      const signature = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');

      // First call
      await paymentService.handlePaystackWebhook(payload, signature);

      // Second call should be idempotent
      await paymentService.handlePaystackWebhook(payload, signature);

      const payment = await paymentRepository.findOne({ where: { reference } });
      expect(payment).toBeDefined();
      expect(payment.status).toBe(PaymentStatus.SUCCESS);
    });

    it('should reject invalid Flutterwave webhook signature', async () => {
      const payload = { event: 'charge.completed', data: { tx_ref: 'TLK_test_123' } };
      const invalidSignature = 'invalid_signature';

      await expect(paymentService.handleFlutterwaveWebhook(payload, invalidSignature))
        .rejects.toThrow('Invalid webhook signature');
    });
  });

  describe('Payment State Enforcement', () => {
    it('should not allow delivery to reach SEARCHING without confirmed payment', async () => {
      const delivery = await deliveryService.createDelivery(testData.customer.id, {
        pickupStreet: '123 Street',
        dropoffStreet: '456 Avenue',
        packageType: PackageType.DOCUMENT,
        packageWeight: 0.5,
        senderName: 'John',
        senderPhone: '08012345678',
        recipientName: 'Jane',
        recipientPhone: '08087654321',
      });

      // Delivery should be REQUESTED
      let updatedDelivery = await deliveryRepository.findOne({ where: { id: delivery.id } });
      expect(updatedDelivery.status).toBe(DeliveryStatus.REQUESTED);

      // Try to manually set to SEARCHING without payment - should fail validation
      await expect(deliveryRepository.update(delivery.id, { status: DeliveryStatus.SEARCHING }))
        .rejects.toThrow(); // DB constraint or service validation
    });
  });
});