/** Fare engine — mirrors FareCalculationService (naira). Pure TS. */
import type { FareBreakdown, PricingValues } from './types';

export const DEFAULT_PRICING: PricingValues = {
  base_fare: 500,
  per_km_rate: 150,
  per_kg_rate: 100,
  minimum_fare: 1000,
  weight_tier_1_max: 1,
  weight_tier_1_multiplier: 1.0,
  weight_tier_2_max: 5,
  weight_tier_2_multiplier: 1.5,
  weight_tier_3_max: 10,
  weight_tier_3_multiplier: 2.0,
  weight_tier_4_max: 25,
  weight_tier_4_multiplier: 3.0,
  distance_band_1_max: 5,
  distance_band_1_multiplier: 1.0,
  distance_band_2_max: 15,
  distance_band_2_multiplier: 1.2,
  distance_band_3_max: 50,
  distance_band_3_multiplier: 1.5,
};

export function weightTier(weightKg: number, v: PricingValues): { max: number; multiplier: number } {
  if (weightKg <= v.weight_tier_1_max) return { max: v.weight_tier_1_max, multiplier: v.weight_tier_1_multiplier };
  if (weightKg <= v.weight_tier_2_max) return { max: v.weight_tier_2_max, multiplier: v.weight_tier_2_multiplier };
  if (weightKg <= v.weight_tier_3_max) return { max: v.weight_tier_3_max, multiplier: v.weight_tier_3_multiplier };
  return { max: v.weight_tier_4_max, multiplier: v.weight_tier_4_multiplier };
}

export function distanceBand(distanceKm: number, v: PricingValues): { max: number; multiplier: number } {
  if (distanceKm <= v.distance_band_1_max) return { max: v.distance_band_1_max, multiplier: v.distance_band_1_multiplier };
  if (distanceKm <= v.distance_band_2_max) return { max: v.distance_band_2_max, multiplier: v.distance_band_2_multiplier };
  return { max: v.distance_band_3_max, multiplier: v.distance_band_3_multiplier };
}

export function calculateFare(
  v: PricingValues,
  input: { distanceKm: number; weightKg: number; packageType?: string },
): FareBreakdown {
  const wt = weightTier(input.weightKg, v);
  const db = distanceBand(input.distanceKm, v);
  const distanceCharge = input.distanceKm * v.per_km_rate * db.multiplier;
  const weightCharge = input.weightKg * v.per_kg_rate * wt.multiplier;
  const subtotal = v.base_fare + distanceCharge + weightCharge;
  const totalFare = Math.max(subtotal, v.minimum_fare);
  return {
    baseFare: v.base_fare,
    distanceCharge: round2(distanceCharge),
    weightCharge: round2(weightCharge),
    subtotal: round2(subtotal),
    minimumFare: v.minimum_fare,
    totalFare: round2(totalFare),
    weightTier: wt,
    distanceBand: db,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
