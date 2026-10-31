import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { RecipientOtp } from '../entities/recipient-otp.entity';
import { TermiiSmsService } from '../../auth/services/termii-sms.service';

const OTP_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 3;

@Injectable()
export class RecipientOtpService {
  private readonly logger = new Logger(RecipientOtpService.name);

  constructor(
    @InjectRepository(RecipientOtp)
    private recipientOtpRepository: Repository<RecipientOtp>,
    private termiiSms: TermiiSmsService,
  ) {}

  async issue(deliveryId: string, phone: string): Promise<void> {
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = await bcrypt.hash(code, 8);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    let record = await this.recipientOtpRepository.findOne({ where: { deliveryId } });
    if (!record) {
      record = this.recipientOtpRepository.create({ deliveryId });
    }

    record.codeHash = codeHash;
    record.expiresAt = expiresAt;
    record.attempts = 0;
    record.usedAt = null;
    await this.recipientOtpRepository.save(record);

    const sent = await this.termiiSms.sendMessage(
      phone,
      `Your TrustLink delivery confirmation code is ${code}. Valid for ${OTP_TTL_MINUTES} minutes. Share it with the rider only when you receive the package.`,
    );
    if (!sent) {
      this.logger.warn(`Recipient OTP for delivery ${deliveryId} stored but SMS was not sent`);
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[DEV] Recipient OTP for delivery ${deliveryId}: ${code}`);
      }
    }
  }

  async verify(deliveryId: string, code: string): Promise<boolean> {
    const record = await this.recipientOtpRepository.findOne({ where: { deliveryId } });
    if (!record || record.usedAt || record.expiresAt < new Date() || record.attempts >= MAX_ATTEMPTS) {
      return false;
    }

    record.attempts += 1;
    const matches = await bcrypt.compare(code, record.codeHash);
    if (matches) {
      record.usedAt = new Date();
    }
    await this.recipientOtpRepository.save(record);
    return matches;
  }
}
