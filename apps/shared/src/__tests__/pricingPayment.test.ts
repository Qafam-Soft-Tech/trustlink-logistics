import { describe, it, expect } from 'vitest';
import { createMockAdapters } from '../data/mock';
import { DEMO_OTP, QUOTE_TTL_SECONDS } from '../domain/constants';
import { estimateDistanceKm, estimateEtaMinutes, isServiceArea } from '../domain/serviceArea';
import { calculateFare, DEFAULT_PRICING } from '../domain/fare';
import { toCreateDeliveryInput, initialDraft, emptyAddress, type NewDeliveryDraft } from '../domain/newDelivery';

const CUSTOMER_PHONE = '08031234567';

async function loginCustomer(ports: ReturnType<typeof createMockAdapters>) {
  await ports.auth.requestOtp({ phone: CUSTOMER_PHONE, purpose: 'login' });
  return ports.auth.verifyOtp({ phone: CUSTOMER_PHONE, code: DEMO_OTP, purpose: 'login' });
}

function draft(): NewDeliveryDraft {
  const d = initialDraft();
  d.pickup = { ...emptyAddress('Home'), street: '12 Aminu Kano Crescent', area: 'Wuse 2', landmark: 'Near Sahad Stores' };
  d.dropoff = { ...emptyAddress('Office'), street: 'Plot 447 Constitution Avenue', area: 'CBD' };
  d.recipient = { name: 'Chinedu Obi', phone: '08060000001' };
  d.sender = { name: 'Amina Bello', phone: CUSTOMER_PHONE };
  d.packageType = 'parcel';
  d.packageWeight = 5;
  d.packageDescription = 'Personal effects';
  return d;
}

describe('fare quote', () => {
  it('uses the real formula: 4 km & 2 kg → ₦1,400 (CONTRACT_SNAPSHOT §8)', () => {
    const fare = calculateFare(DEFAULT_PRICING, { distanceKm: 4, weightKg: 2, packageType: 'parcel' });
    expect(fare.totalFare).toBe(1400);
    expect(fare.baseFare).toBe(500);
    expect(fare.minimumFare).toBe(1000);
  });

  it('estimates distance from launch-area coordinates and ETA text', () => {
    expect(estimateDistanceKm('Wuse 2', 'Wuse 2')).toBe(2.5);
    expect(estimateDistanceKm('Wuse 2', 'CBD')).toBeGreaterThan(0);
    expect(estimateDistanceKm('Kano', 'CBD')).toBe(5); // out of area → fallback
    expect(isServiceArea('CBD')).toBe(true);
    expect(isServiceArea('Kano')).toBe(false);
    expect(estimateEtaMinutes(4)).toBe(16);
    expect(estimateEtaMinutes(1)).toBe(15); // floor
  });

  it('exposes the quote TTL for the Fare screen', () => {
    expect(QUOTE_TTL_SECONDS).toBe(300);
  });

  it('quotes over the ports (estimateDistance → calculate)', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await loginCustomer(ports);
    const d = draft();
    const distanceKm = await ports.pricing.estimateDistance({ pickupArea: d.pickup.area, dropoffArea: d.dropoff.area });
    const fare = await ports.pricing.calculate({ distanceKm, weightKg: d.packageWeight, packageType: d.packageType });
    expect(distanceKm).toBeGreaterThan(0);
    expect(fare.totalFare).toBeGreaterThanOrEqual(fare.minimumFare);
  });
});

describe('payment lifecycle', () => {
  it('success: create → initialize → verify flips the delivery REQUESTED → SEARCHING', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await loginCustomer(ports);
    const delivery = await ports.delivery.create(toCreateDeliveryInput(draft()));
    expect(delivery.status).toBe('requested');

    const init = await ports.payment.initialize({ deliveryId: delivery.id, amountNaira: delivery.fare ?? 0, provider: 'paystack' });
    expect(init.status).toBe('processing');
    expect(init.reference).toBeTruthy();

    const verified = await ports.payment.verify(init.reference);
    expect(verified.status).toBe('success');

    const after = await ports.delivery.get(delivery.id);
    expect(after.status).toBe('searching');
    expect(after.paymentReference).toBe(init.reference);
    expect((await ports.payment.getByReference(init.reference)).status).toBe('success');
  });

  it('decline: verify fails, the delivery stays REQUESTED (never chargeable/searching)', async () => {
    const ports = createMockAdapters({ latencyMs: 0, scenario: 'paymentFails' });
    await loginCustomer(ports);
    const delivery = await ports.delivery.create(toCreateDeliveryInput(draft()));
    const init = await ports.payment.initialize({ deliveryId: delivery.id, amountNaira: delivery.fare ?? 0, provider: 'flutterwave' });

    const verified = await ports.payment.verify(init.reference);
    expect(verified.status).toBe('failed');

    const after = await ports.delivery.get(delivery.id);
    expect(after.status).toBe('requested');
    expect(after.paymentReference).toBeNull();
    expect((await ports.payment.getByReference(init.reference)).status).toBe('failed');
  });

  it('no double-pay: a second initialize after success is rejected', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await loginCustomer(ports);
    const delivery = await ports.delivery.create(toCreateDeliveryInput(draft()));
    const init = await ports.payment.initialize({ deliveryId: delivery.id, amountNaira: delivery.fare ?? 0, provider: 'paystack' });
    await ports.payment.verify(init.reference);

    // delivery is now SEARCHING → initialize refuses
    await expect(ports.payment.initialize({ deliveryId: delivery.id, amountNaira: delivery.fare ?? 0, provider: 'paystack' })).rejects.toMatchObject({ name: 'ConflictError' });
  });

  it('retry after a failed payment is allowed (delivery is still REQUESTED)', async () => {
    const ports = createMockAdapters({ latencyMs: 0, scenario: 'paymentFails' });
    await loginCustomer(ports);
    const delivery = await ports.delivery.create(toCreateDeliveryInput(draft()));
    const first = await ports.payment.initialize({ deliveryId: delivery.id, amountNaira: delivery.fare ?? 0, provider: 'paystack' });
    await ports.payment.verify(first.reference);

    const second = await ports.payment.initialize({ deliveryId: delivery.id, amountNaira: delivery.fare ?? 0, provider: 'paystack' });
    expect(second.reference).not.toBe(first.reference);
  });

  it('timeout: the gateway stays pending → delivery remains REQUESTED', async () => {
    const ports = createMockAdapters({ latencyMs: 0, scenario: 'paymentPending' });
    await loginCustomer(ports);
    const delivery = await ports.delivery.create(toCreateDeliveryInput(draft()));
    const init = await ports.payment.initialize({ deliveryId: delivery.id, amountNaira: delivery.fare ?? 0, provider: 'paystack' });

    const verified = await ports.payment.verify(init.reference);
    expect(verified.status).toBe('pending');
    expect((await ports.delivery.get(delivery.id)).status).toBe('requested');
    expect((await ports.payment.getByReference(init.reference)).status).toBe('processing');
  });

  it('initialize refuses a non-REQUESTED delivery', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await loginCustomer(ports);
    const list = await ports.delivery.list('searching');
    await expect(ports.payment.initialize({ deliveryId: list[0].id, amountNaira: 1000, provider: 'paystack' })).rejects.toMatchObject({ name: 'ConflictError' });
  });
});
