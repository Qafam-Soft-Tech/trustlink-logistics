import { ConfigModule, ConfigService } from '@nestjs/config';
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

export const databaseConfig = {
  imports: [ConfigModule],
  useFactory: (configService: ConfigService): any => ({
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_NAME', 'trustlink'),
    entities: [
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
    ],
    synchronize: configService.get('NODE_ENV') !== 'production',
    logging: configService.get('NODE_ENV') === 'development',
    ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
  }),
  inject: [ConfigService],
};