import { describe, it, expect } from 'vitest';
import { formatNaira, formatDate, formatDateTime, formatPhone } from '../formatters';

describe('formatters', () => {
  it('formats naira with thousands separators', () => {
    expect(formatNaira(1400)).toBe('\u20A61,400');
  });
  it('formats large naira', () => {
    expect(formatNaira(125000)).toBe('\u20A6125,000');
  });
  it('rounds naira to whole numbers (no kobo)', () => {
    expect(formatNaira(1400.5)).toBe('\u20A61,401');
  });
  it('handles zero', () => {
    expect(formatNaira(0)).toBe('\u20A60');
  });
  it('formats date as d Mon yyyy', () => {
    expect(formatDate('2026-10-07T09:00:00.000Z')).toMatch(/2026/);
  });
  it('returns empty string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('');
  });
  it('formats date-time with HH:MM', () => {
    expect(formatDateTime('2026-10-07T09:05:00.000Z')).toMatch(/\d{2}:\d{2}/);
  });
  it('formats canonical phone for display', () => {
    expect(formatPhone('08031234567')).toBe('0803 123 4567');
  });
});
