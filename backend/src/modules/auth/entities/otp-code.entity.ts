import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('otp_codes')
@Index(['phone', 'purpose'])
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  phone!: string;

  /**
   * HMAC-SHA256 of the 6-digit code. The database column keeps the historical
   * name `code` so existing local databases upgrade cleanly.
   */
  @Column({ name: 'code' })
  codeHash!: string;

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