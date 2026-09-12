import { DataSource, Repository } from 'typeorm';
import { PricingConfig, PricingConfigKey, DEFAULT_PRICING_CONFIG } from '../src/modules/payments/entities/pricing-config.entity';
import { FareCalculationService } from '../src/modules/payments/services/fare-calculation.service';
import { Delivery, DeliveryStatus, PackageType } from '../src/modules/deliveries/entities/delivery.entity';
import { TestFactory, setupTestModule, teardownTestModule, seedTestData } from './setup';
import * as crypto from 'crypto';

describe('Phase 5: Fare Calculation Engine', () => {
  let dataSource: any;
  let fareCalculationService: FareCalculationService;
  let pricingRepository: any;

  beforeAll(async () => {
    dataSource = await TestFactory.setupTestModule();
    await TestFactory.seedTestData(dataSource);

    pricingRepository = dataSource.getRepository('PricingConfig');

    // Instantiate service directly with repository
    const { FareCalculationService } = require('../src/modules/payments/services/fare-calculation.service');
    fareCalculationService = new FareCalculationService(dataSource.getRepository('PricingConfig'));
  });

  afterAll(async () => {
    await teardownTestModule(dataSource);
  });

  describe('Default Pricing Config', () => {
    it('should initialize with all default pricing configs', async () => {
      const configs = await dataSource.getRepository('PricingConfig').find();
      expect(configs.length).toBe(Object.keys(DEFAULT_PRICING_CONFIG).length);
    });

    it('should have correct default values', async () => {
      const baseFare = await dataSource.getRepository('PricingConfig').findOne({ where: { key: PricingConfigKey.BASE_FARE } });
      expect(Number(baseFare.value)).toBe(500);

      const perKm = await dataSource.getRepository('PricingConfig').findOne({ where: { key: PricingConfigKey.PER_KM_RATE } });
      expect(Number(perKm.value)).toBe(150);

      const perKg = await dataSource.getRepository('PricingConfig').findOne({ where: { key: PricingConfigKey.PER_KG_RATE } });
      expect(Number(perKg.value)).toBe(100);

      const minFare = await dataSource.getRepository('PricingConfig').findOne({ where: { key: PricingConfigKey.MINIMUM_FARE } });
      expect(Number(minFare.value)).toBe(1000);
    });
  });

  describe('Weight Tier Calculation', () => {
    let fareCalculationService: any;

    beforeAll(async () => {
      const { FareCalculationService } = require('../src/modules/payments/services/fare-calculation.service');
      const pricingRepo = global.__TEST_DATA_SOURCE__.getRepository('PricingConfig');
      fareCalculationService = new FareCalculationService(pricingRepo);
    });

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
    let fareCalculationService: any;

    beforeAll(async () => {
      const { FareCalculationService } = require('../src/modules/payments/services/fare-calculation.service');
      const pricingRepo = global.__TEST_DATA_SOURCE__.getRepository('PricingConfig');
      fareCalculationService = new FareCalculationService(pricingRepo);
    });

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
    let fareCalculationService: any;

    beforeAll(async () => {
      const { FareCalculationService } = require('../src/modules/payments/services/fare-calculation.service');
      const pricingRepo = global.__TEST_DATA_SOURCE__.getRepository('PricingConfig');
      fareCalculationService = new FareCalculationService(pricingRepo);
    });

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
    let fareCalculationService: any;

    beforeAll(async () => {
      const { FareCalculationService } = require('../src/modules/payments/services/fare-calculation.service');
      const pricingRepo = global.__TEST_DATA_SOURCE__.getRepository('PricingConfig');
      fareCalculationService = new FareCalculationService(pricingRepo);
    });

    it('should use updated pricing config without restart', async () => {
      // Update per km rate
      await global.__TEST_DATA_SOURCE__.getRepository('PricingConfig').update(
        { key: 'per_km_rate' },
        { value: 200, updatedBy: 'test-admin' }
      );

      const result = await fareCalculationService.calculateFare({
        distanceKm: 10,
        weightKg: 1,
        packageType: 'document',
      });

      expect(result.distanceCharge).toBe(2000);
      expect(result.totalFare).toBe(500 + 2000 + 100);
    });
  });
});