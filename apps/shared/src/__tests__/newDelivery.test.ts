import { describe, it, expect } from 'vitest';
import {
  DEFAULT_WEIGHT,
  WEIGHT_OPTIONS,
  draftReducer,
  emptyAddress,
  initialDraft,
  isDraftDirty,
  isServiceableArea,
  toCreateDeliveryInput,
  validateStep,
  type NewDeliveryDraft,
} from '../domain/newDelivery';

/** The exact CreateDeliveryDto field set (CONTRACT_SNAPSHOT.md §2). */
const DTO_KEYS = [
  'pickupStreet',
  'pickupLandmark',
  'pickupArea',
  'dropoffStreet',
  'dropoffLandmark',
  'dropoffArea',
  'packageType',
  'packageWeight',
  'packageDescription',
  'senderName',
  'senderPhone',
  'recipientName',
  'recipientPhone',
].sort();

function validDraft(): NewDeliveryDraft {
  const draft = initialDraft();
  draft.pickup = { ...emptyAddress('Home'), street: '12 Aminu Kano Crescent', area: 'Wuse 2', landmark: 'Near Sahad Stores' };
  draft.dropoff = { ...emptyAddress('Office'), street: 'Plot 447 Constitution Avenue', area: 'CBD' };
  draft.recipient = { name: 'Chinedu Obi', phone: '08060000001' };
  draft.sender = { name: 'Amina Bello', phone: '08031234567' };
  draft.packageType = 'parcel';
  draft.packageWeight = 5;
  draft.packageDescription = 'Personal effects';
  return draft;
}

describe('new-delivery draft model', () => {
  it('starts empty with parcel defaults', () => {
    const d = initialDraft();
    expect(d.packageType).toBe('parcel');
    expect(d.packageWeight).toBe(DEFAULT_WEIGHT.parcel);
    expect(isDraftDirty(d)).toBe(false);
  });

  it('resets the weight to the tier default when the package type changes', () => {
    let d = initialDraft();
    d = draftReducer(d, { type: 'setPackageType', value: 'document' });
    expect(d.packageWeight).toBe(DEFAULT_WEIGHT.document); // ≤1 kg
    d = draftReducer(d, { type: 'setPackageType', value: 'parcel' });
    expect(d.packageWeight).toBe(DEFAULT_WEIGHT.parcel); // ≤5 kg
  });

  it('sends the chip upper bound (1/5/10/25 kg)', () => {
    expect([...WEIGHT_OPTIONS]).toEqual([1, 5, 10, 25]);
  });

  it('assembles exactly the CreateDeliveryDto fields (no extras, no lat/lng)', () => {
    const input = toCreateDeliveryInput(validDraft());
    expect(Object.keys(input).sort()).toEqual(DTO_KEYS);
    expect('pickupLatitude' in input).toBe(false);
    expect(input.packageWeight).toBe(5);
    expect(input.packageType).toBe('parcel');
  });

  it('trims values, canonicalises phones and omits empty optional fields', () => {
    const d = validDraft();
    d.pickup.street = '  12 Aminu Kano Crescent  ';
    d.pickup.landmark = '   ';
    d.recipient.phone = '+234 806 000 0001';
    d.packageDescription = '   ';
    const input = toCreateDeliveryInput(d);
    expect(input.pickupStreet).toBe('12 Aminu Kano Crescent');
    expect(input.pickupLandmark).toBeUndefined();
    expect(input.packageDescription).toBeUndefined();
    expect(input.recipientPhone).toBe('08060000001');
    expect(input.senderPhone).toBe('08031234567');
  });

  it('flags areas outside the launch zone as unserviceable', () => {
    expect(isServiceableArea('Wuse 2')).toBe(true);
    expect(isServiceableArea('Kano')).toBe(false);
    expect(isServiceableArea('')).toBe(false);
    expect(isServiceableArea(undefined)).toBe(false);
  });

  it('validates the pickup step (street + serviceable area)', () => {
    const d = validDraft();
    expect(validateStep('Pickup', d)).toEqual({});
    d.pickup = { ...emptyAddress('Home'), street: '' };
    expect(validateStep('Pickup', d).pickup).toMatch(/street/i);
    d.pickup = { ...emptyAddress('Home'), street: '12 Zoo Road', area: 'Kano' };
    expect(validateStep('Pickup', d).pickup).toMatch(/don't deliver/i);
  });

  it('validates the drop-off step (address, recipient name/phone, recipient ≠ sender)', () => {
    const d = validDraft();
    expect(validateStep('Drop-off', d)).toEqual({});
    d.recipient.name = '';
    expect(validateStep('Drop-off', d).recipientName).toBeTruthy();
    d.recipient.name = 'Chinedu Obi';
    d.recipient.phone = '123';
    expect(validateStep('Drop-off', d).recipientPhone).toMatch(/valid/i);
    d.recipient.phone = '08031234567'; // same as sender
    expect(validateStep('Drop-off', d).recipientPhone).toMatch(/different/i);
  });

  it('validates the sender step', () => {
    const d = validDraft();
    d.sender = { name: '', phone: '' };
    const errors = validateStep('Sender', d);
    expect(errors.senderName).toBeTruthy();
    expect(errors.senderPhone).toBeTruthy();
  });

  it('only treats user-entered data as dirty (sender prefill is not dirty)', () => {
    const d = initialDraft();
    d.sender = { name: 'Amina Bello', phone: '08031234567' };
    expect(isDraftDirty(d)).toBe(false);
    d.pickup.street = '12 Aminu Kano Crescent';
    expect(isDraftDirty(d)).toBe(true);
  });

  it('resets everything back to the initial draft', () => {
    const dirty = validDraft();
    const reset = draftReducer(dirty, { type: 'reset' });
    expect(reset).toEqual(initialDraft());
  });
});
