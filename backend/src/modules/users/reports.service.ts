import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Delivery, DeliveryStatus } from '../deliveries/entities/delivery.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async summary() {
    const [deliveries, payments] = await Promise.all([
      this.deliveryRepository.find(),
      this.paymentRepository.find({ where: { status: PaymentStatus.SUCCESS } }),
    ]);

    const total = deliveries.length;
    const delivered = deliveries.filter(delivery => delivery.status === DeliveryStatus.DELIVERED).length;
    const cancelled = deliveries.filter(delivery => delivery.status === DeliveryStatus.CANCELLED).length;
    const returned = deliveries.filter(delivery => delivery.status === DeliveryStatus.RETURNED).length;
    const active = deliveries.filter(delivery =>
      [DeliveryStatus.REQUESTED, DeliveryStatus.SEARCHING, DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT]
        .includes(delivery.status),
    ).length;

    const revenueKobo = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const days: string[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - offset);
      days.push(date.toISOString().slice(0, 10));
    }

    const counts = new Map(days.map(day => [day, 0]));
    for (const delivery of deliveries) {
      const day = new Date(delivery.createdAt).toISOString().slice(0, 10);
      if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
    }

    return {
      totals: { deliveries: total, delivered, cancelled, returned, active },
      rates: {
        completionRate: total === 0 ? 0 : Math.round((delivered / total) * 1000) / 1000,
        cancellationRate: total === 0 ? 0 : Math.round((cancelled / total) * 1000) / 1000,
      },
      revenue: Math.round(revenueKobo) / 100,
      deliveriesPerDay: days.map(day => ({ date: day, deliveries: counts.get(day) ?? 0 })),
    };
  }
}
