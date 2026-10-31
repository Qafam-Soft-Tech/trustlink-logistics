import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { KycStatus } from '../auth/entities/user.entity';
import { KycDocumentType } from './entities/kyc-submission.entity';

export class SubmitKycDto {
  @Matches(/^\d{11}$/, { message: 'nin must be 11 digits' })
  nin!: string;

  @IsEnum(KycDocumentType)
  idType!: KycDocumentType;

  @IsString()
  @IsNotEmpty()
  idFrontUrl!: string;

  @IsString()
  @IsNotEmpty()
  idBackUrl!: string;

  @IsString()
  @IsNotEmpty()
  selfieUrl!: string;

  @IsString()
  @IsNotEmpty()
  vehicleRegistrationUrl!: string;

  @IsString()
  @IsNotEmpty()
  vehicleType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  vehiclePlate!: string;
}

export class RejectKycDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}

export class UpdateUserKycDto {
  @IsEnum(KycStatus)
  status!: KycStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
