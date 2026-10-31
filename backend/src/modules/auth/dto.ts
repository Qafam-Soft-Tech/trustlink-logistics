import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { UserRole } from './entities/user.entity';
import { VehicleType } from '../deliveries/entities/rider-profile.entity';

const PHONE_PATTERN = /^0\d{10}$/;
const OTP_PATTERN = /^\d{6}$/;

export class SignupDto {
  @Matches(PHONE_PATTERN, { message: 'phone must be an 11-digit Nigerian number starting with 0' })
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsIn([UserRole.CUSTOMER, UserRole.RIDER], { message: 'role must be customer or rider' })
  role!: UserRole;
}

export class VerifyOtpDto {
  @Matches(PHONE_PATTERN, { message: 'phone must be an 11-digit Nigerian number starting with 0' })
  phone!: string;

  @Matches(OTP_PATTERN, { message: 'code must be a 6-digit OTP' })
  code!: string;
}

export class LoginDto {
  @Matches(PHONE_PATTERN, { message: 'phone must be an 11-digit Nigerian number starting with 0' })
  phone!: string;
}

export class ResendOtpDto {
  @Matches(PHONE_PATTERN, { message: 'phone must be an 11-digit Nigerian number starting with 0' })
  phone!: string;

  @IsOptional()
  @IsIn(['signup', 'login', 'reset'])
  purpose?: 'signup' | 'login' | 'reset';
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  // Accepted only so the service can reject the attempt with a precise message.
  @IsOptional()
  @Matches(PHONE_PATTERN, { message: 'phone must be an 11-digit Nigerian number starting with 0' })
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class ProfileSetupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Matches(PHONE_PATTERN, { message: 'phone must be an 11-digit Nigerian number starting with 0' })
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  vehiclePlate?: string;
}

export class AdminLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
