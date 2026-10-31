import { Controller, Get, Param, Put, Query, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { UpdateUserKycDto } from './dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  async findAll(
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.usersService.findAll(role, isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id/kyc')
  @ApiOperation({ summary: 'Update KYC status (admin only)' })
  async updateKycStatus(@Param('id') id: string, @Body() dto: UpdateUserKycDto) {
    return this.usersService.updateKycStatus(id, dto.status, dto.rejectionReason);
  }

  @Put(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle user active status (admin only)' })
  async toggleActiveStatus(@Param('id') id: string) {
    return this.usersService.toggleActiveStatus(id);
  }
}
