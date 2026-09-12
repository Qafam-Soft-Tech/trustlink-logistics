import { Test, TestingModule } from '@nestjs/testing';
import { PricingConfig, PricingConfigKey, DEFAULT_PRICING_CONFIG } from '../src/modules/payments/entities/pricing-config.entity';
import { FareCalculationService } from '../src/modules/payments/services/fare-calculation.service';
import { MockDb, seedPricingConfigs } from './mock-db';

describe('Phase 5: Fare Calculation Engine', () => {
  let module: TestingModule;
  let db: MockDb;
  let fareCalculationService: FareCalculationService;
  let pricingRepository: any;

  beforeAll(async () => {
    db = new MockDb();
    seedPricingConfigs(db);

    pricingRepository = db.repo('PricingConfig');

    module = await Test.createTestingModule({
      providers: [
        FareCalculationService,
        db.provider(PricingConfig),
      ],
    }).compile();

    fareCalculationService = module.get<FareCalculationService>(FareCalculationService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Default Pricing Config', () => {
    it('should initialize with all default pricing configs', async () => {
      const configs = await pricingRepository.find();
      expect(configs.length).toBe(Object.keys(DEFAULT_PRICING_CONFIG).length);
    });

    it('should have correct default values', async () => {
      const baseFare = await pricingRepository.findOne({ where: { key: PricingConfigKey.BASE_FARE } });
      expect(Number(baseFare.value)).toBe(500);

      const perKm = await pricingRepository.findOne({ where: { key: PricingConfigKey.PER_KM_RATE } });
      expect(Number(perKm.value)).toBe(150);

      const perKg = await pricingRepository.findOne({ where: { key: PricingConfigKey.PER_KG_RATE } });
      expect(Number(perKg.value)).toBe(100);

      const minFare = await pricingRepository.findOne({ where: { key: PricingConfigKey.MINIMUM_FARE } });
      expect(Number(minFare.value)).toBe(1000);
    });
  });

  describe('Weight Tier Calculation', () => {
    it('should apply tier 1 multiplier for weight <= 1kg', async () => {
      const result = await fareCalculationService.calculateFare({
        distanceKm: 5,
        weightKg: 0.5,
        packageType: 'document',
      });

      expect(result.weightTier.max).toBe(1);
      expect(result.weightTier.multiplier).toBe(1.0);
      expect(result.weightCharge).toBe(0.5 * 100 * 1.0);
    });

    it('should apply tier 2 multiplier for weight 1-5kg', async () => {
      const result = await fareCalculationService.calculateFare({
        distanceKm: 5,
        weightKg: 3,
        packageType: 'parcel',
      });

      expect(result.weightTier.max).toBe(5);
      expect(result.weightTier.multiplier).toBe(1.5);
      expect(result.weightCharge).toBe(3 * 100 * 1.5);
    });

    it('should apply tier 3 multiplier for weight 5-10kg', async () => {
      const result = await fareCalculationService.calculateFare({
        distanceKm: 5,
        weightKg: 7,
        packageType: 'parcel',
      });

      expect(result.weightTier.max).toBe(10);
      expect(result.weightTier.multiplier).toBe(2.0);
    });

    it('should apply tier 4 multiplier for weight 10-25kg', async () => {
      const result = await fareCalculationService.calculateFare({
        distanceKm: 5,
        weightKg: 15,
        packageType: 'parcel',
      });

      expect(result.weightTier.max).toBe(25);
      expect(result.weightTier.multiplier).toBe(3.0);
    });

    it('should apply tier 4 multiplier for weight > 25kg', async () => {
      const result = await fareCalculationService.calculateFare({
        distanceKm: 5,
        weightKg: 30,
        packageType: 'parcel',
      });

      expect(result.weightTier.max).toBe(25);
      expect(result.weightTier.multiplier).toBe(3.0);
    });
  });

  describe('Distance Band Calculation', () => {
    it('should apply band 1 for distance <= 5km', async () => {
      const result = await fareCalculationService.calculateFare({
        distanceKm: 3,
        weightKg: 1,
        packageType: 'document',
      });

      expect(result.distanceBand.max).toBe(5);
      expect(result.distanceBand.multiplier).toBe(1.0);
      expect(result.distanceCharge).toBe(3 * 150 * 1.0);
    });

    it('should apply band 2 for distance 5-15km', async () => {
      const result = await fareCalculationService.calculateFare({
        distanceKm: 10,
        weightKg: 1,
        packageType: 'document',
      });

      expect(result.distanceBand.max).toBe(15);
      expect(result.distanceBand.multiplier).toBe(1.2);
    });

    it('should apply band 3 for distance > 15km', async () => {
      const result = await fareCalculationService.calculateFare({
        distanceKm: 20,
        weightKg: 1,
        packageType: 'document',
      });

      expect(result.distanceBand.max).toBe(50);
      expect(result.distanceBand.multiplier).toBe(1.5);
    });
  });

  describe('Total Fare Calculation', () => {
    it('should calculate fare correctly: base + distance + weight', async () => {
      const result = await fareCalculationService.calculateFare({
        distanceKm: 10,
        weightKg: 2,
        packageType: 'parcel',
      });

      expect(result.baseFare).toBe(500);
      expect(result.distanceCharge).toBe(1800);
      expect(result.weightCharge).toBe(300);
      expect(result.subtotal).toBe(2600);
      expect(result.totalFare).toBe(2600);
    });

    it('should enforce minimum fare', async () => {
      const result = await fareCalculationService.calculateFare({
        distanceKm: 0.5,
        weightKg: 0.1,
        packageType: 'document',
      });

      expect(result.totalFare).toBeGreaterThanOrEqual(1000);
      expect(result.totalFare).toBe(1000);
    });
  });

  describe('Dynamic Config Updates', () => {
    it('should use updated pricing config without restart', async () => {
      // Update per km rate
      await pricingRepository.update(
        { key: PricingConfigKey.PER_KM_RATE },
        { value: 200, updatedBy: 'test-admin' },
      );

      const result = await fareCalculationService.calculateFare({
        distanceKm: 10,
        weightKg: 1,
        packageType: 'document',
      });

      expect(result.distanceCharge).toBe(2400);
      expect(result.totalFare).toBe(500 + 2400 + 100);
    });
  });
});