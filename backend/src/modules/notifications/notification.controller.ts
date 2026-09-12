import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { NotificationService } from './services/notification.service';
import { Notification, NotificationChannel, NotificationStatus } from './entities/notification.entity';
import { DeliveryStatus } from '../deliveries/entities/delivery.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';

interface SendNotificationDto {
  deliveryId: string;
  userId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(
    @CurrentUser() user: User,
    @Query('limit') limit = 20,
  ) {
    return this.notificationService.getNotifications(user.id, limit);
  }

  @Get('cancellation-preview/:deliveryId')
  @ApiOperation({ summary: 'Get cancellation fee preview' })
  async getCancellationPreview(
    @CurrentUser() user: User,
    @Param('deliveryId') deliveryId: string,
  ) {
    return this.notificationService.getCancellationPreview(deliveryId, user.id);
  }

  @Post('cancel/:deliveryId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel delivery with tiered fee' })
  async cancelDelivery(
    @CurrentUser() user: User,
    @Param('deliveryId') deliveryId: string,
  ) {
    return this.notificationService.cancelDeliveryWithFee(deliveryId, user.id);
  }

  @Post('send')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send notification (admin)' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationService.sendNotification(dto);
  }
}