import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import { OtpCode } from '../entities/otp-code.entity';
import { TermiiSmsService } from './termii-sms.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 3;
  private readonly hashSecret: string;

  constructor(
    @InjectRepository(OtpCode)
    private otpRepository: Repository<OtpCode>,
    private termiiSms: TermiiSmsService,
    configService: ConfigService,
  ) {
    const configuredSecret = configService.get<string>('OTP_HASH_SECRET') ||
      configService.get<string>('JWT_SECRET');

    if (!configuredSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('OTP_HASH_SECRET or JWT_SECRET must be set in production');
      }
      this.hashSecret = 'trustlink-dev-otp-secret';
    } else {
      this.hashSecret = configuredSecret;
    }
  }

  async sendOtp(phone: string, purpose: 'signup' | 'login' | 'reset' = 'signup'): Promise<void> {
    // Store-review account: a single allowlisted phone gets a fixed 6-digit code.
    // Set REVIEW_PHONE/REVIEW_OTP only while a store review is active, then remove them.
    const reviewPhone = process.env.REVIEW_PHONE;
    const reviewOtp = process.env.REVIEW_OTP;
    const code = reviewPhone && reviewOtp && phone === reviewPhone
      ? reviewOtp
      : this.generateOtp();
    const codeHash = this.hashOtp(code);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    const existingOtp = await this.otpRepository.findOne({
      where: { phone, purpose, isUsed: false },
    });

    if (existingOtp) {
      existingOtp.codeHash = codeHash;
      existingOtp.expiresAt = expiresAt;
      existingOtp.attempts = 0;
      await this.otpRepository.save(existingOtp);
    } else {
      const otp = this.otpRepository.create({
        phone,
        codeHash,
        purpose,
        expiresAt,
      });
      await this.otpRepository.save(otp);
    }

    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[OTP] Phone: ${phone}, Code: ${code}, Purpose: ${purpose}`);
    } else {
      this.logger.log(`[OTP] Phone: ${phone}, Purpose: ${purpose}`);
    }

    const sent = await this.termiiSms.sendOtp(phone, code);
    if (!sent) {
      this.logger.warn(`OTP for ${phone} stored but SMS not sent (check Termii config)`);
    }
  }

  async verifyOtp(phone: string, code: string, purpose: 'signup' | 'login' | 'reset' = 'signup'): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: { phone, purpose, isUsed: false },
    });

    if (!otp) {
      return false;
    }

    if (otp.expiresAt < new Date()) {
      return false;
    }

    if (otp.attempts >= this.MAX_ATTEMPTS) {
      return false;
    }

    otp.attempts += 1;
    await this.otpRepository.save(otp);

    if (this.verifyHash(code, otp.codeHash)) {
      otp.isUsed = true;
      await this.otpRepository.save(otp);
      return true;
    }

    return false;
  }

  private generateOtp(): string {
    // Test-only seam: Jest e2e suites need a known code because the DB stores only a hash.
    // It is ignored outside Jest and never available in a production runtime.
    const testCode = process.env.OTP_TEST_CODE;
    if (testCode && process.env.JEST_WORKER_ID) {
      return testCode;
    }
    return crypto.randomInt(100000, 999999).toString();
  }

  private hashOtp(code: string): string {
    return crypto.createHmac('sha256', this.hashSecret).update(code).digest('hex');
  }

  private verifyHash(code: string, storedHash: string): boolean {
    if (!storedHash || storedHash.length !== 64) {
      return false;
    }

    const candidate = Buffer.from(this.hashOtp(code), 'hex');
    const stored = Buffer.from(storedHash, 'hex');
    return candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
  }
}
