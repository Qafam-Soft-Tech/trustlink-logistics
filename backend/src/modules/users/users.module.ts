import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../auth/entities/user.entity';
import { Delivery } from '../deliveries/entities/delivery.entity';
import { Payment } from '../payments/entities/payment.entity';
import { RiderProfile } from '../deliveries/entities/rider-profile.entity';
import { KycSubmission } from './entities/kyc-submission.entity';
import { UsersController } from './users.controller';
import { MeController } from './me.controller';
import { ReportsController } from './reports.controller';
import { AdminRidersController } from './admin-riders.controller';
import { KycController } from './kyc.controller';
import { UsersService } from './users.service';
import { ReportsService } from './reports.service';
import { AdminRidersService } from './admin-riders.service';
import { KycService } from './services/kyc.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, KycSubmission, RiderProfile, Delivery, Payment])],
  controllers: [UsersController, MeController, ReportsController, AdminRidersController, KycController],
  providers: [UsersService, ReportsService, AdminRidersService, KycService],
  exports: [UsersService, KycService],
})
export class UsersModule {}