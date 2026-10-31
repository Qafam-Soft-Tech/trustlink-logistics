import { Injectable, Logger } from '@nestjs/common';
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

  constructor(
    @InjectRepository(OtpCode)
    private otpRepository: Repository<OtpCode>,
    private termiiSms: TermiiSmsService,
  ) {}

  async sendOtp(phone: string, purpose: 'signup' | 'login' | 'reset' = 'signup'): Promise<void> {
    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    const existingOtp = await this.otpRepository.findOne({
      where: { phone, purpose, isUsed: false },
    });

    if (existingOtp) {
      existingOtp.code = code;
      existingOtp.expiresAt = expiresAt;
      existingOtp.attempts = 0;
      await this.otpRepository.save(existingOtp);
    } else {
      const otp = this.otpRepository.create({
        phone,
        code,
        purpose,
        expiresAt,
      });
      await this.otpRepository.save(otp);
    }

    this.logger.log(`[OTP] Phone: ${phone}, Code: ${code}, Purpose: ${purpose}`);

    const sent = await this.termiiSms.sendOtp(phone, code);
    if (!sent) {
      this.logger.warn(`OTP for ${phone} stored but SMS not sent (check Termii config)`);
    }
  }

  async verifyOtp(phone: string, code: string, purpose: 'signup' | 'login' | 'reset' = 'signup'): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: { phone, code, purpose, isUsed: false },
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

    if (otp.code === code) {
      otp.isUsed = true;
      await this.otpRepository.save(otp);
      return true;
    }

    return false;
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }
}