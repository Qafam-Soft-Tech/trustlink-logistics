import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { RiderProfileService } from './services/rider-profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { VehicleType, RiderStatus } from './entities/rider-profile.entity';

@ApiTags('Rider Profile')
@Controller('rider/profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RiderProfileController {
  constructor(private riderProfileService: RiderProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current rider profile' })
  async getProfile(@Request() req: any) {
    return this.riderProfileService.getProfile(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Update rider profile (vehicle, zone)' })
  async updateProfile(@Request() req: any, @Body() data: {
    vehicleType?: VehicleType;
    vehiclePlate?: string;
    vehicleModel?: string;
    vehicleColor?: string;
    zone?: string;
  }) {
    return this.riderProfileService.updateProfile(req.user.id, data);
  }

  @Put('status')
  @ApiOperation({ summary: 'Toggle online/offline status' })
  async toggleStatus(@Request() req: any) {
    return this.riderProfileService.toggleOnlineStatus(req.user.id);
  }

  @Put('status/set')
  @ApiOperation({ summary: 'Set specific status (online/offline/on_trip)' })
  async setStatus(@Request() req: any, @Body() data: { status: RiderStatus }) {
    return this.riderProfileService.setStatus(req.user.id, data.status);
  }

  @Put('location')
  @ApiOperation({ summary: 'Update rider location' })
  async updateLocation(@Request() req: any, @Body() data: { latitude: number; longitude: number }) {
    return this.riderProfileService.updateLocation(req.user.id, data.latitude, data.longitude);
  }
}