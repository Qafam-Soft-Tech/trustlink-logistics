import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

import { AppModule } from '../src/app.module';
import { User, UserRole } from '../src/modules/auth/entities/user.entity';
import { configureApp } from '../src/app.setup';

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  let customer: User;
  let rider: User;
  let admin: User;
  let customerToken: string;
  let riderToken: string;
  let adminToken: string;

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

    customer = await userRepository.save(
      userRepository.create({
        phone: '08011111111',
        email: 'customer@test.ng',
        firstName: 'Customer',
        lastName: 'One',
        role: UserRole.CUSTOMER,
        isActive: true,
        isPhoneVerified: true,
      }),
    );
    rider = await userRepository.save(
      userRepository.create({
        phone: '08022222222',
        email: 'rider@test.ng',
        firstName: 'Rider',
        lastName: 'One',
        role: UserRole.RIDER,
        isActive: true,
        isPhoneVerified: true,
      }),
    );
    admin = await userRepository.save(
      userRepository.create({
        phone: '08033333333',
        email: 'admin@test.ng',
        firstName: 'Admin',
        lastName: 'One',
        role: UserRole.ADMIN,
        isActive: true,
        isPhoneVerified: true,
      }),
    );

    customerToken = jwtService.sign({ sub: customer.id, phone: customer.phone, role: customer.role });
    riderToken = jwtService.sign({ sub: rider.id, phone: rider.phone, role: rider.role });
    adminToken = jwtService.sign({ sub: admin.id, phone: admin.phone, role: admin.role });
  });

  const get = (path: string, token?: string) => {
    const req = request(app.getHttpServer()).get(path);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  const post = (path: string, token?: string, body: object = {}) => {
    const req = request(app.getHttpServer()).post(path).send(body);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  describe('unauthenticated access', () => {
    it('rejects protected delivery routes', async () => {
      await get('/api/deliveries').expect(401);
    });

    it('rejects the admin user list', async () => {
      await get('/api/users').expect(401);
    });
  });

  describe('cross-role denials', () => {
    it('blocks customers from admin user management', async () => {
      await get('/api/users', customerToken).expect(403);
    });

    it('blocks riders from admin user management', async () => {
      await get('/api/users', riderToken).expect(403);
    });

    it('blocks customers from the dispatch board', async () => {
      await get('/api/dispatch/board', customerToken).expect(403);
    });

    it('blocks riders from the dispatch board', async () => {
      await get('/api/dispatch/board', riderToken).expect(403);
    });

    it('blocks riders from the admin delivery list', async () => {
      await get('/api/deliveries/all', riderToken).expect(403);
    });

    it('blocks customers from pricing configuration', async () => {
      await get('/api/pricing/config', customerToken).expect(403);
    });

    it('blocks customers from KYC routes', async () => {
      await get('/api/kyc/status', customerToken).expect(403);
    });

    it('blocks customers from sending notifications', async () => {
      await post('/api/notifications/send', customerToken).expect(403);
    });
  });

  describe('permitted access', () => {
    it('allows customers to list their deliveries', async () => {
      await get('/api/deliveries', customerToken).expect(200);
    });

    it('allows riders to read their KYC status', async () => {
      await get('/api/kyc/status', riderToken).expect(200);
    });

    it('allows admins to read their board and user list', async () => {
      await get('/api/dispatch/board', adminToken).expect(200);
      await get('/api/users', adminToken).expect(200);
      await get('/api/pricing/config', adminToken).expect(200);
    });

    it('does not serialize password hashes to admins', async () => {
      const response = await get('/api/users', adminToken).expect(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('validation still applies to permitted roles', () => {
    it('rejects an empty rider KYC submission with 400', async () => {
      await post('/api/kyc/submit', riderToken, {}).expect(400);
    });

    it('rejects an empty admin notification with 400', async () => {
      await post('/api/notifications/send', adminToken, {}).expect(400);
    });
  });
});
