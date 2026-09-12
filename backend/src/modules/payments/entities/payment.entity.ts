import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Delivery } from '../../deliveries/entities/delivery.entity';

export enum PaymentProvider {
  PAYSTACK = 'paystack',
  FLUTTERWAVE = 'flutterwave',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentChannel {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  USSD = 'ussd',
  MOBILE_MONEY = 'mobile_money',
  QR_CODE = 'qr_code',
}

@Entity('payments')
@Index(['deliveryId'])
@Index(['reference'])
@Index(['providerReference'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  deliveryId!: string;

  @ManyToOne(() => Delivery)
  @JoinColumn({ name: 'deliveryId' })
  delivery!: Delivery;

  @Column({ unique: true })
  reference!: string; // Our internal reference

  @Column({ nullable: true })
  providerReference!: string; // Provider's reference (Paystack/Flutterwave)

  @Column({ type: 'enum', enum: PaymentProvider })
  provider!: PaymentProvider;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number; // In kobo/cents (smallest currency unit)

  @Column({ default: 'NGN' })
  currency!: string;

  @Column({ nullable: true })
  channel!: PaymentChannel;

  @Column({ nullable: true })
  customerEmail!: string;

  @Column({ nullable: true })
  customerPhone!: string;

  @Column({ nullable: true })
  authorizationUrl!: string; // URL to redirect customer for payment

  @Column({ nullable: true })
  accessCode!: string; // For Paystack

  @Column({ nullable: true })
  paidAt!: Date;

  @Column({ nullable: true })
  failedAt!: Date;

  @Column({ nullable: true })
  failureReason!: string;

  @Column({ nullable: true })
  gatewayResponse!: string; // Raw response from gateway

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>; // Additional data (deliveryId, etc.)

  @Column({ default: 0 })
  webhookRetries!: number;

  @Column({ nullable: true })
  lastWebhookAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export interface InitializePaymentDto {
  deliveryId: string;
  amount: number; // In kobo
  email: string;
  phone: string;
  provider: PaymentProvider;
  metadata?: Record<string, any>;
}

export interface PaymentInitializationResponse {
  paymentId: string;
  reference: string;
  authorizationUrl: string;
  accessCode?: string;
  status: PaymentStatus;
}

export interface VerifyPaymentResponse {
  status: PaymentStatus;
  amount: number;
  paidAt?: Date;
  channel?: PaymentChannel;
  gatewayResponse: string;
}