import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole, KycStatus } from '../auth/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phone } });
  }

  async findAll(role?: UserRole, isActive?: boolean): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user');
    if (role) {
      query.andWhere('user.role = :role', { role });
    }
    if (isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive });
    }
    return query.getMany();
  }

  async updateKycStatus(userId: string, status: KycStatus, rejectionReason?: string): Promise<User> {
    const user = await this.findById(userId);
    user.kycStatus = status;
    if (rejectionReason) {
      user.kycRejectionReason = rejectionReason;
    }
    return this.userRepository.save(user);
  }

  async toggleActiveStatus(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }
}