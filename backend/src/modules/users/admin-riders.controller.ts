import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { AdminRidersService } from './admin-riders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('Admin Riders')
@Controller('admin/riders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminRidersController {
  constructor(private adminRidersService: AdminRidersService) {}

  @Get()
  @ApiOperation({ summary: 'List riders with profiles and KYC documents (admin)' })
  async list() {
    return this.adminRidersService.list();
  }
}
