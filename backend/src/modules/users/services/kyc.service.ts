import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { KycSubmission, KycStatus, KycDocumentType } from '../entities/kyc-submission.entity';
import { User, UserRole } from '../../auth/entities/user.entity';
import { Paginated, Pagination } from '../../../common/pagination';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycSubmission)
    private kycRepository: Repository<KycSubmission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async submitKyc(userId: string, data: {
    nin: string;
    idType: KycDocumentType;
    idFrontUrl: string;
    idBackUrl: string;
    selfieUrl: string;
    vehicleRegistrationUrl: string;
    vehicleType: string;
    vehiclePlate: string;
  }): Promise<KycSubmission> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.RIDER) {
      throw new ForbiddenException('Only riders can submit KYC');
    }

    if (!data.nin || data.nin.length !== 11) {
      throw new BadRequestException('Valid NIN (11 digits) is required');
    }

    if (!data.idFrontUrl || !data.idBackUrl || !data.selfieUrl || !data.vehicleRegistrationUrl) {
      throw new BadRequestException('All document uploads are required');
    }

    if (!data.vehicleType || !data.vehiclePlate) {
      throw new BadRequestException('Vehicle type and plate number are required');
    }

    let submission = await this.kycRepository.findOne({ where: { userId } });

    if (submission) {
      if (submission.status === KycStatus.APPROVED) {
        throw new BadRequestException('KYC already approved');
      }
      if (submission.status === KycStatus.PENDING) {
        throw new BadRequestException('KYC submission already pending review');
      }
      // If rejected, allow resubmission
    } else {
      submission = this.kycRepository.create({ userId });
    }

    submission.nin = data.nin;
    submission.idType = data.idType;
    submission.idFrontUrl = data.idFrontUrl;
    submission.idBackUrl = data.idBackUrl;
    submission.selfieUrl = data.selfieUrl;
    submission.vehicleRegistrationUrl = data.vehicleRegistrationUrl;
    submission.vehicleType = data.vehicleType;
    submission.vehiclePlate = data.vehiclePlate;
    submission.status = KycStatus.PENDING;
    submission.rejectionReason = null;
    submission.reviewedBy = null;
    submission.reviewedAt = null;

    return this.kycRepository.save(submission);
  }

  async getKycStatus(userId: string): Promise<KycSubmission | null> {
    return this.kycRepository.findOne({ where: { userId } });
  }

  async approveKyc(adminId: string, userId: string): Promise<KycSubmission> {
    const submission = await this.kycRepository.findOne({ where: { userId } });
    if (!submission) {
      throw new NotFoundException('KYC submission not found');
    }

    if (submission.status === KycStatus.APPROVED) {
      throw new BadRequestException('KYC already approved');
    }

    submission.status = KycStatus.APPROVED;
    submission.reviewedBy = adminId;
    submission.reviewedAt = new Date();
    submission.rejectionReason = null;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.kycStatus = KycStatus.APPROVED;
      await this.userRepository.save(user);
    }

    return this.kycRepository.save(submission);
  }

  async rejectKyc(adminId: string, userId: string, reason: string): Promise<KycSubmission> {
    const submission = await this.kycRepository.findOne({ where: { userId } });
    if (!submission) {
      throw new NotFoundException('KYC submission not found');
    }

    if (submission.status === KycStatus.REJECTED) {
      throw new BadRequestException('KYC already rejected');
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required');
    }

    submission.status = KycStatus.REJECTED;
    submission.reviewedBy = adminId;
    submission.reviewedAt = new Date();
    submission.rejectionReason = reason;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.kycStatus = KycStatus.REJECTED;
      await this.userRepository.save(user);
    }

    return this.kycRepository.save(submission);
  }

  async getPendingKycSubmissions(pagination?: Pagination): Promise<KycSubmission[] | Paginated<KycSubmission>> {
    const options = {
      where: { status: KycStatus.PENDING },
      relations: { user: true },
      order: { createdAt: 'ASC' as const },
    };

    if (!pagination) {
      return this.kycRepository.find(options);
    }

    const [items, total] = await this.kycRepository.findAndCount({
      ...options,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });
    return { items, total, page: pagination.page, limit: pagination.limit };
  }

  async canRiderGoOnline(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return false;
    }
    return user.kycStatus === KycStatus.APPROVED;
  }
}