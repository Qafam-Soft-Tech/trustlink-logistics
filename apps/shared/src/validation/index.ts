/** Validators + phone canonicalisation. Pure TS. */

/**
 * Canonical phone form = what the auth screens send today (BASELINE.md §2a):
 * 11 digits, Nigerian local format, leading 0, no spaces / country code.
 */
export function toCanonicalPhone(input: string): string {
  const digits = (input || '').replace(/\D/g, '');
  if (digits.startsWith('234') && digits.length === 13) {
    return '0' + digits.slice(3);
  }
  if (digits.length === 10 && !digits.startsWith('0')) {
    return '0' + digits;
  }
  return digits;
}

export function isValidNigerianPhone(input: string): boolean {
  const canonical = toCanonicalPhone(input);
  return /^0\d{10}$/.test(canonical);
}

export function isValidNin(nin: string): boolean {
  return /^\d{11}$/.test((nin || '').trim());
}

export function isValidWeightKg(weight: number): boolean {
  return typeof weight === 'number' && Number.isFinite(weight) && weight > 0 && weight <= 25;
}

export interface AddressInput {
  street?: string;
  area?: string;
  city?: string;
  state?: string;
}

export function isValidAddress(addr: AddressInput): boolean {
  return Boolean(
    addr.street && addr.street.trim().length >= 3 &&
    addr.area && addr.area.trim().length >= 2 &&
    addr.city && addr.city.trim().length >= 2 &&
    addr.state && addr.state.trim().length >= 2,
  );
}

export function isValidOtp(code: string): boolean {
  return /^\d{6}$/.test((code || '').trim());
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim());
}
