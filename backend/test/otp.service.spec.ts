jest.mock('@nestjs/typeorm', () => ({
  getRepositoryToken: jest.fn((entity) => `repository_${entity.name}`),
  InjectRepository: () => jest.fn(),
}));

import { Repository } from 'typeorm';
import { OtpService } from '../src/modules/auth/services/otp.service';
import { OtpCode } from '../src/modules/auth/entities/otp-code.entity';
import { TermiiSmsService } from '../src/modules/auth/services/termii-sms.service';

class MockRepository<T> {
  private items: T[] = [];
  
  findOne = jest.fn().mockImplementation(async (options: any) => {
    if (options?.where) {
      const where = options.where;
      return this.items.find(item => {
        if (typeof where === 'object' && where !== null) {
          return Object.entries(where).every(([key, value]) => item[key] === value);
        }
        return false;
      }) || null;
    }
    return this.items[0] || null;
  });

  create = jest.fn().mockImplementation((entity: any) => entity);

  save = jest.fn().mockImplementation(async (entity: any) => {
    const existingIndex = this.items.findIndex(item => item.id === entity.id);
    if (existingIndex >= 0) {
      this.items[existingIndex] = { ...this.items[existingIndex], ...entity };
      return this.items[existingIndex];
    }
    this.items.push(entity);
    return entity;
  });

  update = jest.fn().mockImplementation(async (criteria: any, partial: any) => {
    const index = this.items.findIndex(item => {
      if (typeof criteria === 'object' && criteria !== null) {
        return Object.entries(criteria).every(([key, value]) => item[key] === value);
      }
      return item.id === criteria;
    });
    if (index >= 0) {
      this.items[index] = { ...this.items[index], ...partial };
      return { affected: 1 };
    }
    return { affected: 0 };
  });

  clear = jest.fn().mockImplementation(async () => {
    this.items = [];
  });

  setItems(items: T[]) {
    this.items = items;
  }

  getItems() {
    return this.items;
  }
}

describe('OtpService', () => {
  let service: OtpService;
  let otpRepository: MockRepository<OtpCode>;
  let termiiSms: jest.Mocked<TermiiSmsService>;

  beforeEach(() => {
    otpRepository = new MockRepository<OtpCode>();
    termiiSms = { sendOtp: jest.fn().mockResolvedValue(true) } as any;
    service = new OtpService(otpRepository as any, termiiSms);
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit numeric code', () => {
      const code = (service as any).generateOtp();
      expect(code).toMatch(/^\d{6}$/);
      expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code)).toBeLessThanOrEqual(999999);
    });

    it('should generate different codes on subsequent calls', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add((service as any).generateOtp());
      }
      expect(codes.size).toBeGreaterThan(1);
    });
  });

  describe('sendOtp', () => {
    const phone = '08012345678';
    const purpose = 'signup';

    it('should create new OTP when none exists', async () => {
      await service.sendOtp(phone, purpose);

      expect(otpRepository.findOne).toHaveBeenCalledWith({
        where: { phone, purpose, isUsed: false },
      });
      expect(otpRepository.create).toHaveBeenCalled();
      expect(otpRepository.save).toHaveBeenCalled();
    });

    it('should update existing OTP when one exists', async () => {
      const existingOtp = {
        id: '1',
        phone,
        code: 'oldcode',
        purpose,
        attempts: 0,
        isUsed: false,
        expiresAt: new Date(),
        createdAt: new Date(),
      };
      otpRepository.setItems([existingOtp]);
      otpRepository.findOne.mockResolvedValue(existingOtp);
      otpRepository.save.mockResolvedValue({ ...existingOtp, code: 'newcode' });

      await service.sendOtp(phone, purpose);

      expect(otpRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          phone,
          purpose,
          isUsed: false,
          attempts: 0,
        })
      );
    });
  });

  describe('verifyOtp', () => {
    const phone = '08012345678';
    const code = '123456';
    const purpose = 'signup';

    it('should return true for valid OTP', async () => {
      const otpEntity = {
        id: '1',
        phone,
        code,
        purpose,
        attempts: 0,
        isUsed: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
      };
      otpRepository.findOne.mockResolvedValue(otpEntity);

      const result = await service.verifyOtp(phone, code, purpose);

      expect(result).toBe(true);
      expect(otpEntity.isUsed).toBe(true);
      expect(otpRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should return false for non-existent OTP', async () => {
      otpRepository.findOne.mockResolvedValue(null);

      const result = await service.verifyOtp(phone, 'wrongcode', purpose);

      expect(result).toBe(false);
    });

    it('should return false for expired OTP', async () => {
      const otpEntity = {
        id: '1',
        phone,
        code,
        purpose,
        attempts: 0,
        isUsed: false,
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
      };
      otpRepository.findOne.mockResolvedValue(otpEntity);

      const result = await service.verifyOtp(phone, code, purpose);

      expect(result).toBe(false);
    });

    it('should return false when max attempts exceeded', async () => {
      const otpEntity = {
        id: '1',
        phone,
        code,
        purpose,
        attempts: 3,
        isUsed: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
      };
      otpRepository.findOne.mockResolvedValue(otpEntity);

      const result = await service.verifyOtp(phone, code, purpose);

      expect(result).toBe(false);
    });

    it('should increment attempts on wrong code', async () => {
      const otpEntity = {
        id: '1',
        phone,
        code: 'correctcode',
        purpose,
        attempts: 0,
        isUsed: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
      };
      otpRepository.findOne.mockResolvedValue(otpEntity);

      const result = await service.verifyOtp(phone, 'wrongcode', purpose);

      expect(result).toBe(false);
      expect(otpEntity.attempts).toBe(1);
      expect(otpRepository.save).toHaveBeenCalled();
    });

    it('should mark OTP as used on correct verification', async () => {
      const otpEntity = {
        id: '1',
        phone,
        code,
        purpose,
        attempts: 0,
        isUsed: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date(),
        save: jest.fn().mockResolvedValue(undefined),
      };
      otpRepository.findOne.mockResolvedValue(otpEntity);

      await service.verifyOtp(phone, code, purpose);

      expect(otpEntity.isUsed).toBe(true);
    });
  });
});