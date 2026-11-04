import { User } from '../modules/auth/entities/user.entity';
import { OtpCode } from '../modules/auth/entities/otp-code.entity';
import { Delivery, Address, DeliveryEvent } from '../modules/deliveries/entities/delivery.entity';
import { ProofOfDelivery } from '../modules/deliveries/entities/proof-of-delivery.entity';
import { RecipientOtp } from '../modules/deliveries/entities/recipient-otp.entity';
import { RiderProfile } from '../modules/deliveries/entities/rider-profile.entity';
import { KycSubmission } from '../modules/users/entities/kyc-submission.entity';
import { PricingConfig } from '../modules/payments/entities/pricing-config.entity';
import { Payment } from '../modules/payments/entities/payment.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { Issue } from '../modules/deliveries/entities/issue.entity';

/** Single source of truth for the TypeORM entity list (app + CLI migrations). */
export const entities = [
  User,
  OtpCode,
  Delivery,
  Address,
  DeliveryEvent,
  ProofOfDelivery,
  RecipientOtp,
  RiderProfile,
  KycSubmission,
  PricingConfig,
  Payment,
  Notification,
  Issue,
];
