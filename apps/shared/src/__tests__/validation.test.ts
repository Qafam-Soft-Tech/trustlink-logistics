import { describe, it, expect } from 'vitest';
import { toCanonicalPhone, isValidNigerianPhone, isValidNin, isValidWeightKg, isValidAddress, isValidOtp, isEmail } from '../validation';

describe('phone canonicalisation', () => {
  it('keeps 11-digit local form', () => {
    expect(toCanonicalPhone('08031234567')).toBe('08031234567');
  });
  it('strips spaces', () => {
    expect(toCanonicalPhone('0803 123 4567')).toBe('08031234567');
  });
  it('converts 234 country code to local', () => {
    expect(toCanonicalPhone('+2348031234567')).toBe('08031234567');
  });
  it('adds leading 0 for 10-digit number', () => {
    expect(toCanonicalPhone('8031234567')).toBe('08031234567');
  });
  it('validates a correct Nigerian phone', () => {
    expect(isValidNigerianPhone('0803 123 4567')).toBe(true);
  });
  it('rejects a short phone', () => {
    expect(isValidNigerianPhone('0803123')).toBe(false);
  });
});

describe('validators', () => {
  it('accepts an 11-digit NIN', () => {
    expect(isValidNin('12345678901')).toBe(true);
  });
  it('rejects a non-11-digit NIN', () => {
    expect(isValidNin('12345')).toBe(false);
  });
  it('accepts weights within tier ceiling', () => {
    expect(isValidWeightKg(5)).toBe(true);
    expect(isValidWeightKg(0)).toBe(false);
    expect(isValidWeightKg(30)).toBe(false);
  });
  it('validates a complete Abuja address', () => {
    expect(isValidAddress({ street: '12 Aminu Kano Crescent', area: 'Wuse 2', city: 'Abuja', state: 'FCT' })).toBe(true);
  });
  it('rejects an incomplete address', () => {
    expect(isValidAddress({ street: '12', area: '', city: 'Abuja', state: 'FCT' })).toBe(false);
  });
  it('validates 6-digit OTPs', () => {
    expect(isValidOtp('482913')).toBe(true);
    expect(isValidOtp('12345')).toBe(false);
  });
  it('validates emails', () => {
    expect(isEmail('amina.bello@example.com')).toBe(true);
    expect(isEmail('not-an-email')).toBe(false);
  });
});
