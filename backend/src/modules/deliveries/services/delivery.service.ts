import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Delivery, DeliveryStatus, Address, PackageType } from '../entities/delivery.entity';
import { ProofOfDelivery } from '../entities/proof-of-delivery.entity';
import { User, UserRole } from '../../auth/entities/user.entity';
import { NotificationService } from '../../notifications/services/notification.service';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(ProofOfDelivery)
    private proofOfDeliveryRepository: Repository<ProofOfDelivery>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  async createDelivery(customerId: string, data: {
    // Pickup
    pickupStreet: string;
    pickupLandmark?: string;
    pickupArea?: string;
    pickupLatitude?: number;
    pickupLongitude?: number;
    // Dropoff
    dropoffStreet: string;
    dropoffLandmark?: string;
    dropoffArea?: string;
    dropoffLatitude?: number;
    dropoffLongitude?: number;
    // Package
    packageType: PackageType;
    packageWeight: number;
    packageDescription?: string;
    // Sender
    senderName: string;
    senderPhone: string;
    // Recipient
    recipientName: string;
    recipientPhone: string;
  }): Promise<Delivery> {
    const customer = await this.userRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    if (customer.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Only customers can create deliveries');
    }

    // Validate recipient is distinct from sender (FR-C07)
    if (data.senderPhone === data.recipientPhone) {
      throw new BadRequestException('Recipient must be different from sender');
    }

    const trackingNumber = this.generateTrackingNumber();

    const delivery = this.deliveryRepository.create({
      trackingNumber,
      customerId,
      ...data,
      status: DeliveryStatus.REQUESTED,
    });

    // Create timeline event
    delivery.events = [{
      deliveryId: delivery.id,
      status: DeliveryStatus.REQUESTED,
      actorId: customerId,
      actorRole: 'customer',
      notes: 'Delivery requested',
    }] as any;

    return this.deliveryRepository.save(delivery);
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

  async getCustomerDeliveries(customerId: string, status?: DeliveryStatus): Promise<Delivery[]> {
    const query = this.deliveryRepository.createQueryBuilder('delivery')
      .where('delivery.customerId = :customerId', { customerId })
      .leftJoinAndSelect('delivery.rider', 'rider')
      .leftJoinAndSelect('delivery.events', 'events')
      .orderBy('delivery.createdAt', 'DESC');

    if (status) {
      query.andWhere('delivery.status = :status', { status });
    }

    return query.getMany();
  }

  async getRiderDeliveries(riderId: string, status?: DeliveryStatus): Promise<Delivery[]> {
    const query = this.deliveryRepository.createQueryBuilder('delivery')
      .where('delivery.riderId = :riderId', { riderId })
      .leftJoinAndSelect('delivery.customer', 'customer')
      .leftJoinAndSelect('delivery.events', 'events')
      .orderBy('delivery.createdAt', 'DESC');

    if (status) {
      query.andWhere('delivery.status = :status', { status });
    }

    return query.getMany();
  }

  async getAllDeliveries(status?: DeliveryStatus): Promise<Delivery[]> {
    const query = this.deliveryRepository.createQueryBuilder('delivery')
      .leftJoinAndSelect('delivery.customer', 'customer')
      .leftJoinAndSelect('delivery.rider', 'rider')
      .orderBy('delivery.createdAt', 'DESC');

    if (status) {
      query.andWhere('delivery.status = :status', { status });
    }

    return query.getMany();
  }

  async updateDeliveryStatus(
    deliveryId: string,
    newStatus: DeliveryStatus,
    actorId: string,
    actorRole: 'customer' | 'rider' | 'admin',
    notes?: string,
    latitude?: number,
    longitude?: number,
  ): Promise<Delivery> {
    const delivery = await this.getDeliveryById(deliveryId);
    
    // Validate status transitions
    this.validateStatusTransition(delivery.status, newStatus, actorRole);

    delivery.status = newStatus;
    
    // Update timestamps based on status
    switch (newStatus) {
      case DeliveryStatus.ASSIGNED:
        delivery.assignedAt = new Date();
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

    // Create timeline event
    const event = {
      deliveryId: delivery.id,
      status: newStatus,
      actorId,
      actorRole,
      notes,
      latitude,
      longitude,
    };
    
    delivery.events = [...(delivery.events || []), event] as any;

    const savedDelivery = await this.deliveryRepository.save(delivery);

    // Notify about status change
    await this.notificationService.notifyDeliveryStatusChange(deliveryId, newStatus, actorRole);

    return savedDelivery;
  }

  async assignRider(deliveryId: string, riderId: string, adminId: string): Promise<Delivery> {
    const rider = await this.userRepository.findOne({ where: { id: riderId } });
    if (!rider || rider.role !== UserRole.RIDER) {
      throw new BadRequestException('Invalid rider');
    }

    const delivery = await this.getDeliveryById(deliveryId);
    if (delivery.status !== DeliveryStatus.SEARCHING && delivery.status !== DeliveryStatus.REQUESTED) {
      throw new BadRequestException('Delivery cannot be assigned in current status');
    }

    delivery.riderId = riderId;
    delivery.status = DeliveryStatus.ASSIGNED;
    delivery.assignedAt = new Date();

    const event = {
      deliveryId: delivery.id,
      status: DeliveryStatus.ASSIGNED,
      actorId: adminId,
      actorRole: 'admin',
      notes: `Assigned to rider ${rider.firstName} ${rider.lastName}`,
    };
    delivery.events = [...(delivery.events || []), event] as any;

    return this.deliveryRepository.save(delivery);
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
    actorRole: 'customer' | 'rider' | 'admin',
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

    // Role-based restrictions
    if (actorRole === 'customer' && ![DeliveryStatus.CANCELLED].includes(newStatus)) {
      throw new ForbiddenException('Customers can only cancel deliveries');
    }
    if (actorRole === 'rider' && ![DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED, DeliveryStatus.FAILED].includes(newStatus)) {
      throw new ForbiddenException('Riders can only update delivery progress');
    }
  }

  private generateTrackingNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TLK-${year}-${random}`;
  }

  // Address management
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

  // Phase 8: Delivery Execution & Proof of Delivery

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

    // Verify OTP (in real implementation, this would check against sent OTP)
    if (!proofData.recipientOtp || proofData.recipientOtp.length !== 6) {
      throw new BadRequestException('Valid 6-digit recipient OTP required');
    }

    // Create proof of delivery
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

    // Update delivery status to DELIVERED
    delivery.status = DeliveryStatus.DELIVERED;
    delivery.deliveredAt = new Date();
    await this.deliveryRepository.save(delivery);

    // Create timeline event
    const event = {
      deliveryId: delivery.id,
      status: DeliveryStatus.DELIVERED,
      actorId: riderId,
      actorRole: 'rider',
      notes: 'Delivered with proof',
      latitude: proofData.latitude,
      longitude: proofData.longitude,
    };
    delivery.events = [...(delivery.events || []), event] as any;

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

    if (delivery.redeliveryAttempts >= 1) {
      // Second failure - mark as RETURNED
      delivery.status = DeliveryStatus.RETURNED;
      await this.deliveryRepository.save(delivery);

      const event = {
        deliveryId: delivery.id,
        status: DeliveryStatus.RETURNED,
        actorId: riderId,
        actorRole: 'rider',
        notes: `Returned after ${delivery.redeliveryAttempts} failed attempts: ${reason}`,
        latitude,
        longitude,
      };
      delivery.events = [...(delivery.events || []), event] as any;
    } else {
      // First failure - mark as FAILED for redelivery
      delivery.status = DeliveryStatus.FAILED;
      await this.deliveryRepository.save(delivery);

      const event = {
        deliveryId: delivery.id,
        status: DeliveryStatus.FAILED,
        actorId: riderId,
        actorRole: 'rider',
        notes: `Failed: ${reason}. Redelivery attempt ${delivery.redeliveryAttempts}`,
        latitude,
        longitude,
      };
      delivery.events = [...(delivery.events || []), event] as any;
    }

    return delivery;
  }

  async scheduleRedelivery(deliveryId: string, adminId: string): Promise<Delivery> {
    const delivery = await this.getDeliveryById(deliveryId);
    
    if (delivery.status !== DeliveryStatus.FAILED) {
      throw new BadRequestException('Can only schedule redelivery for FAILED deliveries');
    }

    if (delivery.redeliveryAttempts >= 1) {
      throw new BadRequestException('Maximum redelivery attempts reached');
    }

    // Reset to SEARCHING for reassignment
    delivery.status = DeliveryStatus.SEARCHING;
    delivery.riderId = null;
    await this.deliveryRepository.save(delivery);

    const event = {
      deliveryId: delivery.id,
      status: DeliveryStatus.SEARCHING,
      actorId: adminId,
      actorRole: 'admin',
      notes: 'Redelivery scheduled',
    };
    delivery.events = [...(delivery.events || []), event] as any;

    return delivery;
  }

  async getProofOfDelivery(deliveryId: string): Promise<ProofOfDelivery | null> {
    return this.proofOfDeliveryRepository.findOne({ where: { deliveryId } });
  }
}