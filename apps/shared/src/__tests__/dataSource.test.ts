import { describe, it, expect } from 'vitest';
import { resolveDataSource } from '../data/createDataLayer';

/**
 * The data source must never silently default. "Development" is passed in by the host app
 * (React Native's `__DEV__` for mobile; the console uses Vite's `import.meta.env.PROD`) —
 * `process.env.NODE_ENV` is deliberately not consulted, because this machine exports it as
 * "production" globally and that would break `npx expo start` in Expo Go.
 */
describe('resolveDataSource — no silent default', () => {
  it('(1) unset + development → mock', () => {
    expect(resolveDataSource(undefined, true)).toBe('mock');
    expect(resolveDataSource('', true)).toBe('mock');
    expect(resolveDataSource('   ', true)).toBe('mock');
  });

  it('(2) unset + non-development → throws', () => {
    expect(() => resolveDataSource(undefined, false)).toThrow(/data source is required/i);
    // Omitting isDev is the fail-fast default (non-development).
    expect(() => resolveDataSource(undefined)).toThrow(/data source is required/i);
    expect(() => resolveDataSource('   ')).toThrow(/data source is required/i);
  });

  it('(3) unknown value → throws (in any mode)', () => {
    expect(() => resolveDataSource('production', true)).toThrow(/unknown data source/i);
    expect(() => resolveDataSource('local', false)).toThrow(/unknown data source/i);
  });

  it('accepts exactly "mock" and "api", case-insensitively and trimmed', () => {
    expect(resolveDataSource('MOCK', false)).toBe('mock');
    expect(resolveDataSource('Api', false)).toBe('api');
    expect(resolveDataSource('api ', false)).toBe('api');
    expect(resolveDataSource(' mock ', true)).toBe('mock');
  });
});
