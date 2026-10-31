import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { NotificationService } from './services/notification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';
import { SendNotificationDto } from './dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async getNotifications(@CurrentUser() user: User, @Query('limit') limit?: string) {
    const parsed = Number(limit ?? 20);
    const safeLimit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 20;
    return this.notificationService.getNotifications(user.id, safeLimit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get the unread notification count' })
  async getUnreadCount(@CurrentUser() user: User) {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: User) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationService.markAsRead(user.id, id);
  }

  @Get('cancellation-preview/:deliveryId')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get cancellation fee preview' })
  async getCancellationPreview(@CurrentUser() user: User, @Param('deliveryId') deliveryId: string) {
    return this.notificationService.getCancellationPreview(deliveryId, user.id);
  }

  @Post('cancel/:deliveryId')
  @Roles(UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel delivery with tiered fee' })
  async cancelDelivery(@CurrentUser() user: User, @Param('deliveryId') deliveryId: string) {
    return this.notificationService.cancelDeliveryWithFee(deliveryId, user.id);
  }

  @Post('send')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send notification (admin)' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationService.sendNotification(dto);
  }
}
