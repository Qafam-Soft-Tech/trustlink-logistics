import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../auth/entities/user.entity';
import { Delivery } from '../deliveries/entities/delivery.entity';
import { Payment } from '../payments/entities/payment.entity';
import { KycSubmission } from './entities/kyc-submission.entity';
import { UsersController } from './users.controller';
import { MeController } from './me.controller';
import { ReportsController } from './reports.controller';
import { KycController } from './kyc.controller';
import { UsersService } from './users.service';
import { ReportsService } from './reports.service';
import { KycService } from './services/kyc.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, KycSubmission, Delivery, Payment])],
  controllers: [UsersController, MeController, ReportsController, KycController],
  providers: [UsersService, ReportsService, KycService],
  exports: [UsersService, KycService],
})
export class UsersModule {}