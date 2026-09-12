jest.mock('@nestjs/typeorm', () => ({
  getRepositoryToken: jest.fn((entity) => `repository_${entity.name}`),
  InjectRepository: () => jest.fn(),
  TypeOrmModule: {
    forFeature: jest.fn(() => []),
  },
}));

import { KycService } from '../src/modules/users/services/kyc.service';
import { KycSubmission, KycStatus, KycDocumentType } from '../src/modules/users/entities/kyc-submission.entity';
import { User, UserRole } from '../src/modules/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';

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

  find = jest.fn().mockImplementation(async (options?: any) => {
    let results = [...this.items];
    
    if (options?.where) {
      const where = options.where;
      results = results.filter(item => {
        if (typeof where === 'object' && where !== null) {
          return Object.entries(where).every(([key, value]) => item[key] === value);
        }
        return false;
      });
    }
    
    if (options?.order) {
      const [key, direction] = Object.entries(options.order)[0];
      results.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (direction === 'ASC') return aVal > bVal ? 1 : -1;
        return aVal < bVal ? 1 : -1;
      });
    }
    
    return results;
  });

  create = jest.fn().mockImplementation((entity: any) => entity);

  save = jest.fn().mockImplementation(async (entity: any) => {
    const existingIndex = this.items.findIndex(item => item.id === entity.id);
    if (existingIndex >= 0) {
      this.items[existingIndex] = entity;
    } else {
      this.items.push(entity);
    }
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

describe('KycService', () => {
  let service: KycService;
  let kycRepository: MockRepository<KycSubmission>;
  let userRepository: MockRepository<User>;

  beforeEach(() => {
    kycRepository = new MockRepository<KycSubmission>();
    userRepository = new MockRepository<User>();
    service = new KycService(kycRepository as any, userRepository as any);
    jest.clearAllMocks();
  });

  const mockRider = {
    id: 'rider-1',
    phone: '08011112222',
    firstName: 'Mike',
    lastName: 'Johnson',
    role: UserRole.RIDER,
    kycStatus: KycStatus.PENDING,
  };

  const mockCustomer = {
    id: 'customer-1',
    phone: '08022223333',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CUSTOMER,
    kycStatus: KycStatus.PENDING,
  };

  const validKycData = {
    nin: '12345678901',
    idType: KycDocumentType.NIN,
    idFrontUrl: 'https://example.com/id_front.jpg',
    idBackUrl: 'https://example.com/id_back.jpg',
    selfieUrl: 'https://example.com/selfie.jpg',
    vehicleRegistrationUrl: 'https://example.com/vehicle_reg.jpg',
    vehicleType: 'motorcycle',
    vehiclePlate: 'ABC 123 XY',
  };

  describe('submitKyc', () => {
    it('should submit KYC successfully for a rider with valid data', async () => {
      userRepository.setItems([mockRider]);
      userRepository.findOne.mockResolvedValue(mockRider);

      const result = await service.submitKyc(mockRider.id, validKycData);

      expect(result).toBeDefined();
      expect(result.userId).toBe(mockRider.id);
      expect(result.nin).toBe(validKycData.nin);
      expect(result.status).toBe(KycStatus.PENDING);
      expect(kycRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.submitKyc('non-existent', validKycData))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a rider', async () => {
      userRepository.setItems([mockCustomer]);
      userRepository.findOne.mockResolvedValue(mockCustomer);

      await expect(service.submitKyc(mockCustomer.id, validKycData))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if NIN is invalid (too short)', async () => {
      userRepository.findOne.mockResolvedValue(mockRider);

      await expect(service.submitKyc(mockRider.id, { ...validKycData, nin: '12345' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if NIN is invalid (too long)', async () => {
      userRepository.findOne.mockResolvedValue(mockRider);

      await expect(service.submitKyc(mockRider.id, { ...validKycData, nin: '123456789012' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if NIN is missing', async () => {
      userRepository.findOne.mockResolvedValue(mockRider);

      await expect(service.submitKyc(mockRider.id, { ...validKycData, nin: '' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if required documents are missing', async () => {
      userRepository.findOne.mockResolvedValue(mockRider);

      await expect(service.submitKyc(mockRider.id, { ...validKycData, idFrontUrl: '' }))
        .rejects.toThrow(BadRequestException);

      await expect(service.submitKyc(mockRider.id, { ...validKycData, idBackUrl: '' }))
        .rejects.toThrow(BadRequestException);

      await expect(service.submitKyc(mockRider.id, { ...validKycData, selfieUrl: '' }))
        .rejects.toThrow(BadRequestException);

      await expect(service.submitKyc(mockRider.id, { ...validKycData, vehicleRegistrationUrl: '' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if vehicle type is missing', async () => {
      userRepository.findOne.mockResolvedValue(mockRider);

      await expect(service.submitKyc(mockRider.id, { ...validKycData, vehicleType: '' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if vehicle plate is missing', async () => {
      userRepository.findOne.mockResolvedValue(mockRider);

      await expect(service.submitKyc(mockRider.id, { ...validKycData, vehiclePlate: '' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if KYC already approved', async () => {
      userRepository.findOne.mockResolvedValue(mockRider);
      const existingSubmission = {
        id: 'sub-1',
        userId: mockRider.id,
        status: KycStatus.APPROVED,
      };
      kycRepository.setItems([existingSubmission]);
      kycRepository.findOne.mockResolvedValue(existingSubmission);

      await expect(service.submitKyc(mockRider.id, validKycData))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if KYC already pending', async () => {
      userRepository.findOne.mockResolvedValue(mockRider);
      const existingSubmission = {
        id: 'sub-1',
        userId: mockRider.id,
        status: KycStatus.PENDING,
      };
      kycRepository.setItems([existingSubmission]);
      kycRepository.findOne.mockResolvedValue(existingSubmission);

      await expect(service.submitKyc(mockRider.id, validKycData))
        .rejects.toThrow(BadRequestException);
    });

    it('should allow resubmission if KYC was rejected', async () => {
      userRepository.findOne.mockResolvedValue(mockRider);
      const existingSubmission = {
        id: 'sub-1',
        userId: mockRider.id,
        status: KycStatus.REJECTED,
        nin: 'old-nin',
        rejectionReason: 'Invalid documents',
        reviewedBy: 'admin-1',
        reviewedAt: new Date(),
      };
      kycRepository.setItems([existingSubmission]);
      kycRepository.findOne.mockResolvedValue(existingSubmission);
      kycRepository.save.mockResolvedValue({ ...existingSubmission, ...validKycData, status: KycStatus.PENDING, rejectionReason: null, reviewedBy: null, reviewedAt: null });

      const result = await service.submitKyc(mockRider.id, validKycData);

      expect(result.status).toBe(KycStatus.PENDING);
      expect(result.rejectionReason).toBeNull();
      expect(result.reviewedBy).toBeNull();
      expect(result.reviewedAt).toBeNull();
      expect(result.nin).toBe(validKycData.nin);
    });
  });

  describe('getKycStatus', () => {
    it('should return KYC submission if exists', async () => {
      const submission = {
        id: 'sub-1',
        userId: mockRider.id,
        status: KycStatus.PENDING,
        nin: '12345678901',
      };
      kycRepository.setItems([submission]);
      kycRepository.findOne.mockResolvedValue(submission);

      const result = await service.getKycStatus(mockRider.id);

      expect(result).toEqual(submission);
    });

    it('should return null if no submission exists', async () => {
      kycRepository.findOne.mockResolvedValue(null);

      const result = await service.getKycStatus(mockRider.id);

      expect(result).toBeNull();
    });
  });

  describe('approveKyc', () => {
    it('should approve KYC and update user status', async () => {
      const submission = {
        id: 'sub-1',
        userId: mockRider.id,
        status: KycStatus.PENDING,
        nin: '12345678901',
      };
      const admin = { id: 'admin-1', firstName: 'Admin', lastName: 'User', role: UserRole.ADMIN };
      
      userRepository.setItems([mockRider, admin]);
      userRepository.findOne.mockImplementation(async (options: any) => {
        if (options.where.id === mockRider.id) return mockRider;
        if (options.where.id === admin.id) return admin;
        return null;
      });
      kycRepository.setItems([submission]);
      kycRepository.findOne.mockResolvedValue(submission);

      const result = await service.approveKyc(admin.id, mockRider.id);

      expect(result.status).toBe(KycStatus.APPROVED);
      expect(result.reviewedBy).toBe(admin.id);
      expect(result.reviewedAt).toBeDefined();
      expect(result.rejectionReason).toBeNull();
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ kycStatus: KycStatus.APPROVED }));
    });

    it('should throw NotFoundException if submission does not exist', async () => {
      kycRepository.findOne.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue({ id: 'admin-1', role: UserRole.ADMIN });

      await expect(service.approveKyc('admin-1', 'non-existent'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already approved', async () => {
      const submission = { id: 'sub-1', userId: mockRider.id, status: KycStatus.APPROVED };
      kycRepository.setItems([submission]);
      kycRepository.findOne.mockResolvedValue(submission);
      userRepository.findOne.mockResolvedValue({ id: 'admin-1', role: UserRole.ADMIN });

      await expect(service.approveKyc('admin-1', mockRider.id))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectKyc', () => {
    it('should reject KYC with reason and update user status', async () => {
      const submission = {
        id: 'sub-1',
        userId: mockRider.id,
        status: KycStatus.PENDING,
        nin: '12345678901',
      };
      const admin = { id: 'admin-1', firstName: 'Admin', lastName: 'User', role: UserRole.ADMIN };
      
      userRepository.setItems([mockRider, admin]);
      userRepository.findOne.mockImplementation(async (options: any) => {
        if (options.where.id === mockRider.id) return mockRider;
        if (options.where.id === admin.id) return admin;
        return null;
      });
      kycRepository.setItems([submission]);
      kycRepository.findOne.mockResolvedValue(submission);

      const result = await service.rejectKyc(admin.id, mockRider.id, 'Invalid NIN document');

      expect(result.status).toBe(KycStatus.REJECTED);
      expect(result.reviewedBy).toBe(admin.id);
      expect(result.reviewedAt).toBeDefined();
      expect(result.rejectionReason).toBe('Invalid NIN document');
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({ kycStatus: KycStatus.REJECTED }));
    });

    it('should throw NotFoundException if submission does not exist', async () => {
      kycRepository.findOne.mockResolvedValue(null);
      userRepository.findOne.mockResolvedValue({ id: 'admin-1', role: UserRole.ADMIN });

      await expect(service.rejectKyc('admin-1', 'non-existent', 'Reason'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already rejected', async () => {
      const submission = { id: 'sub-1', userId: mockRider.id, status: KycStatus.REJECTED };
      kycRepository.setItems([submission]);
      kycRepository.findOne.mockResolvedValue(submission);
      userRepository.findOne.mockResolvedValue({ id: 'admin-1', role: UserRole.ADMIN });

      await expect(service.rejectKyc('admin-1', mockRider.id, 'Reason'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if rejection reason is empty', async () => {
      const submission = { id: 'sub-1', userId: mockRider.id, status: KycStatus.PENDING };
      kycRepository.setItems([submission]);
      kycRepository.findOne.mockResolvedValue(submission);
      userRepository.findOne.mockResolvedValue({ id: 'admin-1', role: UserRole.ADMIN });

      await expect(service.rejectKyc('admin-1', mockRider.id, ''))
        .rejects.toThrow(BadRequestException);

      await expect(service.rejectKyc('admin-1', mockRider.id, '   '))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getPendingKycSubmissions', () => {
    it('should return only pending submissions ordered by createdAt', async () => {
      const submissions = [
        { id: 'sub-1', userId: 'rider-1', status: KycStatus.PENDING, createdAt: new Date('2024-01-15') },
        { id: 'sub-2', userId: 'rider-2', status: KycStatus.PENDING, createdAt: new Date('2024-01-10') },
        { id: 'sub-3', userId: 'rider-3', status: KycStatus.APPROVED, createdAt: new Date('2024-01-12') },
        { id: 'sub-4', userId: 'rider-4', status: KycStatus.REJECTED, createdAt: new Date('2024-01-14') },
      ];
      kycRepository.setItems(submissions);
      kycRepository.find.mockImplementation(async (options?: any) => {
        let results = [...submissions];
        if (options?.where) {
          const where = options.where;
          results = results.filter(item => {
            if (typeof where === 'object' && where !== null) {
              return Object.entries(where).every(([key, value]) => item[key] === value);
            }
            return false;
          });
        }
        if (options?.order) {
          const [key, direction] = Object.entries(options.order)[0];
          results.sort((a, b) => {
            const aVal = new Date(a[key]).getTime();
            const bVal = new Date(b[key]).getTime();
            if (direction === 'ASC') return aVal - bVal;
            return bVal - aVal;
          });
        }
        return results;
      });

      const result = await service.getPendingKycSubmissions();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('sub-2'); // Earlier date first (ASC)
      expect(result[1].id).toBe('sub-1');
      expect(result.every(s => s.status === KycStatus.PENDING)).toBe(true);
    });
  });

  describe('canRiderGoOnline', () => {
    it('should return true for rider with APPROVED KYC', async () => {
      const approvedRider = { ...mockRider, kycStatus: KycStatus.APPROVED };
      userRepository.setItems([approvedRider]);
      userRepository.findOne.mockResolvedValue(approvedRider);

      const result = await service.canRiderGoOnline(mockRider.id);

      expect(result).toBe(true);
    });

    it('should return false for rider with PENDING KYC', async () => {
      userRepository.setItems([mockRider]);
      userRepository.findOne.mockResolvedValue(mockRider);

      const result = await service.canRiderGoOnline(mockRider.id);

      expect(result).toBe(false);
    });

    it('should return false for rider with REJECTED KYC', async () => {
      const rejectedRider = { ...mockRider, kycStatus: KycStatus.REJECTED };
      userRepository.setItems([rejectedRider]);
      userRepository.findOne.mockResolvedValue(rejectedRider);

      const result = await service.canRiderGoOnline(mockRider.id);

      expect(result).toBe(false);
    });

    it('should return false for non-existent rider', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.canRiderGoOnline('non-existent');

      expect(result).toBe(false);
    });
  });
});