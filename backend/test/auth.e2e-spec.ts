import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/modules/auth/entities/user.entity';
import { OtpCode } from '../src/modules/auth/entities/otp-code.entity';
import { JwtService } from '@nestjs/jwt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let otpRepository: Repository<OtpCode>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    otpRepository = moduleFixture.get<Repository<OtpCode>>(getRepositoryToken(OtpCode));
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await otpRepository.clear();
    await userRepository.clear();
  });

  describe('/auth/signup (POST)', () => {
    it('should signup a new customer and return userId', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          phone: '08012345678',
          firstName: 'John',
          lastName: 'Doe',
          role: 'customer',
        })
        .expect(201);

      expect(response.body).toHaveProperty('userId');
      expect(response.body.message).toBe('OTP sent to phone number');

      const user = await userRepository.findOne({ where: { phone: '08012345678' } });
      expect(user).toBeDefined();
      expect(user?.role).toBe('customer');
      expect(user?.isPhoneVerified).toBe(false);
    });

    it('should signup a new rider and return userId', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          phone: '08023456789',
          firstName: 'Mike',
          lastName: 'Johnson',
          role: 'rider',
        })
        .expect(201);

      expect(response.body).toHaveProperty('userId');
      const user = await userRepository.findOne({ where: { phone: '08023456789' } });
      expect(user?.role).toBe('rider');
    });

    it('should reject duplicate phone with same role', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          phone: '08012345678',
          firstName: 'John',
          lastName: 'Doe',
          role: 'customer',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          phone: '08012345678',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'customer',
        })
        .expect(409);

      expect(response.body.message).toBe('User with this phone and role already exists');
    });

    it('should reject duplicate phone with different role', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          phone: '08012345678',
          firstName: 'John',
          lastName: 'Doe',
          role: 'customer',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          phone: '08012345678',
          firstName: 'Mike',
          lastName: 'Johnson',
          role: 'rider',
        })
        .expect(409);

      expect(response.body.message).toBe('Phone number already registered with a different role');
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          phone: '08012345678',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('/auth/verify-otp (POST)', () => {
    const phone = '08012345678';

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          phone,
          firstName: 'John',
          lastName: 'Doe',
          role: 'customer',
        });
    });

    it('should verify correct OTP and return user + token', async () => {
      const otp = await otpRepository.findOne({ where: { phone, purpose: 'signup' } });
      expect(otp).toBeDefined();

      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone, code: otp!.code })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.phone).toBe(phone);
      expect(response.body.user.isPhoneVerified).toBe(true);

      const user = await userRepository.findOne({ where: { phone } });
      expect(user?.isPhoneVerified).toBe(true);
    });

    it('should reject wrong OTP', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone, code: '000000' })
        .expect(401);

      expect(response.body.message).toBe('Invalid or expired OTP');
    });

    it('should reject expired OTP', async () => {
      await otpRepository.update({ phone }, { expiresAt: new Date(Date.now() - 1000) });

      const otp = await otpRepository.findOne({ where: { phone, purpose: 'signup' } });

      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone, code: otp!.code })
        .expect(401);

      expect(response.body.message).toBe('Invalid or expired OTP');
    });

    it('should reject after max attempts', async () => {
      await otpRepository.update({ phone }, { attempts: 3 });

      const otp = await otpRepository.findOne({ where: { phone, purpose: 'signup' } });

      const response = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone, code: otp!.code })
        .expect(401);

      expect(response.body.message).toBe('Invalid or expired OTP');
    });
  });

  describe('/auth/login (POST)', () => {
    const phone = '08012345678';

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ phone, firstName: 'John', lastName: 'Doe', role: 'customer' });
      const otp = await otpRepository.findOne({ where: { phone, purpose: 'signup' } });
      await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone, code: otp!.code });
    });

    it('should send login OTP for verified user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone })
        .expect(201);

      expect(response.body.message).toBe('OTP sent to phone number');
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: '08099999999' })
        .expect(401);

      expect(response.body.message).toBe('User not found');
    });

    it('should reject login for unverified user', async () => {
      const phone2 = '08023456789';
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ phone: phone2, firstName: 'Jane', lastName: 'Smith', role: 'customer' });

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: phone2 })
        .expect(401);

      expect(response.body.message).toBe('Phone not verified');
    });
  });

  describe('/auth/verify-login-otp (POST)', () => {
    const phone = '08012345678';

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ phone, firstName: 'John', lastName: 'Doe', role: 'customer' });
      const otp = await otpRepository.findOne({ where: { phone, purpose: 'signup' } });
      await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone, code: otp!.code });
    });

    it('should verify login OTP and return token', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone });

      const loginOtp = await otpRepository.findOne({ where: { phone, purpose: 'login' } });

      const response = await request(app.getHttpServer())
        .post('/auth/verify-login-otp')
        .send({ phone, code: loginOtp!.code })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
    });

    it('should reject wrong login OTP', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone });

      const response = await request(app.getHttpServer())
        .post('/auth/verify-login-otp')
        .send({ phone, code: '000000' })
        .expect(401);

      expect(response.body.message).toBe('Invalid or expired OTP');
    });
  });

  describe('/auth/profile (GET)', () => {
    const phone = '08012345678';
    let token: string;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ phone, firstName: 'John', lastName: 'Doe', role: 'customer' });
      const otp = await otpRepository.findOne({ where: { phone, purpose: 'signup' } });
      const verifyRes = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone, code: otp!.code });
      token = verifyRes.body.token;
    });

    it('should return profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.phone).toBe(phone);
      expect(response.body.firstName).toBe('John');
      expect(response.body.lastName).toBe('Doe');
      expect(response.body.role).toBe('customer');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/profile (PUT)', () => {
    const phone = '08012345678';
    let token: string;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ phone, firstName: 'John', lastName: 'Doe', role: 'customer' });
      const otp = await otpRepository.findOne({ where: { phone, purpose: 'signup' } });
      const verifyRes = await request(app.getHttpServer())
        .post('/auth/verify-otp')
        .send({ phone, code: otp!.code });
      token = verifyRes.body.token;
    });

    it('should update firstName and lastName', async () => {
      const response = await request(app.getHttpServer())
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Jane', lastName: 'Smith' })
        .expect(200);

      expect(response.body.firstName).toBe('Jane');
      expect(response.body.lastName).toBe('Smith');
    });

    it('should reject phone change', async () => {
      const response = await request(app.getHttpServer())
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '08099999999' })
        .expect(400);

      expect(response.body.message).toBe('Phone number cannot be changed');
    });

    it('should reject role change', async () => {
      const response = await request(app.getHttpServer())
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'rider' })
        .expect(400);

      expect(response.body.message).toBe('Role cannot be changed');
    });

    it('should allow email update', async () => {
      const response = await request(app.getHttpServer())
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'jane@example.com' })
        .expect(200);

      expect(response.body.email).toBe('jane@example.com');
    });
  });
});