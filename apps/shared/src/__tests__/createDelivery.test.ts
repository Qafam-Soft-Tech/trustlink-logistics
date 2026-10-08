import { describe, it, expect } from 'vitest';
import { createMockAdapters } from '../data/mock';
import { DEMO_OTP } from '../domain/constants';
import { toCreateDeliveryInput, initialDraft, emptyAddress } from '../domain/newDelivery';
import type { NewDeliveryDraft } from '../domain/newDelivery';

const CUSTOMER_PHONE = '08031234567';

async function loginCustomer(ports: ReturnType<typeof createMockAdapters>) {
  await ports.auth.requestOtp({ phone: CUSTOMER_PHONE, purpose: 'login' });
  return ports.auth.verifyOtp({ phone: CUSTOMER_PHONE, code: DEMO_OTP, purpose: 'login' });
}

function draft(packageType: 'document' | 'parcel', weight: 1 | 5, description: string): NewDeliveryDraft {
  const d = initialDraft();
  d.pickup = { ...emptyAddress('Home'), street: '12 Aminu Kano Crescent', area: 'Wuse 2', landmark: 'Near Sahad Stores' };
  d.dropoff = { ...emptyAddress('Office'), street: 'Plot 447 Constitution Avenue', area: 'CBD' };
  d.recipient = { name: 'Chinedu Obi', phone: '08060000001' };
  d.sender = { name: 'Amina Bello', phone: CUSTOMER_PHONE };
  d.packageType = packageType;
  d.packageWeight = weight;
  d.packageDescription = description;
  return d;
}

describe('create-delivery: the assembled payload is accepted by the mock', () => {
  it('creates a Document request (≤1 kg) and a Parcel request (≤5 kg)', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await loginCustomer(ports);

    const doc = await ports.delivery.create(toCreateDeliveryInput(draft('document', 1, 'Signed contracts')));
    const parcel = await ports.delivery.create(toCreateDeliveryInput(draft('parcel', 5, 'Personal effects')));

    expect(doc.packageType).toBe('document');
    expect(doc.packageWeight).toBe(1);
    expect(doc.status).toBe('requested');
    expect(doc.trackingNumber).toMatch(/^TLK-2026-\d{3}$/);

    expect(parcel.packageType).toBe('parcel');
    expect(parcel.packageWeight).toBe(5);
    expect(parcel.fare).toBeGreaterThan(0);

    const list = await ports.delivery.list();
    expect(list.some((d) => d.id === doc.id)).toBe(true);
    expect(list.some((d) => d.id === parcel.id)).toBe(true);
  });

  it('rejects a recipient phone equal to the sender phone', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await loginCustomer(ports);
    const d = draft('parcel', 5, 'Personal effects');
    d.recipient.phone = CUSTOMER_PHONE;
    await expect(ports.delivery.create(toCreateDeliveryInput(d))).rejects.toMatchObject({ name: 'ValidationError' });
  });
});
