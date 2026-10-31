import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  ParseEnumPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { FareCalculationService } from './services/fare-calculation.service';
import { DistanceService } from './services/distance.service';
import { PricingConfigKey, DEFAULT_PRICING_CONFIG } from './entities/pricing-config.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserRole } from '../auth/entities/user.entity';
import { CalculateFareDto, UpdatePricingDto } from './dto';

@ApiTags('Pricing')
@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PricingController {
  constructor(
    private fareCalculationService: FareCalculationService,
    private distanceService: DistanceService,
  ) {}

  @Post('calculate')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Calculate fare for a delivery' })
  async calculateFare(@Body() dto: CalculateFareDto) {
    return this.fareCalculationService.calculateFare({
      distanceKm: this.distanceService.resolve(dto),
      weightKg: dto.weightKg,
      packageType: dto.packageType,
    });
  }

  @Get('config')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all pricing configuration (admin)' })
  async getAllConfigs() {
    return this.fareCalculationService.getAllConfigs();
  }

  @Get('config/:key')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get specific pricing config (admin)' })
  async getConfig(@Param('key', new ParseEnumPipe(PricingConfigKey)) key: PricingConfigKey) {
    const value = await this.fareCalculationService.getConfig(key);
    return { key, value, defaultValue: DEFAULT_PRICING_CONFIG[key].value };
  }

  @Put('config/:key')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update pricing configuration (admin)' })
  async updateConfig(
    @CurrentUser() user: User,
    @Param('key', new ParseEnumPipe(PricingConfigKey)) key: PricingConfigKey,
    @Body() dto: UpdatePricingDto,
  ) {
    return this.fareCalculationService.setConfig(key, dto.value, user.id, dto.description);
  }

  @Post('initialize')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Initialize default pricing config (admin)' })
  async initializeDefaults() {
    await this.fareCalculationService.initializeDefaults();
    return { message: 'Default pricing configuration initialized' };
  }

  @Get('defaults')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get default pricing config values' })
  async getDefaults() {
    return DEFAULT_PRICING_CONFIG;
  }
}
