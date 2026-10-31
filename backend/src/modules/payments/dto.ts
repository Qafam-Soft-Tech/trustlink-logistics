import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { PackageType } from '../deliveries/entities/delivery.entity';
import { PaymentProvider } from './entities/payment.entity';

const PHONE_PATTERN = /^0\d{10}$/;

export class CalculateFareDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  distanceKm?: number;

  @IsOptional()
  @IsString()
  pickupArea?: string;

  @IsOptional()
  @IsString()
  dropoffArea?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLongitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  dropoffLatitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  dropoffLongitude?: number;

  @IsNumber()
  @Min(0.1)
  @Max(200)
  weightKg!: number;

  @IsEnum(PackageType)
  packageType!: PackageType;
}

export class UpdatePricingDto {
  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class InitializePaymentDto {
  @IsString()
  deliveryId!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsEmail()
  email!: string;

  @Matches(PHONE_PATTERN, { message: 'phone must be an 11-digit Nigerian number starting with 0' })
  phone!: string;

  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
