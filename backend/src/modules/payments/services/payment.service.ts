import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as https from 'https';

import { Payment, PaymentProvider, PaymentStatus, PaymentChannel, InitializePaymentDto, PaymentInitializationResponse, VerifyPaymentResponse } from '../entities/payment.entity';
import { Delivery, DeliveryStatus } from '../../deliveries/entities/delivery.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    private configService: ConfigService,
  ) {}

  async initializePayment(dto: InitializePaymentDto): Promise<PaymentInitializationResponse> {
    const delivery = await this.deliveryRepository.findOne({ where: { id: dto.deliveryId } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.status !== DeliveryStatus.REQUESTED) {
      throw new BadRequestException('Payment can only be initiated for REQUESTED deliveries');
    }

    // Check if payment already exists
    const existingPayment = await this.paymentRepository.findOne({
      where: { deliveryId: dto.deliveryId },
    });
    if (existingPayment && [PaymentStatus.SUCCESS, PaymentStatus.PROCESSING].includes(existingPayment.status)) {
      throw new BadRequestException('Payment already processed for this delivery');
    }

    const reference = this.generateReference();
    const amountInKobo = dto.amount; // Already in kobo

    let payment: Payment;
    let authorizationUrl: string;
    let accessCode: string | undefined;

    if (dto.provider === PaymentProvider.PAYSTACK) {
      const result = await this.initializePaystackPayment({
        reference,
        amount: amountInKobo,
        email: dto.email,
        phone: dto.phone,
        metadata: { deliveryId: dto.deliveryId, ...dto.metadata },
      });
      authorizationUrl = result.authorizationUrl;
      accessCode = result.accessCode;
      payment = this.paymentRepository.create({
        deliveryId: dto.deliveryId,
        reference,
        provider: PaymentProvider.PAYSTACK,
        providerReference: result.providerReference,
        amount: amountInKobo,
        currency: 'NGN',
        customerEmail: dto.email,
        customerPhone: dto.phone,
        authorizationUrl,
        accessCode,
        status: PaymentStatus.PROCESSING,
        metadata: dto.metadata,
      });
    } else if (dto.provider === PaymentProvider.FLUTTERWAVE) {
      const result = await this.initializeFlutterwavePayment({
        reference,
        amount: amountInKobo,
        email: dto.email,
        phone: dto.phone,
        metadata: { deliveryId: dto.deliveryId, ...dto.metadata },
      });
      authorizationUrl = result.authorizationUrl;
      payment = this.paymentRepository.create({
        deliveryId: dto.deliveryId,
        reference,
        provider: PaymentProvider.FLUTTERWAVE,
        providerReference: result.providerReference,
        amount: amountInKobo,
        currency: 'NGN',
        customerEmail: dto.email,
        customerPhone: dto.phone,
        authorizationUrl,
        status: PaymentStatus.PROCESSING,
        metadata: dto.metadata,
      });
    } else {
      throw new BadRequestException('Unsupported payment provider');
    }

    await this.paymentRepository.save(payment);
    return { paymentId: payment.id, reference, authorizationUrl, accessCode, status: payment.status };
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    const payment = await this.paymentRepository.findOne({
      where: { reference },
      relations: { delivery: true },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    let verificationResult: VerifyPaymentResponse;

    if (payment.provider === PaymentProvider.PAYSTACK) {
      verificationResult = await this.verifyPaystackPayment(payment.providerReference || reference);
    } else if (payment.provider === PaymentProvider.FLUTTERWAVE) {
      verificationResult = await this.verifyFlutterwavePayment(payment.providerReference || reference);
    } else {
      throw new BadRequestException('Unsupported payment provider');
    }

    // Update payment record
    payment.status = verificationResult.status;
    if (verificationResult.channel) {
      payment.channel = verificationResult.channel;
    }
    payment.gatewayResponse = verificationResult.gatewayResponse || '';
    
    if (verificationResult.status === PaymentStatus.SUCCESS) {
      payment.paidAt = verificationResult.paidAt || new Date();
      // Update delivery status to SEARCHING
      if (payment.delivery) {
        payment.delivery.status = DeliveryStatus.SEARCHING;
        payment.delivery.paymentReference = payment.reference;
        // Note: Delivery service will handle the actual status update
      }
    } else if (verificationResult.status === PaymentStatus.FAILED) {
      payment.failedAt = new Date();
      payment.failureReason = verificationResult.gatewayResponse;
    }

    await this.paymentRepository.save(payment);
    return verificationResult;
  }

  async handlePaystackWebhook(payload: any, signature: string): Promise<{ received: boolean }> {
    const secret = this.configService.get('PAYSTACK_SECRET_KEY') || '';
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');
    
    if (hash !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      await this.processSuccessfulPayment(data.reference, data);
    } else if (event === 'charge.failed') {
      await this.processFailedPayment(data.reference, data);
    }

    return { received: true };
  }

  async handleFlutterwaveWebhook(payload: any, signature: string): Promise<{ received: boolean }> {
    const secret = this.configService.get('FLUTTERWAVE_SECRET_KEY') || '';
    const secretHash = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    
    if (secretHash !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.completed') {
      await this.processSuccessfulPayment(data.tx_ref, data);
    } else if (event === 'charge.failed') {
      await this.processFailedPayment(data.tx_ref, data);
    }

    return { received: true };
  }

  private async processSuccessfulPayment(reference: string, data: any): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { reference },
      relations: { delivery: true },
    });
    if (!payment) return;

    // Idempotency check
    if (payment.status === PaymentStatus.SUCCESS) return;

    payment.status = PaymentStatus.SUCCESS;
    payment.paidAt = new Date();
    payment.channel = data.channel || data.payment_type;
    payment.gatewayResponse = JSON.stringify(data);
    payment.providerReference = data.reference || data.id;

    if (payment.delivery) {
      payment.delivery.status = DeliveryStatus.SEARCHING;
      payment.delivery.paymentReference = payment.reference;
      await this.deliveryRepository.save(payment.delivery);
    }

    await this.paymentRepository.save(payment);
  }

  private async processFailedPayment(reference: string, data: any): Promise<void> {
    const payment = await this.paymentRepository.findOne({
      where: { reference },
      relations: { delivery: true },
    });
    if (!payment) return;

    if (payment.status === PaymentStatus.SUCCESS) return;

    payment.status = PaymentStatus.FAILED;
    payment.failedAt = new Date();
    payment.failureReason = data.gateway_response || data.status || 'Payment failed';
    payment.gatewayResponse = JSON.stringify(data);

    await this.paymentRepository.save(payment);
  }

  async getPaymentByReference(reference: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { reference },
      relations: { delivery: true },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async getPaymentByDeliveryId(deliveryId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { deliveryId },
      relations: { delivery: true },
    });
  }

  private async initializePaystackPayment(params: {
    reference: string;
    amount: number;
    email: string;
    phone: string;
    metadata: Record<string, any>;
  }): Promise<{ authorizationUrl: string; accessCode: string; providerReference: string }> {
    const secretKey = this.configService.get('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      // Mock for development
      return {
        authorizationUrl: `https://checkout.paystack.com/mock/${params.reference}`,
        accessCode: 'mock_access_code',
        providerReference: `ps_${params.reference}`,
      };
    }

    const body = JSON.stringify({
      reference: params.reference,
      amount: params.amount,
      email: params.email,
      phone: params.phone,
      currency: 'NGN',
      metadata: params.metadata,
      callback_url: this.configService.get('PAYSTACK_CALLBACK_URL'),
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.paystack.co',
        path: '/transaction/initialize',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.status) {
              resolve({
                authorizationUrl: response.data.authorization_url,
                accessCode: response.data.access_code,
                providerReference: response.data.reference,
              });
            } else {
              reject(new Error(response.message || 'Paystack initialization failed'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private async verifyPaystackPayment(reference: string): Promise<VerifyPaymentResponse> {
    const secretKey = this.configService.get('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      // Mock for development
      return {
        status: PaymentStatus.SUCCESS,
        amount: 100000,
        paidAt: new Date(),
        channel: PaymentChannel.CARD,
        gatewayResponse: 'Approved',
      };
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.paystack.co',
        path: `/transaction/verify/${reference}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.status && response.data.status === 'success') {
              resolve({
                status: PaymentStatus.SUCCESS,
                amount: response.data.amount,
                paidAt: new Date(response.data.paid_at),
                channel: response.data.channel,
                gatewayResponse: response.data.gateway_response,
              });
            } else {
              resolve({
                status: PaymentStatus.FAILED,
                amount: response.data.amount || 0,
                gatewayResponse: response.data.gateway_response || 'Failed',
              });
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  private async initializeFlutterwavePayment(params: {
    reference: string;
    amount: number;
    email: string;
    phone: string;
    metadata: Record<string, any>;
  }): Promise<{ authorizationUrl: string; providerReference: string }> {
    const secretKey = this.configService.get('FLUTTERWAVE_SECRET_KEY');
    if (!secretKey) {
      // Mock for development
      return {
        authorizationUrl: `https://checkout.flutterwave.com/mock/${params.reference}`,
        providerReference: `fw_${params.reference}`,
      };
    }

    const body = JSON.stringify({
      tx_ref: params.reference,
      amount: params.amount / 100, // Flutterwave expects amount in main currency
      currency: 'NGN',
      redirect_url: this.configService.get('FLUTTERWAVE_REDIRECT_URL'),
      customer: {
        email: params.email,
        phone_number: params.phone,
        name: params.metadata?.customerName || 'Customer',
      },
      customizations: {
        title: 'TrustLink Logistics',
        description: 'Delivery payment',
        logo: this.configService.get('APP_LOGO_URL'),
      },
      meta: params.metadata,
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.flutterwave.com',
        path: '/v3/payments',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.status === 'success') {
              resolve({
                authorizationUrl: response.data.link,
                providerReference: response.data.id,
              });
            } else {
              reject(new Error(response.message || 'Flutterwave initialization failed'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private async verifyFlutterwavePayment(reference: string): Promise<VerifyPaymentResponse> {
    const secretKey = this.configService.get('FLUTTERWAVE_SECRET_KEY');
    if (!secretKey) {
      // Mock for development
      return {
        status: PaymentStatus.SUCCESS,
        amount: 100000,
        paidAt: new Date(),
        channel: PaymentChannel.CARD,
        gatewayResponse: 'Approved',
      };
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.flutterwave.com',
        path: `/v3/transactions/${reference}/verify`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.status === 'success' && response.data.status === 'successful') {
              resolve({
                status: PaymentStatus.SUCCESS,
                amount: response.data.amount * 100, // Convert to kobo
                paidAt: new Date(response.data.created_at),
                channel: response.data.payment_type,
                gatewayResponse: response.data.processor_response,
              });
            } else {
              resolve({
                status: PaymentStatus.FAILED,
                amount: response.data.amount * 100 || 0,
                gatewayResponse: response.data.processor_response || 'Failed',
              });
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  private generateReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TLK_${timestamp}_${random}`.toUpperCase();
  }
}