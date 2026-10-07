import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface TermiiSmsResponse {
  message_id: string;
  message: string;
  balance: number;
  user: string;
}

@Injectable()
export class TermiiSmsService {
  private readonly logger = new Logger(TermiiSmsService.name);
  private readonly baseUrl = 'https://api.ng.termii.com/api';
  private readonly apiKey: string;
  private readonly senderId: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SMS_PROVIDER_API_KEY') || '';
    this.senderId = this.configService.get<string>('SMS_SENDER_ID') || 'TrustLink';

    if (!this.apiKey) {
      this.logger.warn('SMS_PROVIDER_API_KEY not set — SMS will not be sent');
    }
  }

  async sendOtp(phone: string, code: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn(`SMS_PROVIDER_API_KEY not configured — OTP for ${phone} not sent via SMS`);
      return false;
    }

    const message = `Your TrustLink verification code is ${code}. Valid for 10 minutes. Do not share.`;

    try {
      const response = await axios.post<TermiiSmsResponse>(
        `${this.baseUrl}/sms/send`,
        {
          to: this.formatPhone(phone),
          from: this.senderId,
          sms: message,
          type: 'plain',
          channel: 'generic',
          api_key: this.apiKey,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      this.logger.log(`OTP SMS sent to ${phone} — Termii message_id: ${response.data.message_id}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send OTP SMS to ${phone}: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }

  private formatPhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.slice(1);
    } else if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned;
    }
    return cleaned;
  }
}