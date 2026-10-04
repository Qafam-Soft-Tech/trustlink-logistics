import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RiderProfile, VehicleType, RiderStatus } from '../entities/rider-profile.entity';
import { User, UserRole } from '../../auth/entities/user.entity';

@Injectable()
export class RiderProfileService {
  constructor(
    @InjectRepository(RiderProfile)
    private riderProfileRepository: Repository<RiderProfile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getProfile(userId: string): Promise<RiderProfile> {
    let profile = await this.riderProfileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      profile = await this.createDefaultProfile(userId);
    }

    return profile;
  }

  async updateProfile(userId: string, data: Partial<RiderProfile>): Promise<RiderProfile> {
    const profile = await this.getProfile(userId);

    const allowedFields = ['vehicleType', 'vehiclePlate', 'vehicleModel', 'vehicleColor', 'zone'];
    for (const key of Object.keys(data)) {
      if (allowedFields.includes(key)) {
        (profile as any)[key] = (data as any)[key];
      }
    }

    return this.riderProfileRepository.save(profile);
  }

  async toggleOnlineStatus(userId: string): Promise<RiderProfile> {
    const profile = await this.getProfile(userId);

    if (profile.status === RiderStatus.ON_TRIP) {
      throw new ForbiddenException('Cannot change status while on a trip');
    }

    profile.status = profile.status === RiderStatus.ONLINE ? RiderStatus.OFFLINE : RiderStatus.ONLINE;
    return this.riderProfileRepository.save(profile);
  }

  async setStatus(userId: string, status: RiderStatus): Promise<RiderProfile> {
    const profile = await this.getProfile(userId);

    if (profile.status === RiderStatus.ON_TRIP && status !== RiderStatus.ON_TRIP) {
      throw new ForbiddenException('Cannot change status while on a trip');
    }

    profile.status = status;
    return this.riderProfileRepository.save(profile);
  }

  async updateLocation(userId: string, latitude: number, longitude: number): Promise<RiderProfile> {
    const profile = await this.getProfile(userId);
    profile.currentLatitude = latitude;
    profile.currentLongitude = longitude;
    profile.lastLocationUpdate = new Date();
    return this.riderProfileRepository.save(profile);
  }

  async createDefaultProfile(userId: string): Promise<RiderProfile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = this.riderProfileRepository.create({
      userId,
      vehicleType: VehicleType.MOTORCYCLE,
      vehiclePlate: '',
      status: RiderStatus.OFFLINE,
      currentLatitude: 0,
      currentLongitude: 0,
    });

    return this.riderProfileRepository.save(profile);
  }

  async getRiderProfileByUserId(userId: string): Promise<RiderProfile | null> {
    return this.riderProfileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }
}