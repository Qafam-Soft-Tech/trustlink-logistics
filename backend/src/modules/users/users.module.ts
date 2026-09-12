import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../auth/entities/user.entity';
import { KycSubmission } from './entities/kyc-submission.entity';
import { UsersController } from './users.controller';
import { KycController } from './kyc.controller';
import { UsersService } from './users.service';
import { KycService } from './services/kyc.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, KycSubmission])],
  controllers: [UsersController, KycController],
  providers: [UsersService, KycService],
  exports: [UsersService, KycService],
})
export class UsersModule {}