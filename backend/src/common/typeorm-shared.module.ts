import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../modules/auth/entities/user.entity';
import { OtpCode } from '../modules/auth/entities/otp-code.entity';
import { Delivery, Address, DeliveryEvent } from '../modules/deliveries/entities/delivery.entity';
import { ProofOfDelivery } from '../modules/deliveries/entities/proof-of-delivery.entity';
import { RiderProfile } from '../modules/deliveries/entities/rider-profile.entity';
import { KycSubmission } from '../modules/users/entities/kyc-submission.entity';
import { PricingConfig } from '../modules/payments/entities/pricing-config.entity';
import { Payment } from '../modules/payments/entities/payment.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { Issue } from '../modules/deliveries/entities/issue.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      OtpCode,
      Delivery,
      Address,
      DeliveryEvent,
      ProofOfDelivery,
      RiderProfile,
      KycSubmission,
      PricingConfig,
      Payment,
      Notification,
      Issue,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class TypeOrmSharedModule {}