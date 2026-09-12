import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { User } from './modules/auth/entities/user.entity';
import { OtpCode } from './modules/auth/entities/otp-code.entity';
import { Delivery, Address, DeliveryEvent } from './modules/deliveries/entities/delivery.entity';
import { ProofOfDelivery } from './modules/deliveries/entities/proof-of-delivery.entity';
import { RiderProfile } from './modules/deliveries/entities/rider-profile.entity';
import { KycSubmission } from './modules/users/entities/kyc-submission.entity';
import { PricingConfig } from './modules/payments/entities/pricing-config.entity';
import { Payment } from './modules/payments/entities/payment.entity';
import { Notification } from './modules/notifications/entities/notification.entity';
import { Issue } from './modules/deliveries/entities/issue.entity';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync(databaseConfig),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    UsersModule,
    DeliveriesModule,
    PaymentsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}