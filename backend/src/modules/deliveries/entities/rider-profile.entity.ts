import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum VehicleType {
  MOTORCYCLE = 'motorcycle',
  VAN = 'van',
  TRUCK = 'truck',
}

export enum RiderStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ON_TRIP = 'on_trip',
}

@Entity('rider_profiles')
@Index(['userId'], { unique: true })
@Index(['status'])
@Index(['zone'])
export class RiderProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'enum', enum: VehicleType })
  vehicleType!: VehicleType;

  @Column()
  vehiclePlate!: string;

  @Column({ nullable: true })
  vehicleModel!: string;

  @Column({ nullable: true })
  vehicleColor!: string;

  @Column({ nullable: true })
  zone!: string; // Service area/zone

  @Column({ type: 'enum', enum: RiderStatus, default: RiderStatus.OFFLINE })
  status!: RiderStatus;

  @Column({ default: 0 })
  currentLatitude!: number;

  @Column({ default: 0 })
  currentLongitude!: number;

  @Column({ nullable: true })
  lastLocationUpdate!: Date;

  @Column({ default: 0 })
  rating!: number;

  @Column({ default: 0 })
  totalDeliveries!: number;

  @Column({ default: 0 })
  cancelledDeliveries!: number;

  @Column({ default: 0 })
  failedDeliveries!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}