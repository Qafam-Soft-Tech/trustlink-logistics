import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

import { AppModule } from '../src/app.module';
import { User, UserRole } from '../src/modules/auth/entities/user.entity';
import { configureApp } from '../src/app.setup';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

describe('M2 backend integrity (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  let customer: User;
  let rider: User;
  let admin: User;
  let customerToken: string;
  let riderToken: string;
  let adminToken: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const deliveryBody = () => ({
    pickupStreet: '1 Ahmadu Bello Way',
    pickupArea: 'Wuse 2',
    pickupLatitude: 9.077,
    pickupLongitude: 7.479,
    dropoffStreet: '2 Shehu Shagari Way',
    dropoffArea: 'Maitama',
    dropoffLatitude: 9.088,
    dropoffLongitude: 7.495,
    packageType: 'document',
    packageWeight: 0.5,
    senderName: 'Customer One',
    senderPhone: customer.phone,
    recipientName: 'Recipient One',
    recipientPhone: '08099999999',
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    configureApp(app);
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await userRepository.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');

    customer = await userRepository.save(userRepository.create({
      phone: '08011111111',
      email: 'customer@m2.ng',
      firstName: 'Customer',
      lastName: 'One',
      role: UserRole.CUSTOMER,
      isActive: true,
      isPhoneVerified: true,
    }));
    rider = await userRepository.save(userRepository.create({
      phone: '08022222222',
      email: 'rider@m2.ng',
      firstName: 'Rider',
      lastName: 'One',
      role: UserRole.RIDER,
      isActive: true,
      isPhoneVerified: true,
    }));
    admin = await userRepository.save(userRepository.create({
      phone: '08033333333',
      email: 'admin@m2.ng',
      firstName: 'Admin',
      lastName: 'One',
      role: UserRole.ADMIN,
      isActive: true,
      isPhoneVerified: true,
    }));

    customerToken = jwtService.sign({ sub: customer.id, phone: customer.phone, role: customer.role });
    riderToken = jwtService.sign({ sub: rider.id, phone: rider.phone, role: rider.role });
    adminToken = jwtService.sign({ sub: admin.id, phone: admin.phone, role: admin.role });
  });

  const createDelivery = async () => {
    const response = await request(app.getHttpServer())
      .post('/api/deliveries')
      .set(auth(customerToken))
      .send(deliveryBody())
      .expect(201);
    return response.body;
  };

  describe('uploads', () => {
    it('accepts a PNG from an authenticated customer', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/uploads')
        .set(auth(customerToken))
        .attach('file', PNG, { filename: 'id.png', contentType: 'image/png' })
        .expect(201);

      expect(response.body.url).toContain('/uploads/');
    });

    it('rejects a non-image upload', async () => {
      await request(app.getHttpServer())
        .post('/api/uploads')
        .set(auth(riderToken))
        .attach('file', Buffer.from('not an image'), { filename: 'id.txt', contentType: 'text/plain' })
        .expect(400);
    });

    it('rejects an anonymous upload', async () => {
      await request(app.getHttpServer())
        .post('/api/uploads')
        .attach('file', PNG, { filename: 'id.png', contentType: 'image/png' })
        .expect(401);
    });
  });

  describe('fare authority and payment amount', () => {
    it('quotes from areas and stores the same fare on the delivery', async () => {
      const quote = await request(app.getHttpServer())
        .post('/api/pricing/calculate')
        .set(auth(customerToken))
        .send({ pickupArea: 'Wuse 2', dropoffArea: 'Maitama', weightKg: 0.5, packageType: 'document' })
        .expect(201);

      const delivery = await createDelivery();
      expect(Number(delivery.fare)).toBe(quote.body.totalFare);
      expect(Number(delivery.distanceKm)).toBeGreaterThan(0);
    });

    it('rejects a tampered payment amount', async () => {
      const delivery = await createDelivery();
      await request(app.getHttpServer())
        .post('/api/payments/initialize')
        .set(auth(customerToken))
        .send({
          deliveryId: delivery.id,
          amount: Math.round(Number(delivery.fare) * 100) + 100,
          email: customer.email,
          phone: customer.phone,
          provider: 'paystack',
        })
        .expect(400);
    });

    it('blocks a second payment while the first is processing', async () => {
      const delivery = await createDelivery();
      const amount = Math.round(Number(delivery.fare) * 100);

      await request(app.getHttpServer())
        .post('/api/payments/initialize')
        .set(auth(customerToken))
        .send({ deliveryId: delivery.id, amount, email: customer.email, phone: customer.phone, provider: 'paystack' })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/payments/initialize')
        .set(auth(customerToken))
        .send({ deliveryId: delivery.id, amount, email: customer.email, phone: customer.phone, provider: 'paystack' })
        .expect(400);
    });
  });

  describe('pagination', () => {
    it('returns an envelope when page/limit are supplied and an array otherwise', async () => {
      await createDelivery();
      await createDelivery();

      const paginated = await request(app.getHttpServer())
        .get('/api/deliveries?page=1&limit=1')
        .set(auth(customerToken))
        .expect(200);
      expect(paginated.body.items).toHaveLength(1);
      expect(paginated.body.total).toBe(2);

      const plain = await request(app.getHttpServer())
        .get('/api/deliveries')
        .set(auth(customerToken))
        .expect(200);
      expect(Array.isArray(plain.body)).toBe(true);
      expect(plain.body).toHaveLength(2);
    });
  });

  describe('account deletion', () => {
    it('anonymizes a customer with no active deliveries', async () => {
      await request(app.getHttpServer())
        .delete('/api/users/me')
        .set(auth(customerToken))
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set(auth(customerToken))
        .expect(401);

      const stored = await userRepository.findOne({ where: { id: customer.id } });
      expect(stored?.isActive).toBe(false);
      expect(stored?.deletedAt).toBeDefined();
    });

    it('blocks deletion while a delivery is active', async () => {
      await createDelivery();

      await request(app.getHttpServer())
        .delete('/api/users/me')
        .set(auth(customerToken))
        .expect(400);
    });
  });

  describe('notification read state', () => {
    it('tracks unread and marks all as read', async () => {
      const delivery = await createDelivery();

      await request(app.getHttpServer())
        .post('/api/notifications/send')
        .set(auth(adminToken))
        .send({
          deliveryId: delivery.id,
          userId: customer.id,
          channel: 'push',
          title: 'Test notification',
          body: 'Hello',
        })
        .expect(201);

      const before = await request(app.getHttpServer())
        .get('/api/notifications/unread-count')
        .set(auth(customerToken))
        .expect(200);
      expect(before.body.unread).toBe(1);

      await request(app.getHttpServer())
        .put('/api/notifications/read-all')
        .set(auth(customerToken))
        .expect(200);

      const after = await request(app.getHttpServer())
        .get('/api/notifications/unread-count')
        .set(auth(customerToken))
        .expect(200);
      expect(after.body.unread).toBe(0);
    });
  });

  describe('reports', () => {
    it('returns an operational summary to admins and blocks customers', async () => {
      await createDelivery();

      const response = await request(app.getHttpServer())
        .get('/api/admin/reports/summary')
        .set(auth(adminToken))
        .expect(200);

      expect(response.body.totals.deliveries).toBeGreaterThanOrEqual(1);
      expect(response.body.deliveriesPerDay).toHaveLength(7);
      expect(typeof response.body.revenue).toBe('number');

      await request(app.getHttpServer())
        .get('/api/admin/reports/summary')
        .set(auth(customerToken))
        .expect(403);
    });
  });
});
