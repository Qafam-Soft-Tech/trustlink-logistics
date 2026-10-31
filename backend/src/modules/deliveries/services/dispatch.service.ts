import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Delivery, DeliveryEvent, DeliveryStatus } from '../entities/delivery.entity';
import { RiderProfile, VehicleType, RiderStatus } from '../entities/rider-profile.entity';
import { User, KycStatus } from '../../auth/entities/user.entity';
import { DeliveryService } from './delivery.service';

export interface EligibleRider {
  rider: RiderProfile;
  distanceKm: number;
  estimatedTimeMinutes: number;
}

const ACTIVE_DELIVERY_STATUSES = [
  DeliveryStatus.ASSIGNED,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.IN_TRANSIT,
];

@Injectable()
export class DispatchService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @InjectRepository(DeliveryEvent)
    private deliveryEventRepository: Repository<DeliveryEvent>,
    @InjectRepository(RiderProfile)
    private riderProfileRepository: Repository<RiderProfile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private deliveryService: DeliveryService,
  ) {}

  async getEligibleRiders(deliveryId: string): Promise<EligibleRider[]> {
    const delivery = await this.deliveryRepository.findOne({ where: { id: deliveryId } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    if (delivery.status !== DeliveryStatus.SEARCHING) {
      throw new BadRequestException('Delivery cannot be assigned in current status');
    }

    const riders = await this.riderProfileRepository
      .createQueryBuilder('rider')
      .leftJoinAndSelect('rider.user', 'user')
      .where('rider.status = :status', { status: RiderStatus.ONLINE })
      .andWhere('user.kycStatus = :kycStatus', { kycStatus: KycStatus.APPROVED })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getMany();

    const eligibleRiders: EligibleRider[] = [];

    for (const rider of riders) {
      if (!rider.currentLatitude || !rider.currentLongitude) continue;

      if (!this.isVehicleCompatible(rider.vehicleType, delivery.packageType, Number(delivery.packageWeight))) {
        continue;
      }

      const distanceKm = this.calculateDistance(
        delivery.pickupLatitude || 0,
        delivery.pickupLongitude || 0,
        rider.currentLatitude,
        rider.currentLongitude,
      );

      if (distanceKm > 20) continue;

      eligibleRiders.push({
        rider,
        distanceKm: Math.round(distanceKm * 100) / 100,
        estimatedTimeMinutes: Math.ceil(distanceKm * 2),
      });
    }

    return eligibleRiders.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async assignRider(deliveryId: string, riderId: string, adminId: string): Promise<Delivery> {
    return this.deliveryService.assignRider(deliveryId, riderId, adminId);
  }

  async reassignRider(deliveryId: string, newRiderId: string, adminId: string, reason: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({ where: { id: deliveryId } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    if (delivery.status !== DeliveryStatus.ASSIGNED && delivery.status !== DeliveryStatus.PICKED_UP) {
      throw new BadRequestException('Delivery cannot be reassigned in current status');
    }

    const previousRiderId = delivery.riderId;
    delivery.status = DeliveryStatus.SEARCHING;
    delivery.riderId = null;
    await this.deliveryRepository.save(delivery);

    await this.appendEvent(delivery, {
      status: DeliveryStatus.SEARCHING,
      actorId: adminId,
      actorRole: 'admin',
      notes: `Reassigned: ${reason}`,
    });
    await this.releaseRiderIfIdle(previousRiderId);

    return this.assignRider(deliveryId, newRiderId, adminId);
  }

  async getLiveDeliveryBoard(): Promise<Delivery[]> {
    return this.deliveryRepository
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.customer', 'customer')
      .leftJoinAndSelect('delivery.rider', 'rider')
      .where('delivery.status IN (:...statuses)', {
        statuses: [
          DeliveryStatus.REQUESTED,
          DeliveryStatus.SEARCHING,
          DeliveryStatus.ASSIGNED,
          DeliveryStatus.PICKED_UP,
          DeliveryStatus.IN_TRANSIT,
        ],
      })
      .orderBy('delivery.createdAt', 'ASC')
      .getMany();
  }

  async getRiderQueue(riderId: string): Promise<Delivery[]> {
    return this.deliveryRepository.find({
      where: { riderId, status: DeliveryStatus.ASSIGNED },
      relations: { customer: true },
      order: { assignedAt: 'ASC' },
    });
  }

  async riderAcknowledgeJob(deliveryId: string, riderId: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({ where: { id: deliveryId } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    if (delivery.riderId !== riderId) {
      throw new ForbiddenException('Not assigned to this delivery');
    }
    if (delivery.status !== DeliveryStatus.ASSIGNED) {
      throw new BadRequestException('Delivery not in ASSIGNED status');
    }

    delivery.acknowledgedAt = new Date();
    await this.deliveryRepository.save(delivery);

    await this.appendEvent(delivery, {
      status: DeliveryStatus.ASSIGNED,
      actorId: riderId,
      actorRole: 'rider',
      notes: 'Job acknowledged by rider',
    });

    return delivery;
  }

  async updateRiderLocation(riderId: string, latitude: number, longitude: number): Promise<RiderProfile> {
    const riderProfile = await this.riderProfileRepository.findOne({ where: { userId: riderId } });
    if (!riderProfile) {
      throw new NotFoundException('Rider profile not found');
    }

    riderProfile.currentLatitude = latitude;
    riderProfile.currentLongitude = longitude;
    riderProfile.lastLocationUpdate = new Date();

    return this.riderProfileRepository.save(riderProfile);
  }

  async setRiderStatus(riderId: string, status: RiderStatus): Promise<RiderProfile> {
    const riderProfile = await this.riderProfileRepository.findOne({ where: { userId: riderId } });
    if (!riderProfile) {
      throw new NotFoundException('Rider profile not found');
    }

    if (status === RiderStatus.ONLINE) {
      const rider = await this.userRepository.findOne({ where: { id: riderId } });
      if (!rider || rider.kycStatus !== KycStatus.APPROVED) {
        throw new BadRequestException('Rider KYC not approved');
      }
    }

    if (status === RiderStatus.ON_TRIP && riderProfile.status !== RiderStatus.ONLINE) {
      throw new BadRequestException('Rider must be ONLINE to go ON_TRIP');
    }

    if (status === RiderStatus.ONLINE && riderProfile.status === RiderStatus.ON_TRIP) {
      const activeDeliveries = await this.deliveryRepository
        .createQueryBuilder('delivery')
        .where('delivery.riderId = :riderId', { riderId })
        .andWhere('delivery.status IN (:...statuses)', { statuses: ACTIVE_DELIVERY_STATUSES })
        .getMany();
      if (activeDeliveries.length > 0) {
        throw new BadRequestException('Cannot go ONLINE while having active deliveries');
      }
    }

    riderProfile.status = status;
    return this.riderProfileRepository.save(riderProfile);
  }

  async getRiderStatus(riderId: string): Promise<RiderProfile> {
    const riderProfile = await this.riderProfileRepository.findOne({
      where: { userId: riderId },
      relations: { user: true },
    });
    if (!riderProfile) {
      throw new NotFoundException('Rider profile not found');
    }
    return riderProfile;
  }

  private async releaseRiderIfIdle(riderId: string | null): Promise<void> {
    if (!riderId) return;

    const riderProfile = await this.riderProfileRepository.findOne({ where: { userId: riderId } });
    if (!riderProfile || riderProfile.status !== RiderStatus.ON_TRIP) return;

    const activeDeliveries = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .where('delivery.riderId = :riderId', { riderId })
      .andWhere('delivery.status IN (:...statuses)', { statuses: ACTIVE_DELIVERY_STATUSES })
      .getMany();

    if (activeDeliveries.length === 0) {
      riderProfile.status = RiderStatus.ONLINE;
      await this.riderProfileRepository.save(riderProfile);
    }
  }

  private async appendEvent(
    delivery: Delivery,
    event: {
      status: DeliveryStatus;
      actorId: string;
      actorRole: 'customer' | 'rider' | 'admin';
      notes?: string;
    },
  ): Promise<DeliveryEvent> {
    return this.deliveryEventRepository.save(
      this.deliveryEventRepository.create({
        deliveryId: delivery.id,
        ...event,
      }),
    );
  }

  private isVehicleCompatible(vehicleType: VehicleType, packageType: string, weightKg: number): boolean {
    if (vehicleType === VehicleType.MOTORCYCLE) return weightKg <= 10;
    if (vehicleType === VehicleType.VAN) return weightKg <= 50;
    if (vehicleType === VehicleType.TRUCK) return weightKg <= 200;
    return false;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
