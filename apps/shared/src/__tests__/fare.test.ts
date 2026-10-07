import { describe, it, expect } from 'vitest';
import { calculateFare, DEFAULT_PRICING, distanceBand, weightTier } from '../domain/fare';

describe('fare engine', () => {
  it('example: 4km & 2kg → ₦1,400', () => {
    expect(calculateFare(DEFAULT_PRICING, { distanceKm: 4, weightKg: 2 }).totalFare).toBe(1400);
  });
  it('breakdown has base ₦500, distance ₦600, weight ₦300', () => {
    const b = calculateFare(DEFAULT_PRICING, { distanceKm: 4, weightKg: 2 });
    expect(b.baseFare).toBe(500);
    expect(b.distanceCharge).toBe(600);
    expect(b.weightCharge).toBe(300);
    expect(b.subtotal).toBe(1400);
  });
  it('enforces minimum fare ₦1,000', () => {
    expect(calculateFare(DEFAULT_PRICING, { distanceKm: 0.5, weightKg: 0.2 }).totalFare).toBe(1000);
  });
  it('weight tier 1 (≤1kg) multiplier 1.0', () => {
    expect(weightTier(0.5, DEFAULT_PRICING)).toMatchObject({ max: 1, multiplier: 1.0 });
  });
  it('weight tier 2 (≤5kg) multiplier 1.5', () => {
    expect(weightTier(2, DEFAULT_PRICING)).toMatchObject({ max: 5, multiplier: 1.5 });
  });
  it('weight tier 3 (≤10kg) multiplier 2.0', () => {
    expect(weightTier(10, DEFAULT_PRICING)).toMatchObject({ max: 10, multiplier: 2.0 });
  });
  it('weight tier 4 (>10kg) multiplier 3.0', () => {
    expect(weightTier(20, DEFAULT_PRICING)).toMatchObject({ max: 25, multiplier: 3.0 });
  });
  it('distance band 1 (≤5km) multiplier 1.0', () => {
    expect(distanceBand(3, DEFAULT_PRICING)).toMatchObject({ max: 5, multiplier: 1.0 });
  });
  it('distance band 2 (≤15km) multiplier 1.2', () => {
    expect(distanceBand(12, DEFAULT_PRICING)).toMatchObject({ max: 15, multiplier: 1.2 });
  });
  it('distance band 3 (>15km) multiplier 1.5', () => {
    expect(distanceBand(30, DEFAULT_PRICING)).toMatchObject({ max: 50, multiplier: 1.5 });
  });
});
