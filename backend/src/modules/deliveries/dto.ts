import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';

import { DeliveryStatus, PackageType } from './entities/delivery.entity';
import { RiderStatus, VehicleType } from './entities/rider-profile.entity';
import { IssuePriority, IssueStatus, IssueType } from './entities/issue.entity';

const PHONE_PATTERN = /^0\d{10}$/;
const OTP_PATTERN = /^\d{6}$/;

export class CreateDeliveryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  pickupStreet!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  pickupLandmark?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  pickupArea?: string;

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

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  dropoffStreet!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  dropoffLandmark?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  dropoffArea?: string;

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

  @IsEnum(PackageType)
  packageType!: PackageType;

  @IsNumber()
  @Min(0.1)
  @Max(200)
  packageWeight!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  packageDescription?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  senderName!: string;

  @Matches(PHONE_PATTERN, { message: 'senderPhone must be an 11-digit Nigerian number starting with 0' })
  senderPhone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  recipientName!: string;

  @Matches(PHONE_PATTERN, { message: 'recipientPhone must be an 11-digit Nigerian number starting with 0' })
  recipientPhone!: string;
}

export class UpdateDeliveryStatusDto {
  @IsEnum(DeliveryStatus)
  status!: DeliveryStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

export class AssignRiderDto {
  @IsUUID()
  riderId!: string;
}

export class ReassignRiderDto {
  @IsUUID()
  newRiderId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class SetFareDto {
  @IsNumber()
  @Min(0)
  fare!: number;
}

export class LocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

export class OptionalLocationDto {
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

export class CompleteDeliveryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  photoUrl!: string;

  @Matches(OTP_PATTERN, { message: 'recipientOtp must be a 6-digit code' })
  recipientOtp!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  recipientName!: string;

  @Matches(PHONE_PATTERN, { message: 'recipientPhone must be an 11-digit Nigerian number starting with 0' })
  recipientPhone!: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ReportFailureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  street!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  area?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}

export class UpdateRiderProfileDto {
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  vehiclePlate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  vehicleModel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  vehicleColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  zone?: string;
}

export class SetRiderStatusDto {
  @IsEnum(RiderStatus)
  status!: RiderStatus;
}

export class CreateIssueDto {
  @IsUUID()
  deliveryId!: string;

  @IsEnum(IssueType)
  type!: IssueType;

  @IsEnum(IssuePriority)
  priority!: IssuePriority;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class UpdateIssueStatusDto {
  @IsEnum(IssueStatus)
  status!: IssueStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolution?: string;
}

export class AssignIssueDto {
  @IsUUID()
  assignedToId!: string;
}
