import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Delivery } from './delivery.entity';
import { User } from '../../auth/entities/user.entity';

export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum IssueType {
  DELIVERY_ISSUE = 'delivery_issue',
  PAYMENT_ISSUE = 'payment_issue',
  RIDER_ISSUE = 'rider_issue',
  OTHER = 'other',
}

export enum IssuePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('issues')
@Index(['deliveryId'])
@Index(['reporterId'])
@Index(['status'])
@Index(['assignedToId'])
export class Issue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  deliveryId!: string;

  @ManyToOne(() => Delivery)
  @JoinColumn({ name: 'deliveryId' })
  delivery!: Delivery;

  @Column()
  reporterId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporterId' })
  reporter!: User;

  @Column({ nullable: true })
  assignedToId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo!: User;

  @Column({ type: 'enum', enum: IssueType, default: IssueType.DELIVERY_ISSUE })
  type!: IssueType;

  @Column({ type: 'enum', enum: IssueStatus, default: IssueStatus.OPEN })
  status!: IssueStatus;

  @Column({ type: 'enum', enum: IssuePriority, default: IssuePriority.MEDIUM })
  priority!: IssuePriority;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments!: string[];

  @Column({ nullable: true })
  resolution!: string;

  @Column({ nullable: true })
  resolvedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}