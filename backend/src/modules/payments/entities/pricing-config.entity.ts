import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum PricingConfigKey {
  BASE_FARE = 'base_fare',
  PER_KM_RATE = 'per_km_rate',
  PER_KG_RATE = 'per_kg_rate',
  MINIMUM_FARE = 'minimum_fare',
  WEIGHT_TIER_1_MAX = 'weight_tier_1_max',
  WEIGHT_TIER_1_MULTIPLIER = 'weight_tier_1_multiplier',
  WEIGHT_TIER_2_MAX = 'weight_tier_2_max',
  WEIGHT_TIER_2_MULTIPLIER = 'weight_tier_2_multiplier',
  WEIGHT_TIER_3_MAX = 'weight_tier_3_max',
  WEIGHT_TIER_3_MULTIPLIER = 'weight_tier_3_multiplier',
  WEIGHT_TIER_4_MAX = 'weight_tier_4_max',
  WEIGHT_TIER_4_MULTIPLIER = 'weight_tier_4_multiplier',
  DISTANCE_BAND_1_MAX = 'distance_band_1_max',
  DISTANCE_BAND_1_MULTIPLIER = 'distance_band_1_multiplier',
  DISTANCE_BAND_2_MAX = 'distance_band_2_max',
  DISTANCE_BAND_2_MULTIPLIER = 'distance_band_2_multiplier',
  DISTANCE_BAND_3_MAX = 'distance_band_3_max',
  DISTANCE_BAND_3_MULTIPLIER = 'distance_band_3_multiplier',
}

@Entity('pricing_config')
@Index(['key'], { unique: true })
export class PricingConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: PricingConfigKey;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value!: number;

  @Column({ nullable: true })
  description!: string;

  @Column({ nullable: true })
  updatedBy!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export const DEFAULT_PRICING_CONFIG: Record<PricingConfigKey, { value: number; description: string }> = {
  [PricingConfigKey.BASE_FARE]: { value: 500, description: 'Base fare in NGN' },
  [PricingConfigKey.PER_KM_RATE]: { value: 150, description: 'Rate per kilometer in NGN' },
  [PricingConfigKey.PER_KG_RATE]: { value: 100, description: 'Rate per kilogram in NGN' },
  [PricingConfigKey.MINIMUM_FARE]: { value: 1000, description: 'Minimum fare in NGN' },
  [PricingConfigKey.WEIGHT_TIER_1_MAX]: { value: 1, description: 'Weight tier 1 max (kg)' },
  [PricingConfigKey.WEIGHT_TIER_1_MULTIPLIER]: { value: 1.0, description: 'Weight tier 1 multiplier' },
  [PricingConfigKey.WEIGHT_TIER_2_MAX]: { value: 5, description: 'Weight tier 2 max (kg)' },
  [PricingConfigKey.WEIGHT_TIER_2_MULTIPLIER]: { value: 1.5, description: 'Weight tier 2 multiplier' },
  [PricingConfigKey.WEIGHT_TIER_3_MAX]: { value: 10, description: 'Weight tier 3 max (kg)' },
  [PricingConfigKey.WEIGHT_TIER_3_MULTIPLIER]: { value: 2.0, description: 'Weight tier 3 multiplier' },
  [PricingConfigKey.WEIGHT_TIER_4_MAX]: { value: 25, description: 'Weight tier 4 max (kg)' },
  [PricingConfigKey.WEIGHT_TIER_4_MULTIPLIER]: { value: 3.0, description: 'Weight tier 4 multiplier' },
  [PricingConfigKey.DISTANCE_BAND_1_MAX]: { value: 5, description: 'Distance band 1 max (km)' },
  [PricingConfigKey.DISTANCE_BAND_1_MULTIPLIER]: { value: 1.0, description: 'Distance band 1 multiplier' },
  [PricingConfigKey.DISTANCE_BAND_2_MAX]: { value: 15, description: 'Distance band 2 max (km)' },
  [PricingConfigKey.DISTANCE_BAND_2_MULTIPLIER]: { value: 1.2, description: 'Distance band 2 multiplier' },
  [PricingConfigKey.DISTANCE_BAND_3_MAX]: { value: 50, description: 'Distance band 3 max (km)' },
  [PricingConfigKey.DISTANCE_BAND_3_MULTIPLIER]: { value: 1.5, description: 'Distance band 3 multiplier' },
};