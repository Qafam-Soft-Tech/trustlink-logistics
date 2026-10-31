import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum DeliveryStatus {
  REQUESTED = 'requested',
  SEARCHING = 'searching',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

export enum PackageType {
  DOCUMENT = 'document',
  PARCEL = 'parcel',
}

@Entity('addresses')
@Index(['userId'])
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  label!: string; // e.g., 'Home', 'Office', 'Mom\'s place'

  @Column()
  street!: string;

  @Column({ nullable: true })
  landmark!: string; // Informal address tolerance per NFR-5

  @Column({ nullable: true })
  area!: string; // e.g., 'Wuse 2', 'Maitama'

  @Column({ nullable: true })
  city!: string;

  @Column({ nullable: true })
  state!: string;

  @Column({ nullable: true })
  country!: string;

  @Column({ nullable: true })
  latitude!: number;

  @Column({ nullable: true })
  longitude!: number;

  @Column({ default: false })
  isDefault!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

@Entity('deliveries')
@Index(['customerId'])
@Index(['riderId'])
@Index(['status'])
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  trackingNumber!: string; // e.g., TLK-2024-001

  @Column()
  customerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'customerId' })
  customer!: User;

  @Column({ nullable: true })
  riderId!: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'riderId' })
  rider!: User;

  // Pickup address (embedded for snapshot at creation time)
  @Column()
  pickupStreet!: string;

  @Column({ nullable: true })
  pickupLandmark!: string;

  @Column({ nullable: true })
  pickupArea!: string;

  @Column({ nullable: true })
  pickupLatitude!: number;

  @Column({ nullable: true })
  pickupLongitude!: number;

  // Dropoff address (embedded for snapshot at creation time)
  @Column()
  dropoffStreet!: string;

  @Column({ nullable: true })
  dropoffLandmark!: string;

  @Column({ nullable: true })
  dropoffArea!: string;

  @Column({ nullable: true })
  dropoffLatitude!: number;

  @Column({ nullable: true })
  dropoffLongitude!: number;

  // Package details
  @Column({ type: 'enum', enum: PackageType })
  packageType!: PackageType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  packageWeight!: number; // in kg

  @Column({ nullable: true })
  packageDescription!: string;

  // Sender info
  @Column()
  senderName!: string;

  @Column()
  senderPhone!: string;

  // Recipient info
  @Column()
  recipientName!: string;

  @Column()
  recipientPhone!: string;

  // Status & tracking
  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.REQUESTED })
  status!: DeliveryStatus;

  @Column({ nullable: true })
  failureReason!: string;

  @Column({ default: 0 })
  redeliveryAttempts!: number;

  @Column({ nullable: true })
  assignedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt!: Date | null;

  @Column({ nullable: true })
  pickedUpAt!: Date;

  @Column({ nullable: true })
  deliveredAt!: Date;

  @Column({ nullable: true })
  cancelledAt!: Date;

  // Fare (set after fare calculation)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fare!: number;

  @Column({ nullable: true })
  paymentReference!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Timeline events (for tracking)
  @OneToMany(() => DeliveryEvent, event => event.delivery)
  events!: DeliveryEvent[];
}

@Entity('delivery_events')
@Index(['deliveryId'])
export class DeliveryEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  deliveryId!: string;

  @ManyToOne(() => Delivery)
  @JoinColumn({ name: 'deliveryId' })
  delivery!: Delivery;

  @Column({ type: 'enum', enum: DeliveryStatus })
  status!: DeliveryStatus;

  @Column({ nullable: true })
  actorId!: string; // userId of customer/rider/admin who triggered the event

  @Column({ nullable: true })
  actorRole!: string; // 'customer' | 'rider' | 'admin'

  @Column({ nullable: true })
  notes!: string;

  @Column({ nullable: true })
  latitude!: number;

  @Column({ nullable: true })
  longitude!: number;

  @CreateDateColumn()
  createdAt!: Date;
}