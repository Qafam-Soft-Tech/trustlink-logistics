import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';

import { Delivery, DeliveryStatus } from '../entities/delivery.entity';
import { RiderProfile, VehicleType, RiderStatus } from '../entities/rider-profile.entity';
import { User, UserRole } from '../../auth/entities/user.entity';

export interface EligibleRider {
  rider: RiderProfile;
  distanceKm: number;
  estimatedTimeMinutes: number;
}

@Injectable()
export class DispatchService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @InjectRepository(RiderProfile)
    private riderProfileRepository: Repository<RiderProfile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getEligibleRiders(deliveryId: string): Promise<EligibleRider[]> {
    const delivery = await this.deliveryRepository.findOne({ where: { id: deliveryId } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.status !== DeliveryStatus.SEARCHING && delivery.status !== DeliveryStatus.REQUESTED) {
      throw new BadRequestException('Delivery cannot be assigned in current status');
    }

    // Get all online, KYC-approved riders with matching vehicle type
    const riders = await this.riderProfileRepository
      .createQueryBuilder('rider')
      .leftJoinAndSelect('rider.user', 'user')
      .where('rider.status = :status', { status: RiderStatus.ONLINE })
      .andWhere('user.kycStatus = :kycStatus', { kycStatus: 'approved' })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getMany();

    // Filter by zone if delivery has zone info
    // For now, we'll use a simple distance calculation based on lat/long
    const eligibleRiders: EligibleRider[] = [];

    for (const rider of riders) {
      if (!rider.currentLatitude || !rider.currentLongitude) continue;

      // Check vehicle type compatibility with package
      if (!this.isVehicleCompatible(rider.vehicleType, delivery.packageType, delivery.packageWeight)) {
        continue;
      }

      const distanceKm = this.calculateDistance(
        delivery.pickupLatitude || 0,
        delivery.pickupLongitude || 0,
        rider.currentLatitude,
        rider.currentLongitude,
      );

      // Only consider riders within reasonable distance (e.g., 20km)
      if (distanceKm > 20) continue;

      const estimatedTimeMinutes = Math.ceil(distanceKm * 2); // Rough estimate: 2 min per km

      eligibleRiders.push({
        rider,
        distanceKm: Math.round(distanceKm * 100) / 100,
        estimatedTimeMinutes,
      });
    }

    // Sort by distance (closest first)
    return eligibleRiders.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  async assignRider(deliveryId: string, riderId: string, adminId: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({ where: { id: deliveryId } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.status !== DeliveryStatus.SEARCHING && delivery.status !== DeliveryStatus.REQUESTED) {
      throw new BadRequestException('Delivery cannot be assigned in current status');
    }

    const riderProfile = await this.riderProfileRepository.findOne({
      where: { userId: riderId },
      relations: { user: true },
    });
    if (!riderProfile) {
      throw new NotFoundException('Rider profile not found');
    }

    if (riderProfile.user.kycStatus !== 'approved') {
      throw new BadRequestException('Rider KYC not approved');
    }

    if (riderProfile.status !== RiderStatus.ONLINE) {
      throw new BadRequestException('Rider is not online');
    }

    // Check vehicle compatibility
    if (!this.isVehicleCompatible(riderProfile.vehicleType, delivery.packageType, delivery.packageWeight)) {
      throw new BadRequestException('Rider vehicle type not compatible with package');
    }

    // Assign rider
    delivery.riderId = riderId;
    delivery.status = DeliveryStatus.ASSIGNED;
    delivery.assignedAt = new Date();

    await this.deliveryRepository.save(delivery);

    // Update rider status
    riderProfile.status = RiderStatus.ON_TRIP;
    await this.riderProfileRepository.save(riderProfile);

    return delivery;
  }

  async reassignRider(deliveryId: string, newRiderId: string, adminId: string, reason: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({ where: { id: deliveryId } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.status !== DeliveryStatus.ASSIGNED && delivery.status !== DeliveryStatus.PICKED_UP) {
      throw new BadRequestException('Delivery cannot be reassigned in current status');
    }

    // Get current rider and set them back to ONLINE
    if (delivery.riderId) {
      const oldRiderProfile = await this.riderProfileRepository.findOne({ where: { userId: delivery.riderId } });
      if (oldRiderProfile) {
        oldRiderProfile.status = RiderStatus.ONLINE;
        await this.riderProfileRepository.save(oldRiderProfile);
      }
    }

    // Assign new rider
    return this.assignRider(deliveryId, newRiderId, adminId);
  }

  async getLiveDeliveryBoard(): Promise<Delivery[]> {
    return this.deliveryRepository
      .createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.customer', 'customer')
      .leftJoinAndSelect('delivery.rider', 'rider')
      .where('delivery.status IN (:...statuses)', {
        statuses: [DeliveryStatus.REQUESTED, DeliveryStatus.SEARCHING, DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT],
      })
      .orderBy('delivery.createdAt', 'ASC')
      .getMany();
  }

  async getRiderQueue(riderId: string): Promise<Delivery[]> {
    return this.deliveryRepository.find({
      where: {
        riderId,
        status: DeliveryStatus.ASSIGNED,
      },
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

    delivery.status = DeliveryStatus.ASSIGNED; // Status remains ASSIGNED, but we can track acknowledgment
    // Could add an acknowledgedAt field if needed
    await this.deliveryRepository.save(delivery);

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

    // Validate status transitions
    if (status === RiderStatus.ON_TRIP && riderProfile.status !== RiderStatus.ONLINE) {
      throw new BadRequestException('Rider must be ONLINE to go ON_TRIP');
    }

    if (status === RiderStatus.ONLINE && riderProfile.status === RiderStatus.ON_TRIP) {
      // Check if rider has active deliveries
      const activeDeliveries = await this.deliveryRepository.count({
        where: {
          riderId,
          status: DeliveryStatus.ASSIGNED,
        },
      });
      if (activeDeliveries > 0) {
        throw new BadRequestException('Cannot go ONLINE while having active deliveries');
      }
    }

    riderProfile.status = status;
    return this.riderProfileRepository.save(riderProfile);
  }

  private isVehicleCompatible(vehicleType: VehicleType, packageType: string, weightKg: number): boolean {
    // Motorcycle: documents and small parcels up to 10kg
    if (vehicleType === VehicleType.MOTORCYCLE) {
      return weightKg <= 10;
    }
    // Van: parcels up to 50kg
    if (vehicleType === VehicleType.VAN) {
      return weightKg <= 50;
    }
    // Truck: heavy parcels up to 200kg
    if (vehicleType === VehicleType.TRUCK) {
      return weightKg <= 200;
    }
    return false;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
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