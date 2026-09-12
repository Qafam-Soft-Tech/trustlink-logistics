import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { PaymentService } from './services/payment.service';
import { Payment, PaymentProvider, PaymentStatus } from './entities/payment.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';

interface InitializePaymentDto {
  deliveryId: string;
  amount: number; // In kobo
  email: string;
  phone: string;
  provider: PaymentProvider;
  metadata?: Record<string, any>;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Initialize payment for a delivery' })
  async initializePayment(@CurrentUser() user: User, @Body() dto: InitializePaymentDto) {
    return this.paymentService.initializePayment({
      ...dto,
      email: dto.email || user.email,
      phone: dto.phone || user.phone,
    });
  }

  @Get(':reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by reference' })
  async getPayment(@CurrentUser() user: User, @Param('reference') reference: string) {
    const payment = await this.paymentService.getPaymentByReference(reference);
    // Check access - customer can only see their own payments, admin can see all
    if (user.role === UserRole.CUSTOMER && payment.delivery?.customerId !== user.id) {
      throw new Error('Not authorized');
    }
    if (user.role === UserRole.RIDER && payment.delivery?.riderId !== user.id) {
      throw new Error('Not authorized');
    }
    return payment;
  }

  @Get('delivery/:deliveryId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment for a delivery' })
  async getPaymentByDelivery(@CurrentUser() user: User, @Param('deliveryId') deliveryId: string) {
    return this.paymentService.getPaymentByDeliveryId(deliveryId);
  }

  @Post('verify/:reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually verify payment status' })
  async verifyPayment(@Param('reference') reference: string) {
    return this.paymentService.verifyPayment(reference);
  }

  // Webhook endpoints (no auth, but signature verification)
  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  async paystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const payload = req.body;
    return this.paymentService.handlePaystackWebhook(payload, signature);
  }

  @Post('webhook/flutterwave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flutterwave webhook endpoint' })
  async flutterwaveWebhook(
    @Headers('verif-hash') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    const payload = req.body;
    return this.paymentService.handleFlutterwaveWebhook(payload, signature);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all payments (admin)' })
  async getAllPayments(@Query('status') status?: PaymentStatus) {
    // TODO: Implement admin payment listing
    return { message: 'Admin payment listing not yet implemented' };
  }
}