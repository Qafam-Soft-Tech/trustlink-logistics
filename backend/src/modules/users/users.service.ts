import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserRole, KycStatus } from '../auth/entities/user.entity';
import { Delivery, DeliveryStatus } from '../deliveries/entities/delivery.entity';
import { Paginated, Pagination, paginateQuery } from '../../common/pagination';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
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

  async findAll(
    role?: UserRole,
    isActive?: boolean,
    pagination?: Pagination,
  ): Promise<User[] | Paginated<User>> {
    const query = this.userRepository.createQueryBuilder('user');
    if (role) {
      query.andWhere('user.role = :role', { role });
    }
    if (isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive });
    }
    query.orderBy('user.createdAt', 'DESC');

    return pagination ? paginateQuery(query, pagination) : query.getMany();
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

  async deleteAccount(userId: string): Promise<{ deleted: boolean }> {
    const user = await this.findById(userId);
    if (user.deletedAt) {
      return { deleted: true };
    }

    const activeDeliveries = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .where('delivery.customerId = :userId', { userId })
      .andWhere('delivery.status IN (:...statuses)', {
        statuses: [DeliveryStatus.REQUESTED, DeliveryStatus.SEARCHING, DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT],
      })
      .getMany();

    if (activeDeliveries.length > 0) {
      throw new BadRequestException('Cannot delete an account with active deliveries');
    }

    user.phone = `deleted-${user.id}`;
    user.email = '';
    user.firstName = 'Deleted';
    user.lastName = 'User';
    user.avatarUrl = '';
    user.passwordHash = '';
    user.isActive = false;
    user.isPhoneVerified = false;
    user.deletedAt = new Date();

    await this.userRepository.save(user);
    return { deleted: true };
  }
}
