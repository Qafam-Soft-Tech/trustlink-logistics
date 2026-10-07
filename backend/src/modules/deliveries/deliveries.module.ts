import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Delivery, Address, DeliveryEvent } from './entities/delivery.entity';
import { ProofOfDelivery } from './entities/proof-of-delivery.entity';
import { RiderProfile } from './entities/rider-profile.entity';
import { Issue } from './entities/issue.entity';
import { User } from '../auth/entities/user.entity';
import { DeliveryController } from './delivery.controller';
import { DispatchController } from './dispatch.controller';
import { IssueController } from './issue.controller';
import { RiderProfileController } from './rider-profile.controller';
import { DeliveryService } from './services/delivery.service';
import { DispatchService } from './services/dispatch.service';
import { IssueService } from './services/issue.service';
import { RiderProfileService } from './services/rider-profile.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery, Address, DeliveryEvent, ProofOfDelivery, RiderProfile, Issue, User]),
    NotificationsModule,
  ],
  controllers: [DeliveryController, DispatchController, IssueController, RiderProfileController],
  providers: [DeliveryService, DispatchService, IssueService, RiderProfileService],
  exports: [DeliveryService, DispatchService, IssueService, RiderProfileService],
})
export class DeliveriesModule {}