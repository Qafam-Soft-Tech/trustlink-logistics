import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { DeliveryService } from './services/delivery.service';
import { Delivery, DeliveryStatus, PackageType, Address } from './entities/delivery.entity';
import { ProofOfDelivery } from './entities/proof-of-delivery.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';

interface CreateDeliveryDto {
  pickupStreet: string;
  pickupLandmark?: string;
  pickupArea?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropoffStreet: string;
  dropoffLandmark?: string;
  dropoffArea?: string;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
  packageType: PackageType;
  packageWeight: number;
  packageDescription?: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
}

interface UpdateStatusDto {
  status: DeliveryStatus;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

interface AssignRiderDto {
  riderId: string;
}

@ApiTags('Deliveries')
@Controller('deliveries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new delivery request' })
  async createDelivery(@CurrentUser() user: User, @Body() dto: CreateDeliveryDto) {
    return this.deliveryService.createDelivery(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get deliveries for current user (customer/rider)' })
  async getMyDeliveries(
    @CurrentUser() user: User,
    @Query('status') status?: DeliveryStatus,
  ) {
    if (user.role === UserRole.CUSTOMER) {
      return this.deliveryService.getCustomerDeliveries(user.id, status);
    } else if (user.role === UserRole.RIDER) {
      return this.deliveryService.getRiderDeliveries(user.id, status);
    }
    return this.deliveryService.getAllDeliveries(status);
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all deliveries (admin)' })
  async getAllDeliveries(@Query('status') status?: DeliveryStatus) {
    return this.deliveryService.getAllDeliveries(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get delivery by ID' })
  async getDelivery(@CurrentUser() user: User, @Param('id') id: string) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return delivery;
  }

  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Track delivery by tracking number (public)' })
  async trackDelivery(@Param('trackingNumber') trackingNumber: string) {
    return this.deliveryService.getDeliveryByTrackingNumber(trackingNumber);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update delivery status' })
  async updateStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return this.deliveryService.updateDeliveryStatus(
      id,
      dto.status,
      user.id,
      user.role.toLowerCase() as 'customer' | 'rider' | 'admin',
      dto.notes,
      dto.latitude,
      dto.longitude,
    );
  }

  @Put(':id/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign rider to delivery (admin)' })
  async assignRider(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: AssignRiderDto) {
    return this.deliveryService.assignRider(id, dto.riderId, user.id);
  }

  @Put(':id/fare')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Set delivery fare (admin)' })
  async setFare(@Param('id') id: string, @Body() body: { fare: number }) {
    return this.deliveryService.setFare(id, body.fare);
  }

  @Post(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cancel delivery (customer)' })
  async cancelDelivery(@CurrentUser() user: User, @Param('id') id: string) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    if (delivery.customerId !== user.id) {
      throw new Error('Not authorized');
    }
    return this.deliveryService.cancelDelivery(id, user.id);
  }

  // Address endpoints
  @Post('addresses')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a saved address' })
  async createAddress(@CurrentUser() user: User, @Body() data: Partial<Address>) {
    return this.deliveryService.createAddress(user.id, data);
  }

  @Get('addresses')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get user saved addresses' })
  async getAddresses(@CurrentUser() user: User) {
    return this.deliveryService.getUserAddresses(user.id);
  }

  @Put('addresses/:id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Update saved address' })
  async updateAddress(@CurrentUser() user: User, @Param('id') id: string, @Body() data: Partial<Address>) {
    return this.deliveryService.updateAddress(id, user.id, data);
  }

  @Post('addresses/:id/default')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Set default address' })
  async setDefaultAddress(@CurrentUser() user: User, @Param('id') id: string) {
    return this.deliveryService.setDefaultAddress(id, user.id);
  }

  // Phase 8: Delivery Execution & Proof of Delivery endpoints

  @Put(':id/pickup')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Mark package as picked up (rider)' })
  async markPickedUp(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { latitude?: number; longitude?: number },
  ) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return this.deliveryService.markPickedUp(id, user.id, body.latitude, body.longitude);
  }

  @Put(':id/in-transit')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Mark package as in transit (rider)' })
  async markInTransit(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { latitude?: number; longitude?: number },
  ) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return this.deliveryService.markInTransit(id, user.id, body.latitude, body.longitude);
  }

  @Post(':id/complete')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Complete delivery with proof (rider)' })
  async completeDelivery(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: {
      photoUrl: string;
      recipientOtp: string;
      recipientName: string;
      recipientPhone: string;
      latitude?: number;
      longitude?: number;
      notes?: string;
    },
  ) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return this.deliveryService.completeDelivery(id, user.id, body);
  }

  @Post(':id/failure')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Report delivery failure (rider)' })
  async reportFailure(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: { reason: string; latitude?: number; longitude?: number },
  ) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return this.deliveryService.reportFailure(id, user.id, body.reason, body.latitude, body.longitude);
  }

  @Post(':id/redelivery')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Schedule redelivery for failed delivery (admin)' })
  async scheduleRedelivery(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    return this.deliveryService.scheduleRedelivery(id, user.id);
  }

  @Get(':id/proof')
  @ApiOperation({ summary: 'Get proof of delivery' })
  async getProofOfDelivery(@Param('id') id: string) {
    return this.deliveryService.getProofOfDelivery(id);
  }

  private checkAccess(user: User, delivery: Delivery): void {
    if (user.role === UserRole.ADMIN) return;
    if (user.role === UserRole.CUSTOMER && delivery.customerId !== user.id) {
      throw new Error('Not authorized');
    }
    if (user.role === UserRole.RIDER && delivery.riderId !== user.id) {
      throw new Error('Not authorized');
    }
  }
}