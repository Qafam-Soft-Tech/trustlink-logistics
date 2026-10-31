import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Delivery } from './delivery.entity';

@Entity('proof_of_delivery')
@Index(['deliveryId'], { unique: true })
export class ProofOfDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  deliveryId!: string;

  @ManyToOne(() => Delivery)
  @JoinColumn({ name: 'deliveryId' })
  delivery!: Delivery;

  @Column()
  photoUrl!: string;

  @Column()
  recipientOtp!: string;

  @Column()
  recipientName!: string;

  @Column()
  recipientPhone!: string;

  @Column({ type: 'double precision', nullable: true })
  latitude!: number;

  @Column({ type: 'double precision', nullable: true })
  longitude!: number;

  @Column({ nullable: true })
  notes!: string;

  @CreateDateColumn()
  createdAt!: Date;
}