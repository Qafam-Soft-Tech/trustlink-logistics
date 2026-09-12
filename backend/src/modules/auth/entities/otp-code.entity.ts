import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('otp_codes')
@Index(['phone', 'code'], { unique: true })
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  phone!: string;

  @Column()
  code!: string;

  @Column({ type: 'enum', enum: ['signup', 'login', 'reset'], default: 'signup' })
  purpose!: string;

  @Column({ default: 0 })
  attempts!: number;

  @Column({ default: false })
  isUsed!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  expiresAt!: Date;
}