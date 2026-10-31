import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { RiderProfile } from '../deliveries/entities/rider-profile.entity';
import { KycSubmission } from './entities/kyc-submission.entity';

@Injectable()
export class AdminRidersService {
  constructor(
    @InjectRepository(RiderProfile)
    private riderProfileRepository: Repository<RiderProfile>,
    @InjectRepository(KycSubmission)
    private kycRepository: Repository<KycSubmission>,
  ) {}

  async list() {
    const profiles = await this.riderProfileRepository.find({
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });

    const userIds = profiles.map(profile => profile.userId);
    const submissions = userIds.length === 0
      ? []
      : await this.kycRepository.find({ where: { userId: In(userIds) } });

    return profiles.map(profile => ({
      user: profile.user,
      profile,
      kyc: submissions.find(submission => submission.userId === profile.userId) ?? null,
    }));
  }
}
