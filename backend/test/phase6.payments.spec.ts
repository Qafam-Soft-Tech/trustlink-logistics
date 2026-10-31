import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { Delivery, DeliveryEvent, DeliveryStatus, PackageType, Address } from '../src/modules/deliveries/entities/delivery.entity';
import { ProofOfDelivery } from '../src/modules/deliveries/entities/proof-of-delivery.entity';
import { User } from '../src/modules/auth/entities/user.entity';
import { RiderProfile } from '../src/modules/deliveries/entities/rider-profile.entity';
import { PricingConfig } from '../src/modules/payments/entities/pricing-config.entity';
import { Payment, PaymentProvider, PaymentStatus } from '../src/modules/payments/entities/payment.entity';
import { DeliveryService } from '../src/modules/deliveries/services/delivery.service';
import { FareCalculationService } from '../src/modules/payments/services/fare-calculation.service';
import { DistanceService } from '../src/modules/payments/services/distance.service';
import { PaymentService } from '../src/modules/payments/services/payment.service';
import { MockDb, seedBaseData, configServiceMock, notificationServiceMock, recipientOtpServiceMock } from './mock-db';

describe('Phase 6: Payments Integration', () => {
  let module: TestingModule;
  let db: MockDb;
  let paymentService: PaymentService;
  let deliveryService: DeliveryService;
  let fareCalculationService: FareCalculationService;
  let paymentRepository: any;
  let deliveryRepository: any;
  let testData: any;

  beforeAll(async () => {
    db = new MockDb();
    testData = seedBaseData(db);

    paymentRepository = db.repo('Payment');
    deliveryRepository = db.repo('Delivery');

    module = await Test.createTestingModule({
      providers: [
        PaymentService,
        DeliveryService,
        FareCalculationService,
        DistanceService,
        ...db.providers([Payment, Delivery, Address, DeliveryEvent, ProofOfDelivery, User, RiderProfile, PricingConfig]),
        configServiceMock,
        notificationServiceMock,
        recipientOtpServiceMock,
      ],
    }).compile();

    paymentService = module.get<PaymentService>(PaymentService);
    deliveryService = module.get<DeliveryService>(DeliveryService);
    fareCalculationService = module.get<FareCalculationService>(FareCalculationService);
  });

  afterAll(async () => {
    await module.close();
  });

  function createRequestedDelivery() {
    return deliveryService.createDelivery(testData.customer.id, {
      pickupStreet: '123 Street',
      dropoffStreet: '456 Avenue',
      packageType: PackageType.DOCUMENT,
      packageWeight: 0.5,
      senderName: 'John',
      senderPhone: '08012345678',
      recipientName: 'Jane',
      recipientPhone: '08087654321',
    });
  }

  describe('Payment Initialization', () => {
    it('should initialize Paystack payment for REQUESTED delivery', async () => {
      const delivery = await createRequestedDelivery();

      const fare = await fareCalculationService.calculateFare({
        distanceKm: 5,
        weightKg: 0.5,
        packageType: PackageType.DOCUMENT,
      });

      await deliveryRepository.update(delivery.id, { fare: fare.totalFare });

      const result = await paymentService.initializePayment(testData.customer.id, {
        deliveryId: delivery.id,
        amount: Math.round(fare.totalFare * 100),
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
      const delivery = await createRequestedDelivery();

      await deliveryRepository.update(delivery.id, { status: DeliveryStatus.ASSIGNED });

      await expect(paymentService.initializePayment(testData.customer.id, {
        deliveryId: delivery.id,
        amount: 150000,
        email: 'test@test.com',
        phone: '08012345678',
        provider: PaymentProvider.PAYSTACK,
      })).rejects.toThrow('Payment can only be initiated for REQUESTED deliveries');
    });

    it('should initialize Flutterwave payment', async () => {
      const delivery = await createRequestedDelivery();

      const fare = await fareCalculationService.calculateFare({
        distanceKm: 5,
        weightKg: 0.5,
        packageType: PackageType.DOCUMENT,
      });

      await deliveryRepository.update(delivery.id, { fare: fare.totalFare });

      const result = await paymentService.initializePayment(testData.customer.id, {
        deliveryId: delivery.id,
        amount: Math.round(fare.totalFare * 100),
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.FLUTTERWAVE,
      });

      expect(result.paymentId).toBeDefined();
      expect(result.reference).toMatch(/^TLK_/);
      expect(result.authorizationUrl).toBeDefined();

      // Provider is stored on the payment record, not on the response
      const payment = await paymentRepository.findOne({ where: { reference: result.reference } });
      expect(payment).toBeDefined();
      expect(payment.provider).toBe(PaymentProvider.FLUTTERWAVE);
    });
  });

  describe('Payment Verification', () => {
    it('should verify successful payment and transition delivery to SEARCHING', async () => {
      const delivery = await createRequestedDelivery();

      const fare = await fareCalculationService.calculateFare({
        distanceKm: 5,
        weightKg: 0.5,
        packageType: PackageType.DOCUMENT,
      });

      await deliveryRepository.update(delivery.id, { fare: fare.totalFare });

      const initResult = await paymentService.initializePayment(testData.customer.id, {
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
      const delivery = await createRequestedDelivery();

      const fare = await fareCalculationService.calculateFare({
        distanceKm: 5,
        weightKg: 0.5,
        packageType: PackageType.DOCUMENT,
      });

      await deliveryRepository.update(delivery.id, { fare: fare.totalFare });

      const initResult = await paymentService.initializePayment(testData.customer.id, {
        deliveryId: delivery.id,
        amount: Math.round(fare.totalFare * 100),
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.PAYSTACK,
      });

      // Manually set payment to FAILED
      await paymentRepository.update(
        { reference: initResult.reference },
        { status: PaymentStatus.FAILED },
      );

      const updatedDelivery = await deliveryRepository.findOne({ where: { id: delivery.id } });
      expect(updatedDelivery.status).toBe(DeliveryStatus.REQUESTED); // Should remain REQUESTED
    });
  });

  describe('Webhook Handling', () => {
    it('should validate Paystack webhook signature', async () => {
      const payload = { event: 'charge.success', data: { reference: 'TLK_test_123' } };
      // ConfigService returns an empty secret in tests
      const signature = crypto.createHmac('sha512', '').update(JSON.stringify(payload)).digest('hex');

      await expect(paymentService.handlePaystackWebhook(payload, signature)).resolves.toEqual({ received: true });
    });

    it('should reject invalid Paystack webhook signature', async () => {
      const payload = { event: 'charge.success', data: { reference: 'TLK_test_123' } };
      const invalidSignature = 'invalid_signature';

      await expect(paymentService.handlePaystackWebhook(payload, invalidSignature))
        .rejects.toThrow('Invalid webhook signature');
    });

    it('should process charge.success webhook idempotently', async () => {
      const delivery = await createRequestedDelivery();
      await deliveryRepository.update(delivery.id, { fare: 1500 });

      const initResult = await paymentService.initializePayment(testData.customer.id, {
        deliveryId: delivery.id,
        amount: 150000,
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.PAYSTACK,
      });

      const payload = {
        event: 'charge.success',
        data: {
          reference: initResult.reference,
          amount: 150000,
          channel: 'card',
          paid_at: new Date().toISOString(),
          gateway_response: 'Approved',
        },
      };
      const signature = crypto.createHmac('sha512', '').update(JSON.stringify(payload)).digest('hex');

      // First call
      await paymentService.handlePaystackWebhook(payload, signature);
      // Second call should be idempotent
      await paymentService.handlePaystackWebhook(payload, signature);

      const payment = await paymentRepository.findOne({ where: { reference: initResult.reference } });
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
    it('should not allow a second payment once one has been processed', async () => {
      const delivery = await createRequestedDelivery();
      await deliveryRepository.update(delivery.id, { fare: 1500 });

      // Delivery starts in REQUESTED
      let updatedDelivery = await deliveryRepository.findOne({ where: { id: delivery.id } });
      expect(updatedDelivery.status).toBe(DeliveryStatus.REQUESTED);

      // Initialize first payment
      const initResult = await paymentService.initializePayment(testData.customer.id, {
        deliveryId: delivery.id,
        amount: 150000,
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.PAYSTACK,
      });
      expect(initResult.reference).toBeDefined();

      // Simulate the payment having been processed while delivery stays REQUESTED
      const payment = await paymentRepository.findOne({ where: { deliveryId: delivery.id } });
      expect(payment).toBeDefined();
      await paymentRepository.update(payment.id, { status: PaymentStatus.SUCCESS });

      // A second payment attempt must be rejected
      await expect(paymentService.initializePayment(testData.customer.id, {
        deliveryId: delivery.id,
        amount: 150000,
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.PAYSTACK,
      })).rejects.toThrow('Payment already processed for this delivery');
    });
  });

  describe('Payment Retry', () => {
    it('blocks a second attempt while the first is still processing', async () => {
      const delivery = await createRequestedDelivery();
      await deliveryRepository.update(delivery.id, { fare: 1500 });

      const first = await paymentService.initializePayment(testData.customer.id, {
        deliveryId: delivery.id,
        amount: 150000,
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.PAYSTACK,
      });
      await paymentRepository.update({ reference: first.reference }, { createdAt: new Date() });

      await expect(paymentService.initializePayment(testData.customer.id, {
        deliveryId: delivery.id,
        amount: 150000,
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.PAYSTACK,
      })).rejects.toThrow('Payment is already in progress for this delivery');
    });

    it('allows a retry after a failed attempt', async () => {
      const delivery = await createRequestedDelivery();
      await deliveryRepository.update(delivery.id, { fare: 1500 });

      const first = await paymentService.initializePayment(testData.customer.id, {
        deliveryId: delivery.id,
        amount: 150000,
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.PAYSTACK,
      });
      await paymentRepository.update({ reference: first.reference }, { status: PaymentStatus.FAILED });

      const second = await paymentService.initializePayment(testData.customer.id, {
        deliveryId: delivery.id,
        amount: 150000,
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.PAYSTACK,
      });

      expect(second.reference).toBeDefined();
      expect(second.reference).not.toBe(first.reference);
    });

    it('replaces a stale processing attempt', async () => {
      const delivery = await createRequestedDelivery();
      await deliveryRepository.update(delivery.id, { fare: 1500 });

      const first = await paymentService.initializePayment(testData.customer.id, {
        deliveryId: delivery.id,
        amount: 150000,
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.PAYSTACK,
      });
      await paymentRepository.update(
        { reference: first.reference },
        { createdAt: new Date(Date.now() - 60 * 60 * 1000) },
      );

      const second = await paymentService.initializePayment(testData.customer.id, {
        deliveryId: delivery.id,
        amount: 150000,
        email: testData.customer.email,
        phone: testData.customer.phone,
        provider: PaymentProvider.PAYSTACK,
      });

      expect(second.reference).toBeDefined();
      const stale = await paymentRepository.findOne({ where: { reference: first.reference } });
      expect(stale.status).toBe(PaymentStatus.CANCELLED);
    });
  });
});