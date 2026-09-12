import { Controller, Get, Post, Body, Param, UseGuards, Request, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { KycService } from './services/kyc.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole, KycStatus } from '../auth/entities/user.entity';
import { KycDocumentType } from './entities/kyc-submission.entity';

interface SubmitKycDto {
  nin: string;
  idType: KycDocumentType;
  idFrontUrl: string;
  idBackUrl: string;
  selfieUrl: string;
  vehicleRegistrationUrl: string;
  vehicleType: string;
  vehiclePlate: string;
}

@ApiTags('KYC')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KycController {
  constructor(private kycService: KycService) {}

  @Post('submit')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Submit KYC documents for verification' })
  async submitKyc(@CurrentUser() user: User, @Body() dto: SubmitKycDto) {
    return this.kycService.submitKyc(user.id, dto);
  }

  @Get('status')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Get current user KYC status' })
  async getKycStatus(@CurrentUser() user: User) {
    const submission = await this.kycService.getKycStatus(user.id);
    return {
      status: submission?.status || KycStatus.PENDING,
      rejectionReason: submission?.rejectionReason || null,
      submittedAt: submission?.createdAt || null,
      reviewedAt: submission?.reviewedAt || null,
    };
  }

  @Get('can-go-online')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Check if rider can go online' })
  async canGoOnline(@CurrentUser() user: User) {
    const canGoOnline = await this.kycService.canRiderGoOnline(user.id);
    return { canGoOnline };
  }

  @Get('pending')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all pending KYC submissions (admin)' })
  async getPendingSubmissions() {
    return this.kycService.getPendingKycSubmissions();
  }

  @Put(':userId/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve KYC submission (admin)' })
  async approveKyc(@CurrentUser() admin: User, @Param('userId') userId: string) {
    return this.kycService.approveKyc(admin.id, userId);
  }

  @Put(':userId/reject')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject KYC submission (admin)' })
  async rejectKyc(@CurrentUser() admin: User, @Param('userId') userId: string, @Body() body: { reason: string }) {
    return this.kycService.rejectKyc(admin.id, userId, body.reason);
  }
}