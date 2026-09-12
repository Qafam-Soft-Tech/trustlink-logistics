import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PricingConfig, PricingConfigKey, DEFAULT_PRICING_CONFIG } from '../entities/pricing-config.entity';

export interface FareCalculationInput {
  distanceKm: number;
  weightKg: number;
  packageType: string;
}

export interface FareBreakdown {
  baseFare: number;
  distanceCharge: number;
  weightCharge: number;
  subtotal: number;
  minimumFare: number;
  totalFare: number;
  weightTier: { max: number; multiplier: number };
  distanceBand: { max: number; multiplier: number };
}

@Injectable()
export class FareCalculationService {
  constructor(
    @InjectRepository(PricingConfig)
    private pricingConfigRepository: Repository<PricingConfig>,
  ) {}

  async calculateFare(input: FareCalculationInput): Promise<FareBreakdown> {
    const config = await this.getAllConfig();

    const baseFare = config[PricingConfigKey.BASE_FARE];
    const perKmRate = config[PricingConfigKey.PER_KM_RATE];
    const perKgRate = config[PricingConfigKey.PER_KG_RATE];
    const minimumFare = config[PricingConfigKey.MINIMUM_FARE];

    // Determine weight tier
    const weightTier = this.getWeightTier(input.weightKg, config);
    const weightCharge = input.weightKg * perKgRate * weightTier.multiplier;

    // Determine distance band
    const distanceBand = this.getDistanceBand(input.distanceKm, config);
    const distanceCharge = input.distanceKm * perKmRate * distanceBand.multiplier;

    const subtotal = baseFare + distanceCharge + weightCharge;
    const totalFare = Math.max(subtotal, minimumFare);

    return {
      baseFare,
      distanceCharge: Math.round(distanceCharge * 100) / 100,
      weightCharge: Math.round(weightCharge * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      minimumFare,
      totalFare: Math.round(totalFare * 100) / 100,
      weightTier,
      distanceBand,
    };
  }

  private getWeightTier(weightKg: number, config: Record<PricingConfigKey, number>) {
    if (weightKg <= config[PricingConfigKey.WEIGHT_TIER_1_MAX]) {
      return { max: config[PricingConfigKey.WEIGHT_TIER_1_MAX], multiplier: config[PricingConfigKey.WEIGHT_TIER_1_MULTIPLIER] };
    }
    if (weightKg <= config[PricingConfigKey.WEIGHT_TIER_2_MAX]) {
      return { max: config[PricingConfigKey.WEIGHT_TIER_2_MAX], multiplier: config[PricingConfigKey.WEIGHT_TIER_2_MULTIPLIER] };
    }
    if (weightKg <= config[PricingConfigKey.WEIGHT_TIER_3_MAX]) {
      return { max: config[PricingConfigKey.WEIGHT_TIER_3_MAX], multiplier: config[PricingConfigKey.WEIGHT_TIER_3_MULTIPLIER] };
    }
    return { max: config[PricingConfigKey.WEIGHT_TIER_4_MAX], multiplier: config[PricingConfigKey.WEIGHT_TIER_4_MULTIPLIER] };
  }

  private getDistanceBand(distanceKm: number, config: Record<PricingConfigKey, number>) {
    if (distanceKm <= config[PricingConfigKey.DISTANCE_BAND_1_MAX]) {
      return { max: config[PricingConfigKey.DISTANCE_BAND_1_MAX], multiplier: config[PricingConfigKey.DISTANCE_BAND_1_MULTIPLIER] };
    }
    if (distanceKm <= config[PricingConfigKey.DISTANCE_BAND_2_MAX]) {
      return { max: config[PricingConfigKey.DISTANCE_BAND_2_MAX], multiplier: config[PricingConfigKey.DISTANCE_BAND_2_MULTIPLIER] };
    }
    return { max: config[PricingConfigKey.DISTANCE_BAND_3_MAX], multiplier: config[PricingConfigKey.DISTANCE_BAND_3_MULTIPLIER] };
  }

  private async getAllConfig(): Promise<Record<PricingConfigKey, number>> {
    const configs = await this.pricingConfigRepository.find();
    const result = { ...DEFAULT_PRICING_CONFIG } as Record<PricingConfigKey, any>;

    for (const config of configs) {
      if (config.key in result) {
        result[config.key] = Number(config.value);
      }
    }

    // Convert to plain numbers
    const finalConfig = {} as Record<PricingConfigKey, number>;
    for (const key of Object.keys(result) as PricingConfigKey[]) {
      finalConfig[key] = result[key].value;
    }

    return finalConfig;
  }

  async getConfig(key: PricingConfigKey): Promise<number> {
    const config = await this.pricingConfigRepository.findOne({ where: { key } });
    if (!config) {
      return DEFAULT_PRICING_CONFIG[key].value;
    }
    return Number(config.value);
  }

  async setConfig(key: PricingConfigKey, value: number, updatedBy: string, description?: string): Promise<PricingConfig> {
    let config = await this.pricingConfigRepository.findOne({ where: { key } });
    if (!config) {
      config = this.pricingConfigRepository.create({ key, value, description, updatedBy });
    } else {
      config.value = value;
      config.updatedBy = updatedBy;
      if (description) config.description = description;
    }
    return this.pricingConfigRepository.save(config);
  }

  async getAllConfigs(): Promise<PricingConfig[]> {
    return this.pricingConfigRepository.find({ order: { key: 'ASC' } });
  }

  async initializeDefaults(): Promise<void> {
    for (const [key, { value, description }] of Object.entries(DEFAULT_PRICING_CONFIG)) {
      const existing = await this.pricingConfigRepository.findOne({ where: { key: key as PricingConfigKey } });
      if (!existing) {
        await this.pricingConfigRepository.save(
          this.pricingConfigRepository.create({
            key: key as PricingConfigKey,
            value,
            description,
          }),
        );
      }
    }
  }
}