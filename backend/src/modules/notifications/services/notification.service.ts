import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Delivery, DeliveryStatus } from '../../deliveries/entities/delivery.entity';
import { Notification, NotificationChannel, NotificationStatus, SendNotificationDto } from '../entities/notification.entity';
import { User } from '../../auth/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
  ) {}

  // Cancellation fee tiers based on delivery status
  private readonly CANCELLATION_FEES: Record<DeliveryStatus, { type: 'free' | 'partial' | 'full'; percentage?: number; flatFee?: number }> = {
    [DeliveryStatus.REQUESTED]: { type: 'free' },
    [DeliveryStatus.SEARCHING]: { type: 'free' },
    [DeliveryStatus.ASSIGNED]: { type: 'partial', percentage: 50 },
    [DeliveryStatus.PICKED_UP]: { type: 'partial', percentage: 75 },
    [DeliveryStatus.IN_TRANSIT]: { type: 'full' },
    [DeliveryStatus.DELIVERED]: { type: 'full' },
    [DeliveryStatus.FAILED]: { type: 'full' },
    [DeliveryStatus.RETURNED]: { type: 'full' },
    [DeliveryStatus.CANCELLED]: { type: 'free' },
  };

  async sendNotification(dto: SendNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...dto,
      status: NotificationStatus.PENDING,
    });

    // In real implementation, this would call the appropriate provider
    // For now, we'll simulate sending
    try {
      await this.dispatchNotification(notification);
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
    } catch (error: unknown) {
      notification.status = NotificationStatus.FAILED;
      notification.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }

    return this.notificationRepository.save(notification);
  }

  private async dispatchNotification(notification: Notification): Promise<void> {
    switch (notification.channel) {
      case NotificationChannel.PUSH:
        await this.sendPush(notification);
        break;
      case NotificationChannel.SMS:
        await this.sendSms(notification);
        break;
      case NotificationChannel.EMAIL:
        await this.sendEmail(notification);
        break;
    }
  }

  private async sendPush(notification: Notification): Promise<void> {
    // Simulate push notification
    // In real implementation: call Firebase/OneSignal/etc.
    console.log(`[PUSH] To user ${notification.userId}: ${notification.title}`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private async sendSms(notification: Notification): Promise<void> {
    // Simulate SMS via Termii/Africa's Talking
    console.log(`[SMS] To user ${notification.userId}: ${notification.body}`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private async sendEmail(notification: Notification): Promise<void> {
    // Simulate email
    console.log(`[EMAIL] To user ${notification.userId}: ${notification.title}`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  async notifyDeliveryStatusChange(
    deliveryId: string,
    newStatus: DeliveryStatus,
    actorRole: 'customer' | 'rider' | 'admin',
  ): Promise<void> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
      relations: { customer: true, rider: true },
    });
    if (!delivery) return;

    const statusMessages: Record<DeliveryStatus, { title: string; body: string }> = {
      [DeliveryStatus.REQUESTED]: {
        title: 'Delivery Requested',
        body: 'Your delivery request has been received and is being processed.',
      },
      [DeliveryStatus.SEARCHING]: {
        title: 'Finding a Rider',
        body: 'We\'re looking for an available rider near you.',
      },
      [DeliveryStatus.ASSIGNED]: {
        title: 'Rider Assigned',
        body: `Your rider ${delivery.rider?.firstName} ${delivery.rider?.lastName} is on the way to pick up your package.`,
      },
      [DeliveryStatus.PICKED_UP]: {
        title: 'Package Picked Up',
        body: 'Your rider has picked up the package and is heading to the drop-off location.',
      },
      [DeliveryStatus.IN_TRANSIT]: {
        title: 'In Transit',
        body: 'Your package is on the way to the destination.',
      },
      [DeliveryStatus.DELIVERED]: {
        title: 'Delivered',
        body: 'Your package has been delivered successfully.',
      },
      [DeliveryStatus.FAILED]: {
        title: 'Delivery Issue',
        body: 'There was an issue with the delivery. Our team is working on it.',
      },
      [DeliveryStatus.RETURNED]: {
        title: 'Returned to Sender',
        body: 'The package could not be delivered and is being returned.',
      },
      [DeliveryStatus.CANCELLED]: {
        title: 'Delivery Cancelled',
        body: 'Your delivery has been cancelled.',
      },
    };

    const message = statusMessages[newStatus];
    if (!message) return;

    // Notify customer
    await this.sendNotification({
      deliveryId,
      userId: delivery.customerId,
      channel: NotificationChannel.PUSH,
      title: message.title,
      body: message.body,
      data: { deliveryId, status: newStatus },
    });

    // Also send SMS for critical statuses
    if ([DeliveryStatus.ASSIGNED, DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.RETURNED, DeliveryStatus.CANCELLED].includes(newStatus)) {
      await this.sendNotification({
        deliveryId,
        userId: delivery.customerId,
        channel: NotificationChannel.SMS,
        title: message.title,
        body: message.body,
        data: { deliveryId, status: newStatus },
      });
    }

    // Notify rider for relevant statuses
    if (delivery.riderId && [DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED].includes(newStatus)) {
      await this.sendNotification({
        deliveryId,
        userId: delivery.riderId,
        channel: NotificationChannel.PUSH,
        title: newStatus === DeliveryStatus.ASSIGNED ? 'New Delivery Assigned' : 'Delivery Cancelled',
        body: newStatus === DeliveryStatus.ASSIGNED
          ? 'You have a new delivery assignment'
          : 'A delivery you were assigned has been cancelled',
        data: { deliveryId, status: newStatus },
      });
    }
  }

  // Cancellation with tiered fees
  async cancelDeliveryWithFee(deliveryId: string, customerId: string): Promise<{ cancelled: boolean; fee: number; refundAmount: number }> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId, customerId },
    });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (![DeliveryStatus.REQUESTED, DeliveryStatus.SEARCHING, DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT].includes(delivery.status)) {
      throw new BadRequestException('Cannot cancel delivery in current status');
    }

    const feeRule = this.CANCELLATION_FEES[delivery.status];
    let fee = 0;
    let refundAmount = 0;

    if (feeRule.type === 'free') {
      fee = 0;
      refundAmount = delivery.fare || 0;
    } else if (feeRule.type === 'partial') {
      fee = (delivery.fare || 0) * (feeRule.percentage || 0) / 100;
      refundAmount = (delivery.fare || 0) - fee;
    } else if (feeRule.type === 'full') {
      fee = delivery.fare || 0;
      refundAmount = 0;
    }

    // Update delivery status
    delivery.status = DeliveryStatus.CANCELLED;
    delivery.cancelledAt = new Date();
    await this.deliveryRepository.save(delivery);

    // Create timeline event
    const event = {
      deliveryId: delivery.id,
      status: DeliveryStatus.CANCELLED,
      actorId: delivery.customerId,
      actorRole: 'customer',
      notes: `Cancelled by customer. Fee: ₦${fee}, Refund: ₦${refundAmount}`,
    };
    delivery.events = [...(delivery.events || []), event] as any;
    await this.deliveryRepository.save(delivery);

    // Notify about cancellation
    await this.notifyDeliveryStatusChange(deliveryId, DeliveryStatus.CANCELLED, 'customer');

    return { cancelled: true, fee, refundAmount };
  }

  async getCancellationPreview(deliveryId: string, customerId: string): Promise<{ canCancel: boolean; fee: number; refundAmount: number; reason: string }> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId, customerId },
    });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const cancellableStatuses = [
      DeliveryStatus.REQUESTED,
      DeliveryStatus.SEARCHING,
      DeliveryStatus.ASSIGNED,
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.IN_TRANSIT,
    ];

    if (!cancellableStatuses.includes(delivery.status)) {
      return {
        canCancel: false,
        fee: 0,
        refundAmount: 0,
        reason: 'Cannot cancel delivery in current status',
      };
    }

    const feeRule = this.CANCELLATION_FEES[delivery.status];
    let fee = 0;
    let refundAmount = 0;
    let reason = '';

    if (feeRule.type === 'free') {
      fee = 0;
      refundAmount = delivery.fare || 0;
      reason = 'Free cancellation';
    } else if (feeRule.type === 'partial') {
      fee = (delivery.fare || 0) * (feeRule.percentage || 0) / 100;
      refundAmount = (delivery.fare || 0) - fee;
      reason = `${feeRule.percentage}% cancellation fee applies`;
    } else if (feeRule.type === 'full') {
      fee = delivery.fare || 0;
      refundAmount = 0;
      reason = 'Full fare charged as cancellation fee';
    }

    return { canCancel: true, fee, refundAmount, reason };
  }

  async getNotifications(userId: string, limit = 20): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id: notificationId } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    // In real implementation, you might have a readAt field
    return notification;
  }
}