import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Delivery, DeliveryEvent, DeliveryStatus, Address, PackageType } from '../entities/delivery.entity';
import { ProofOfDelivery } from '../entities/proof-of-delivery.entity';
import { RiderProfile, RiderStatus, VehicleType } from '../entities/rider-profile.entity';
import { User, UserRole, KycStatus } from '../../auth/entities/user.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import { FareCalculationService } from '../../payments/services/fare-calculation.service';
import { DistanceService } from '../../payments/services/distance.service';
import { RecipientOtpService } from './recipient-otp.service';
import { CreateDeliveryDto } from '../dto';
import { Paginated, Pagination, paginateQuery } from '../../../common/pagination';

type ActorRole = 'customer' | 'rider' | 'admin';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(ProofOfDelivery)
    private proofOfDeliveryRepository: Repository<ProofOfDelivery>,
    @InjectRepository(DeliveryEvent)
    private deliveryEventRepository: Repository<DeliveryEvent>,
    @InjectRepository(RiderProfile)
    private riderProfileRepository: Repository<RiderProfile>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
    private fareCalculationService: FareCalculationService,
    private distanceService: DistanceService,
    private recipientOtpService: RecipientOtpService,
  ) {}

  async createDelivery(customerId: string, data: CreateDeliveryDto): Promise<Delivery> {
    const customer = await this.userRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    if (customer.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Only customers can create deliveries');
    }
    if (!customer.isActive) {
      throw new NotFoundException('Customer not found');
    }

    if (data.senderPhone === data.recipientPhone) {
      throw new BadRequestException('Recipient must be different from sender');
    }

    const distanceKm = this.distanceService.resolve(data);
    const fare = await this.fareCalculationService.calculateFare({
      distanceKm,
      weightKg: Number(data.packageWeight),
      packageType: data.packageType,
    });

    const delivery = this.deliveryRepository.create({
      trackingNumber: this.generateTrackingNumber(),
      customerId,
      ...data,
      distanceKm,
      fare: fare.totalFare,
      status: DeliveryStatus.REQUESTED,
    });

    const saved = await this.deliveryRepository.save(delivery);
    saved.events = [];
    await this.appendEvent(saved, {
      status: DeliveryStatus.REQUESTED,
      actorId: customerId,
      actorRole: 'customer',
      notes: 'Delivery requested',
    });
    return saved;
  }

  async getDeliveryById(deliveryId: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({
      where: { id: deliveryId },
      relations: { customer: true, rider: true, events: true },
    });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    return delivery;
  }

  async getDeliveryByTrackingNumber(trackingNumber: string): Promise<Delivery> {
    const delivery = await this.deliveryRepository.findOne({
      where: { trackingNumber },
      relations: { customer: true, rider: true, events: true },
    });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    return delivery;
  }

  async getCustomerDeliveries(
    customerId: string,
    status?: DeliveryStatus,
    pagination?: Pagination,
  ): Promise<Delivery[] | Paginated<Delivery>> {
    const query = this.deliveryRepository.createQueryBuilder('delivery')
      .where('delivery.customerId = :customerId', { customerId })
      .leftJoinAndSelect('delivery.rider', 'rider')
      .leftJoinAndSelect('delivery.events', 'events')
      .orderBy('delivery.createdAt', 'DESC');

    if (status) {
      query.andWhere('delivery.status = :status', { status });
    }

    return pagination ? paginateQuery(query, pagination) : query.getMany();
  }

  async getRiderDeliveries(
    riderId: string,
    status?: DeliveryStatus,
    pagination?: Pagination,
  ): Promise<Delivery[] | Paginated<Delivery>> {
    const query = this.deliveryRepository.createQueryBuilder('delivery')
      .where('delivery.riderId = :riderId', { riderId })
      .leftJoinAndSelect('delivery.customer', 'customer')
      .leftJoinAndSelect('delivery.events', 'events')
      .orderBy('delivery.createdAt', 'DESC');

    if (status) {
      query.andWhere('delivery.status = :status', { status });
    }

    return pagination ? paginateQuery(query, pagination) : query.getMany();
  }

  async getAllDeliveries(
    status?: DeliveryStatus,
    pagination?: Pagination,
  ): Promise<Delivery[] | Paginated<Delivery>> {
    const query = this.deliveryRepository.createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.customer', 'customer')
      .leftJoinAndSelect('delivery.rider', 'rider')
      .orderBy('delivery.createdAt', 'DESC');

    if (status) {
      query.andWhere('delivery.status = :status', { status });
    }

    return pagination ? paginateQuery(query, pagination) : query.getMany();
  }

  async updateDeliveryStatus(
    deliveryId: string,
    newStatus: DeliveryStatus,
    actorId: string,
    actorRole: ActorRole,
    notes?: string,
    latitude?: number,
    longitude?: number,
  ): Promise<Delivery> {
    const delivery = await this.getDeliveryById(deliveryId);
    this.validateStatusTransition(delivery.status, newStatus, actorRole);

    delivery.status = newStatus;

    switch (newStatus) {
      case DeliveryStatus.ASSIGNED:
        delivery.assignedAt = new Date();
        delivery.acknowledgedAt = null;
        break;
      case DeliveryStatus.PICKED_UP:
        delivery.pickedUpAt = new Date();
        break;
      case DeliveryStatus.DELIVERED:
        delivery.deliveredAt = new Date();
        break;
      case DeliveryStatus.CANCELLED:
        delivery.cancelledAt = new Date();
        break;
    }

    await this.deliveryRepository.save(delivery);
    await this.appendEvent(delivery, {
      status: newStatus,
      actorId,
      actorRole,
      notes,
      latitude,
      longitude,
    });

    await this.notificationService.notifyDeliveryStatusChange(deliveryId, newStatus, actorRole);
    await this.releaseRiderIfIdle(delivery.riderId);

    return delivery;
  }

  async assignRider(deliveryId: string, riderId: string, adminId: string): Promise<Delivery> {
    const delivery = await this.getDeliveryById(deliveryId);
    if (delivery.status !== DeliveryStatus.SEARCHING) {
      throw new BadRequestException('Delivery cannot be assigned in current status');
    }

    const riderProfile = await this.riderProfileRepository.findOne({
      where: { userId: riderId },
      relations: { user: true },
    });
    if (!riderProfile) {
      throw new NotFoundException('Rider profile not found');
    }

    if (riderProfile.user.kycStatus !== KycStatus.APPROVED) {
      throw new BadRequestException('Rider KYC not approved');
    }
    if (riderProfile.status !== RiderStatus.ONLINE) {
      throw new BadRequestException('Rider is not online');
    }
    if (!this.isVehicleCompatible(riderProfile.vehicleType, delivery.packageType, Number(delivery.packageWeight))) {
      throw new BadRequestException('Rider vehicle type not compatible with package');
    }

    delivery.riderId = riderId;
    delivery.status = DeliveryStatus.ASSIGNED;
    delivery.assignedAt = new Date();
    delivery.acknowledgedAt = null;
    await this.deliveryRepository.save(delivery);

    riderProfile.status = RiderStatus.ON_TRIP;
    await this.riderProfileRepository.save(riderProfile);

    await this.appendEvent(delivery, {
      status: DeliveryStatus.ASSIGNED,
      actorId: adminId,
      actorRole: 'admin',
      notes: `Assigned to rider ${riderProfile.user.firstName} ${riderProfile.user.lastName}`,
    });
    await this.notificationService.notifyDeliveryStatusChange(deliveryId, DeliveryStatus.ASSIGNED, 'admin');
    await this.recipientOtpService.issue(deliveryId, delivery.recipientPhone);

    return delivery;
  }

  async setFare(deliveryId: string, fare: number): Promise<Delivery> {
    const delivery = await this.getDeliveryById(deliveryId);
    delivery.fare = fare;
    return this.deliveryRepository.save(delivery);
  }

  async cancelDelivery(deliveryId: string, customerId: string): Promise<Delivery> {
    const delivery = await this.getDeliveryById(deliveryId);
    if (delivery.customerId !== customerId) {
      throw new ForbiddenException('Not authorized to cancel this delivery');
    }
    if (![DeliveryStatus.REQUESTED, DeliveryStatus.SEARCHING].includes(delivery.status)) {
      throw new BadRequestException('Cannot cancel delivery in current status');
    }
    return this.updateDeliveryStatus(
      deliveryId,
      DeliveryStatus.CANCELLED,
      customerId,
      'customer',
      'Cancelled by customer',
    );
  }

  private validateStatusTransition(
    currentStatus: DeliveryStatus,
    newStatus: DeliveryStatus,
    actorRole: ActorRole,
  ): void {
    const allowedTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      [DeliveryStatus.REQUESTED]: [DeliveryStatus.SEARCHING, DeliveryStatus.CANCELLED],
      [DeliveryStatus.SEARCHING]: [DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED],
      [DeliveryStatus.ASSIGNED]: [DeliveryStatus.PICKED_UP, DeliveryStatus.CANCELLED],
      [DeliveryStatus.PICKED_UP]: [DeliveryStatus.IN_TRANSIT, DeliveryStatus.FAILED],
      [DeliveryStatus.IN_TRANSIT]: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED],
      [DeliveryStatus.DELIVERED]: [],
      [DeliveryStatus.FAILED]: [DeliveryStatus.RETURNED],
      [DeliveryStatus.RETURNED]: [],
      [DeliveryStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }

    if (actorRole === 'customer' && newStatus !== DeliveryStatus.CANCELLED) {
      throw new ForbiddenException('Customers can only cancel deliveries');
    }
    if (
      actorRole === 'rider' &&
      ![DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED, DeliveryStatus.FAILED].includes(newStatus)
    ) {
      throw new ForbiddenException('Riders can only update delivery progress');
    }
  }

  private generateTrackingNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TLK-${year}-${random}`;
  }

  async createAddress(userId: string, data: Partial<Address>): Promise<Address> {
    const address = this.addressRepository.create({ userId, ...data });
    return this.addressRepository.save(address);
  }

  async getUserAddresses(userId: string): Promise<Address[]> {
    return this.addressRepository.find({ where: { userId }, order: { isDefault: 'DESC', createdAt: 'DESC' } });
  }

  async updateAddress(addressId: string, userId: string, data: Partial<Address>): Promise<Address> {
    const address = await this.addressRepository.findOne({ where: { id: addressId, userId } });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    Object.assign(address, data);
    return this.addressRepository.save(address);
  }

  async deleteAddress(addressId: string, userId: string): Promise<void> {
    const address = await this.addressRepository.findOne({ where: { id: addressId, userId } });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    await this.addressRepository.remove(address);
  }

  async setDefaultAddress(addressId: string, userId: string): Promise<void> {
    await this.addressRepository.update({ userId, isDefault: true }, { isDefault: false });
    await this.addressRepository.update({ id: addressId, userId }, { isDefault: true });
  }

  async markPickedUp(deliveryId: string, riderId: string, latitude?: number, longitude?: number): Promise<Delivery> {
    return this.updateDeliveryStatus(
      deliveryId,
      DeliveryStatus.PICKED_UP,
      riderId,
      'rider',
      'Package picked up',
      latitude,
      longitude,
    );
  }

  async markInTransit(deliveryId: string, riderId: string, latitude?: number, longitude?: number): Promise<Delivery> {
    return this.updateDeliveryStatus(
      deliveryId,
      DeliveryStatus.IN_TRANSIT,
      riderId,
      'rider',
      'Package in transit',
      latitude,
      longitude,
    );
  }

  async completeDelivery(
    deliveryId: string,
    riderId: string,
    proofData: {
      photoUrl: string;
      recipientOtp: string;
      recipientName: string;
      recipientPhone: string;
      latitude?: number;
      longitude?: number;
      notes?: string;
    },
  ): Promise<Delivery> {
    const delivery = await this.getDeliveryById(deliveryId);

    if (delivery.riderId !== riderId) {
      throw new ForbiddenException('Not assigned to this delivery');
    }
    if (delivery.status !== DeliveryStatus.IN_TRANSIT) {
      throw new BadRequestException('Delivery must be IN_TRANSIT to complete');
    }
    if (!proofData.photoUrl || proofData.photoUrl.trim().length === 0) {
      throw new BadRequestException('Photo proof is required');
    }
    if (!proofData.recipientOtp || proofData.recipientOtp.length !== 6) {
      throw new BadRequestException('Valid 6-digit recipient OTP required');
    }
    const otpValid = await this.recipientOtpService.verify(deliveryId, proofData.recipientOtp);
    if (!otpValid) {
      throw new BadRequestException('Invalid or expired recipient OTP');
    }

    const proof = this.proofOfDeliveryRepository.create({
      deliveryId,
      photoUrl: proofData.photoUrl,
      recipientOtp: proofData.recipientOtp,
      recipientName: proofData.recipientName,
      recipientPhone: proofData.recipientPhone,
      latitude: proofData.latitude,
      longitude: proofData.longitude,
      notes: proofData.notes,
    });
    await this.proofOfDeliveryRepository.save(proof);

    delivery.status = DeliveryStatus.DELIVERED;
    delivery.deliveredAt = new Date();
    await this.deliveryRepository.save(delivery);

    await this.appendEvent(delivery, {
      status: DeliveryStatus.DELIVERED,
      actorId: riderId,
      actorRole: 'rider',
      notes: 'Delivered with proof',
      latitude: proofData.latitude,
      longitude: proofData.longitude,
    });
    await this.notificationService.notifyDeliveryStatusChange(deliveryId, DeliveryStatus.DELIVERED, 'rider');
    await this.releaseRiderIfIdle(delivery.riderId);

    return delivery;
  }

  async reportFailure(
    deliveryId: string,
    riderId: string,
    reason: string,
    latitude?: number,
    longitude?: number,
  ): Promise<Delivery> {
    const delivery = await this.getDeliveryById(deliveryId);

    if (delivery.riderId !== riderId) {
      throw new ForbiddenException('Not assigned to this delivery');
    }
    if (![DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT].includes(delivery.status)) {
      throw new BadRequestException('Can only report failure from PICKED_UP or IN_TRANSIT status');
    }
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Failure reason is required');
    }

    delivery.failureReason = reason;
    delivery.redeliveryAttempts += 1;
    delivery.status = delivery.redeliveryAttempts >= 2 ? DeliveryStatus.RETURNED : DeliveryStatus.FAILED;
    await this.deliveryRepository.save(delivery);

    await this.appendEvent(delivery, {
      status: delivery.status,
      actorId: riderId,
      actorRole: 'rider',
      notes: delivery.status === DeliveryStatus.RETURNED
        ? `Returned after ${delivery.redeliveryAttempts} failed attempts: ${reason}`
        : `Failed: ${reason}. Redelivery attempt ${delivery.redeliveryAttempts}`,
      latitude,
      longitude,
    });
    await this.notificationService.notifyDeliveryStatusChange(deliveryId, delivery.status, 'rider');
    await this.releaseRiderIfIdle(delivery.riderId);

    return delivery;
  }

  async scheduleRedelivery(deliveryId: string, adminId: string): Promise<Delivery> {
    const delivery = await this.getDeliveryById(deliveryId);

    if (delivery.status !== DeliveryStatus.FAILED) {
      throw new BadRequestException('Can only schedule redelivery for FAILED deliveries');
    }
    if (delivery.redeliveryAttempts >= 2) {
      throw new BadRequestException('Maximum redelivery attempts reached');
    }

    const previousRiderId = delivery.riderId;
    delivery.status = DeliveryStatus.SEARCHING;
    delivery.riderId = null;
    await this.deliveryRepository.save(delivery);

    await this.appendEvent(delivery, {
      status: DeliveryStatus.SEARCHING,
      actorId: adminId,
      actorRole: 'admin',
      notes: 'Redelivery scheduled',
    });
    await this.releaseRiderIfIdle(previousRiderId);

    return delivery;
  }

  async resendRecipientOtp(
    deliveryId: string,
    requesterId: string,
    role: ActorRole,
  ): Promise<{ sent: boolean }> {
    const delivery = await this.getDeliveryById(deliveryId);
    if (![DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT].includes(delivery.status)) {
      throw new BadRequestException('Recipient OTP can only be sent while the delivery is active');
    }
    if (role === 'rider' && delivery.riderId !== requesterId) {
      throw new ForbiddenException('Not assigned to this delivery');
    }
    if (role === 'customer' && delivery.customerId !== requesterId) {
      throw new ForbiddenException('Not authorized');
    }

    await this.recipientOtpService.issue(deliveryId, delivery.recipientPhone);
    return { sent: true };
  }

  async getProofOfDelivery(deliveryId: string): Promise<ProofOfDelivery | null> {
    const delivery = await this.deliveryRepository.findOne({ where: { id: deliveryId } });
    if (!delivery || delivery.status !== DeliveryStatus.DELIVERED) {
      return null;
    }
    return this.proofOfDeliveryRepository.findOne({ where: { deliveryId } });
  }

  async releaseRiderIfIdle(riderId: string | null): Promise<void> {
    if (!riderId) return;

    const riderProfile = await this.riderProfileRepository.findOne({ where: { userId: riderId } });
    if (!riderProfile || riderProfile.status !== RiderStatus.ON_TRIP) return;

    const activeDeliveries = await this.deliveryRepository
      .createQueryBuilder('delivery')
      .where('delivery.riderId = :riderId', { riderId })
      .andWhere('delivery.status IN (:...statuses)', {
        statuses: [DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT],
      })
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
      actorRole: ActorRole;
      notes?: string;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<DeliveryEvent> {
    const saved = await this.deliveryEventRepository.save(
      this.deliveryEventRepository.create({
        deliveryId: delivery.id,
        ...event,
      }),
    );
    delivery.events = [...(delivery.events || []), saved];
    return saved;
  }

  private isVehicleCompatible(vehicleType: VehicleType, packageType: PackageType, weightKg: number): boolean {
    if (vehicleType === VehicleType.MOTORCYCLE) return weightKg <= 10;
    if (vehicleType === VehicleType.VAN) return weightKg <= 50;
    if (vehicleType === VehicleType.TRUCK) return weightKg <= 200;
    return false;
  }
}
