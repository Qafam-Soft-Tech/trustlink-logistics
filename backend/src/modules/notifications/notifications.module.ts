import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Notification } from './entities/notification.entity';
import { Delivery, DeliveryEvent } from '../deliveries/entities/delivery.entity';
import { RiderProfile } from '../deliveries/entities/rider-profile.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Delivery, DeliveryEvent, RiderProfile])],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}