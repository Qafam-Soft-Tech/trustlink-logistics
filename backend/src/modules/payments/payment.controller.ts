import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { PaymentService } from './services/payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';
import { InitializePaymentDto } from './dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize payment for a delivery' })
  async initializePayment(@CurrentUser() user: User, @Body() dto: InitializePaymentDto) {
    return this.paymentService.initializePayment(user.id, dto);
  }

  @Get('delivery/:deliveryId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment for a delivery' })
  async getPaymentByDelivery(@CurrentUser() user: User, @Param('deliveryId') deliveryId: string) {
    const payment = await this.paymentService.getPaymentByDeliveryId(deliveryId);
    if (payment && user.role === UserRole.CUSTOMER && payment.delivery?.customerId !== user.id) {
      throw new ForbiddenException('Not authorized');
    }
    return payment;
  }

  @Post('verify/:reference')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually verify payment status' })
  async verifyPayment(@CurrentUser() user: User, @Param('reference') reference: string) {
    const payment = await this.paymentService.getPaymentByReference(reference);
    if (user.role === UserRole.CUSTOMER && payment.delivery?.customerId !== user.id) {
      throw new ForbiddenException('Not authorized');
    }
    return this.paymentService.verifyPayment(reference);
  }

  @Get(':reference')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by reference' })
  async getPayment(@CurrentUser() user: User, @Param('reference') reference: string) {
    const payment = await this.paymentService.getPaymentByReference(reference);
    if (user.role === UserRole.CUSTOMER && payment.delivery?.customerId !== user.id) {
      throw new ForbiddenException('Not authorized');
    }
    return payment;
  }

  // Webhooks are intentionally unauthenticated; the service verifies signatures.
  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  async paystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentService.handlePaystackWebhook(req.body, signature);
  }

  @Post('webhook/flutterwave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flutterwave webhook endpoint' })
  async flutterwaveWebhook(
    @Headers('verif-hash') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentService.handleFlutterwaveWebhook(req.body, signature);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments (admin)' })
  async getAllPayments(@CurrentUser() _user: User) {
    return this.paymentService.getAllPayments();
  }
}
