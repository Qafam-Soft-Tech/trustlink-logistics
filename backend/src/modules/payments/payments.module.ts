import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PricingConfig } from './entities/pricing-config.entity';
import { Payment } from './entities/payment.entity';
import { Delivery } from '../deliveries/entities/delivery.entity';
import { PricingController } from './pricing.controller';
import { PaymentController } from './payment.controller';
import { FareCalculationService } from './services/fare-calculation.service';
import { DistanceService } from './services/distance.service';
import { PaymentService } from './services/payment.service';

@Module({
  imports: [TypeOrmModule.forFeature([PricingConfig, Payment, Delivery])],
  controllers: [PricingController, PaymentController],
  providers: [FareCalculationService, DistanceService, PaymentService],
  exports: [FareCalculationService, DistanceService, PaymentService],
})
export class PaymentsModule {}