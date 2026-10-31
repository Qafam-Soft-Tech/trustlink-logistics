import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { DeliveryService } from './services/delivery.service';
import { Delivery, DeliveryStatus } from './entities/delivery.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';
import { parsePagination } from '../../common/pagination';
import {
  AssignRiderDto,
  CompleteDeliveryDto,
  CreateAddressDto,
  CreateDeliveryDto,
  OptionalLocationDto,
  ReportFailureDto,
  SetFareDto,
  UpdateAddressDto,
  UpdateDeliveryStatusDto,
} from './dto';

@ApiTags('Deliveries')
@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pagination = parsePagination(page, limit);
    if (user.role === UserRole.CUSTOMER) {
      return this.deliveryService.getCustomerDeliveries(user.id, status, pagination);
    }
    if (user.role === UserRole.RIDER) {
      return this.deliveryService.getRiderDeliveries(user.id, status, pagination);
    }
    return this.deliveryService.getAllDeliveries(status, pagination);
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all deliveries (admin)' })
  async getAllDeliveries(
    @Query('status') status?: DeliveryStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.deliveryService.getAllDeliveries(status, parsePagination(page, limit));
  }

  // Saved addresses are declared before `:id` so they are not shadowed by it.
  @Post('addresses')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a saved address' })
  async createAddress(@CurrentUser() user: User, @Body() dto: CreateAddressDto) {
    return this.deliveryService.createAddress(user.id, dto);
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
  async updateAddress(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.deliveryService.updateAddress(id, user.id, dto);
  }

  @Post('addresses/:id/default')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Set default address' })
  async setDefaultAddress(@CurrentUser() user: User, @Param('id') id: string) {
    return this.deliveryService.setDefaultAddress(id, user.id);
  }

  @Delete('addresses/:id')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Delete saved address' })
  async deleteAddress(@CurrentUser() user: User, @Param('id') id: string) {
    await this.deliveryService.deleteAddress(id, user.id);
    return { deleted: true };
  }

  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Track delivery by tracking number' })
  async trackDelivery(@Param('trackingNumber') trackingNumber: string) {
    return this.deliveryService.getDeliveryByTrackingNumber(trackingNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get delivery by ID' })
  async getDelivery(@CurrentUser() user: User, @Param('id') id: string) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return delivery;
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update delivery status' })
  async updateStatus(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return this.deliveryService.updateDeliveryStatus(
      id,
      dto.status,
      user.id,
      user.role as 'customer' | 'rider' | 'admin',
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
  async setFare(@Param('id') id: string, @Body() dto: SetFareDto) {
    return this.deliveryService.setFare(id, dto.fare);
  }

  @Post(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cancel delivery (customer)' })
  async cancelDelivery(@CurrentUser() user: User, @Param('id') id: string) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return this.deliveryService.cancelDelivery(id, user.id);
  }

  @Put(':id/pickup')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Mark package as picked up (rider)' })
  async markPickedUp(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: OptionalLocationDto,
  ) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return this.deliveryService.markPickedUp(id, user.id, dto.latitude, dto.longitude);
  }

  @Put(':id/in-transit')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Mark package as in transit (rider)' })
  async markInTransit(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: OptionalLocationDto,
  ) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return this.deliveryService.markInTransit(id, user.id, dto.latitude, dto.longitude);
  }

  @Post(':id/complete')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Complete delivery with proof (rider)' })
  async completeDelivery(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: CompleteDeliveryDto,
  ) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return this.deliveryService.completeDelivery(id, user.id, dto);
  }

  @Post(':id/recipient-otp/resend')
  @Roles(UserRole.CUSTOMER, UserRole.RIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Resend the recipient confirmation code' })
  async resendRecipientOtp(@CurrentUser() user: User, @Param('id') id: string) {
    return this.deliveryService.resendRecipientOtp(id, user.id, user.role as 'customer' | 'rider' | 'admin');
  }

  @Post(':id/failure')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Report delivery failure (rider)' })
  async reportFailure(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ReportFailureDto,
  ) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return this.deliveryService.reportFailure(id, user.id, dto.reason, dto.latitude, dto.longitude);
  }

  @Post(':id/redelivery')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Schedule redelivery for failed delivery (admin)' })
  async scheduleRedelivery(@CurrentUser() user: User, @Param('id') id: string) {
    return this.deliveryService.scheduleRedelivery(id, user.id);
  }

  @Get(':id/proof')
  @ApiOperation({ summary: 'Get proof of delivery' })
  async getProofOfDelivery(@CurrentUser() user: User, @Param('id') id: string) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    this.checkAccess(user, delivery);
    return this.deliveryService.getProofOfDelivery(id);
  }

  private checkAccess(user: User, delivery: Delivery): void {
    if (user.role === UserRole.ADMIN) return;
    if (user.role === UserRole.CUSTOMER && delivery.customerId === user.id) return;
    if (user.role === UserRole.RIDER && delivery.riderId === user.id) return;
    throw new ForbiddenException('Not authorized');
  }
}
