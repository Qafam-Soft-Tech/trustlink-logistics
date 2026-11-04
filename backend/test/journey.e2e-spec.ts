import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { User, UserRole, KycStatus } from '../src/modules/auth/entities/user.entity';
import { OtpCode } from '../src/modules/auth/entities/otp-code.entity';

const OTP = '123456';
const RECIPIENT_OTP = '654321';
process.env.OTP_TEST_CODE = OTP;
process.env.RECIPIENT_OTP_TEST_CODE = RECIPIENT_OTP;

describe('MVP journey (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let otpRepository: Repository<OtpCode>;

  let adminToken: string;
  let customerToken: string;
  let riderToken: string;
  let riderId: string;
  let deliveryId: string;
  let fare: number;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    configureApp(app);
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    otpRepository = moduleFixture.get<Repository<OtpCode>>(getRepositoryToken(OtpCode));

    await otpRepository.clear();
    await userRepository.query('TRUNCATE TABLE "recipient_otps"');
    await userRepository.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');

    await userRepository.save(userRepository.create({
      phone: '08000000001',
      email: 'journey-admin@trustlink.ng',
      firstName: 'Journey',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      passwordHash: await bcrypt.hash('journey-admin-pass', 10),
      isActive: true,
      isPhoneVerified: true,
      kycStatus: KycStatus.APPROVED,
    }));

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/admin/login')
      .send({ email: 'journey-admin@trustlink.ng', password: 'journey-admin-pass' })
      .expect(201);
    adminToken = adminLogin.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('runs customer signup → payment → dispatch → rider delivery → POD → rider release', async () => {
    const customerPhone = '08070000001';
    const riderPhone = '08070000002';
    const recipientPhone = '08070000003';

    // 1. Customer signup and OTP verification.
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ phone: customerPhone, firstName: 'Journey', lastName: 'Customer', role: 'customer' })
      .expect(201);
    const customerVerify = await request(app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({ phone: customerPhone, code: OTP })
      .expect(201);
    customerToken = customerVerify.body.token;

    // 2. Rider signup, profile, KYC, admin approval, online.
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ phone: riderPhone, firstName: 'Journey', lastName: 'Rider', role: 'rider' })
      .expect(201);
    const riderVerify = await request(app.getHttpServer())
      .post('/api/auth/verify-otp')
      .send({ phone: riderPhone, code: OTP })
      .expect(201);
    riderToken = riderVerify.body.token;
    riderId = riderVerify.body.user.id;

    await request(app.getHttpServer())
      .post('/api/auth/profile/setup')
      .set(auth(riderToken))
      .send({ firstName: 'Journey', lastName: 'Rider', vehicleType: 'motorcycle', vehiclePlate: 'JRN 001' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/kyc/submit')
      .set(auth(riderToken))
      .send({
        nin: '12345678901',
        idType: 'nin',
        idFrontUrl: 'https://example.com/id-front.jpg',
        idBackUrl: 'https://example.com/id-back.jpg',
        selfieUrl: 'https://example.com/selfie.jpg',
        vehicleRegistrationUrl: 'https://example.com/vehicle.jpg',
        vehicleType: 'motorcycle',
        vehiclePlate: 'JRN 001',
      })
      .expect(201);

    await request(app.getHttpServer())
      .put(`/api/kyc/${riderId}/approve`)
      .set(auth(adminToken))
      .expect(200);

    await request(app.getHttpServer())
      .put('/api/rider/profile/status/set')
      .set(auth(riderToken))
      .send({ status: 'online' })
      .expect(200);

    // 3. Customer creates a delivery.
    const delivery = await request(app.getHttpServer())
      .post('/api/deliveries')
      .set(auth(customerToken))
      .send({
        pickupStreet: '1 Journey Way',
        pickupArea: 'Wuse 2',
        pickupLatitude: 9.077,
        pickupLongitude: 7.479,
        dropoffStreet: '2 Journey Way',
        dropoffArea: 'Maitama',
        dropoffLatitude: 9.088,
        dropoffLongitude: 7.495,
        packageType: 'document',
        packageWeight: 1,
        senderName: 'Journey Customer',
        senderPhone: customerPhone,
        recipientName: 'Journey Recipient',
        recipientPhone,
      })
      .expect(201);
    deliveryId = delivery.body.id;
    fare = Number(delivery.body.fare);
    expect(fare).toBeGreaterThan(0);

    // 4. Payment initializes and verifies; delivery becomes SEARCHING.
    const payment = await request(app.getHttpServer())
      .post('/api/payments/initialize')
      .set(auth(customerToken))
      .send({
        deliveryId,
        amount: Math.round(fare * 100),
        email: 'journey-customer@trustlink.ng',
        phone: customerPhone,
        provider: 'paystack',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/payments/verify/${payment.body.reference}`)
      .set(auth(customerToken))
      .expect(201);

    const searching = await request(app.getHttpServer())
      .get(`/api/deliveries/${deliveryId}`)
      .set(auth(customerToken))
      .expect(200);
    expect(searching.body.status).toBe('searching');

    // 5. Admin assigns the online, approved rider.
    const assigned = await request(app.getHttpServer())
      .put(`/api/dispatch/${deliveryId}/assign`)
      .set(auth(adminToken))
      .send({ riderId })
      .expect(200);
    expect(assigned.body.status).toBe('assigned');

    // 6. Rider acknowledges, picks up, and goes in transit.
    await request(app.getHttpServer())
      .post(`/api/dispatch/${deliveryId}/acknowledge`)
      .set(auth(riderToken))
      .expect(201);
    await request(app.getHttpServer())
      .put(`/api/deliveries/${deliveryId}/pickup`)
      .set(auth(riderToken))
      .expect(200);
    await request(app.getHttpServer())
      .put(`/api/deliveries/${deliveryId}/in-transit`)
      .set(auth(riderToken))
      .expect(200);

    // 7. POD with the recipient code; rider is released.
    const delivered = await request(app.getHttpServer())
      .post(`/api/deliveries/${deliveryId}/complete`)
      .set(auth(riderToken))
      .send({
        photoUrl: 'https://example.com/pod.jpg',
        recipientOtp: RECIPIENT_OTP,
        recipientName: 'Journey Recipient',
        recipientPhone,
        notes: 'Journey e2e',
      })
      .expect(201);
    expect(delivered.body.status).toBe('delivered');

    const proof = await request(app.getHttpServer())
      .get(`/api/deliveries/${deliveryId}/proof`)
      .set(auth(customerToken))
      .expect(200);
    expect(proof.body.photoUrl).toBe('https://example.com/pod.jpg');

    const riderProfile = await request(app.getHttpServer())
      .get('/api/rider/profile')
      .set(auth(riderToken))
      .expect(200);
    expect(riderProfile.body.status).toBe('online');

    const history = await request(app.getHttpServer())
      .get('/api/deliveries')
      .set(auth(customerToken))
      .expect(200);
    expect(Array.isArray(history.body)).toBe(true);
    expect(history.body[0].status).toBe('delivered');

    const report = await request(app.getHttpServer())
      .get('/api/admin/reports/summary')
      .set(auth(adminToken))
      .expect(200);
    expect(report.body.totals.deliveries).toBeGreaterThanOrEqual(1);
    expect(report.body.totals.delivered).toBeGreaterThanOrEqual(1);
  }, 60000);
});
