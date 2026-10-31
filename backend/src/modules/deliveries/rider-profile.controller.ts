import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { RiderProfileService } from './services/rider-profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';
import { LocationDto, SetRiderStatusDto, UpdateRiderProfileDto } from './dto';

@ApiTags('Rider Profile')
@Controller('rider/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RIDER)
@ApiBearerAuth()
export class RiderProfileController {
  constructor(private riderProfileService: RiderProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current rider profile' })
  async getProfile(@CurrentUser() user: User) {
    return this.riderProfileService.getProfile(user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update rider profile (vehicle, zone)' })
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateRiderProfileDto) {
    return this.riderProfileService.updateProfile(user.id, dto);
  }

  @Put('status')
  @ApiOperation({ summary: 'Toggle online/offline status' })
  async toggleStatus(@CurrentUser() user: User) {
    return this.riderProfileService.toggleOnlineStatus(user.id);
  }

  @Put('status/set')
  @ApiOperation({ summary: 'Set specific status (online/offline/on_trip)' })
  async setStatus(@CurrentUser() user: User, @Body() dto: SetRiderStatusDto) {
    return this.riderProfileService.setStatus(user.id, dto.status);
  }

  @Put('location')
  @ApiOperation({ summary: 'Update rider location' })
  async updateLocation(@CurrentUser() user: User, @Body() dto: LocationDto) {
    return this.riderProfileService.updateLocation(user.id, dto.latitude, dto.longitude);
  }
}
