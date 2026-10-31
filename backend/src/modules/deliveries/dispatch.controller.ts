import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { DispatchService } from './services/dispatch.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';
import {
  AssignRiderDto,
  LocationDto,
  ReassignRiderDto,
  SetRiderStatusDto,
} from './dto';

@ApiTags('Dispatch')
@Controller('dispatch')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DispatchController {
  constructor(private dispatchService: DispatchService) {}

  @Get('board')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get live delivery board (admin)' })
  async getLiveBoard() {
    return this.dispatchService.getLiveDeliveryBoard();
  }

  @Get(':deliveryId/eligible-riders')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get eligible riders for a delivery (admin)' })
  async getEligibleRiders(@Param('deliveryId') deliveryId: string) {
    return this.dispatchService.getEligibleRiders(deliveryId);
  }

  @Put(':deliveryId/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign rider to delivery (admin)' })
  async assignRider(
    @CurrentUser() user: User,
    @Param('deliveryId') deliveryId: string,
    @Body() dto: AssignRiderDto,
  ) {
    return this.dispatchService.assignRider(deliveryId, dto.riderId, user.id);
  }

  @Put(':deliveryId/reassign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reassign rider to delivery (admin)' })
  async reassignRider(
    @CurrentUser() user: User,
    @Param('deliveryId') deliveryId: string,
    @Body() dto: ReassignRiderDto,
  ) {
    return this.dispatchService.reassignRider(deliveryId, dto.newRiderId, user.id, dto.reason);
  }

  @Get('my-queue')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Get rider assigned deliveries queue' })
  async getMyQueue(@CurrentUser() user: User) {
    return this.dispatchService.getRiderQueue(user.id);
  }

  @Post(':deliveryId/acknowledge')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Acknowledge assigned job (rider)' })
  async acknowledgeJob(@CurrentUser() user: User, @Param('deliveryId') deliveryId: string) {
    return this.dispatchService.riderAcknowledgeJob(deliveryId, user.id);
  }

  @Put('location')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Update rider location (rider)' })
  async updateLocation(@CurrentUser() user: User, @Body() dto: LocationDto) {
    return this.dispatchService.updateRiderLocation(user.id, dto.latitude, dto.longitude);
  }

  @Put('status')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Update rider status (rider)' })
  async setStatus(@CurrentUser() user: User, @Body() dto: SetRiderStatusDto) {
    return this.dispatchService.setRiderStatus(user.id, dto.status);
  }

  @Get('status')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Get current rider status and profile' })
  async getStatus(@CurrentUser() user: User) {
    return this.dispatchService.getRiderStatus(user.id);
  }
}
