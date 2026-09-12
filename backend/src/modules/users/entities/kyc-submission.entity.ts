import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum KycDocumentType {
  NIN = 'nin',
  ID_FRONT = 'id_front',
  ID_BACK = 'id_back',
  SELFIE = 'selfie',
  VEHICLE_REGISTRATION = 'vehicle_registration',
}

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('kyc_submissions')
@Index(['userId'], { unique: true })
export class KycSubmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ nullable: true })
  nin!: string;

  @Column({ type: 'enum', enum: KycDocumentType, nullable: true })
  idType!: KycDocumentType;

  @Column({ nullable: true })
  idFrontUrl!: string;

  @Column({ nullable: true })
  idBackUrl!: string;

  @Column({ nullable: true })
  selfieUrl!: string;

  @Column({ nullable: true })
  vehicleRegistrationUrl!: string;

  @Column({ nullable: true })
  vehicleType!: string;

  @Column({ nullable: true })
  vehiclePlate!: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  status!: KycStatus;

  @Column({ nullable: true, type: 'text' })
  rejectionReason!: string | null;

  @Column({ nullable: true, type: 'text' })
  reviewedBy!: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  reviewedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}