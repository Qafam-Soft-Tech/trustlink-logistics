import { describe, it, expect } from 'vitest';
import { createMockAdapters } from '../data/mock';
import { emptyCopy, errorCopy, errorMessage, isOffline } from '../domain/errorCopy';
import { ConflictError, NotFoundError, ValidationError } from '../data/http';

describe('error copy', () => {
  it('gives offline a single consistent voice', () => {
    const offline = Object.assign(new Error('offline'), { name: 'OfflineError' });
    const copy = errorCopy(offline, 'deliveries');
    expect(copy.offline).toBe(true);
    expect(copy.title).toBe("You're offline");
    expect(copy.message).toContain('your deliveries');
    expect(isOffline(offline)).toBe(true);
    expect(isOffline(new Error('nope'))).toBe(false);
  });

  it('surfaces server-authored messages for rule failures', () => {
    expect(errorCopy(new ConflictError('Recipient code does not match')).message).toBe('Recipient code does not match');
    expect(errorCopy(new ValidationError('All document uploads are required')).title).toBe('Check your details');
    expect(errorCopy(new NotFoundError('Delivery not found')).title).toBe('Not found');
  });

  it('falls back to calm context copy for unknown errors', () => {
    const copy = errorCopy(new Error('boom'), 'payment');
    expect(copy.title).toBe('Something went wrong');
    expect(copy.message).toContain('this payment');
    expect(errorMessage('not-an-error' as unknown, 'jobs')).toContain('your jobs');
    expect(errorCopy({ name: 'ServerError' }, 'tracking').title).toBe('TrustLink is having trouble');
    expect(errorCopy({ name: 'NotSupportedByBackendError' }).title).toBe('Not available yet');
  });

  it('keeps empty states in the same voice', () => {
    expect(emptyCopy('deliveries').title).toBe('No deliveries yet');
    expect(emptyCopy('jobs').message).toContain('dispatch');
    expect(emptyCopy('generic').title).toBe('Nothing here yet');
  });
});

describe('scenario sweep', () => {
  const SCENARIOS = ['happy', 'failedOnce', 'failedTwiceReturned', 'assigningDelayed', 'paymentFails', 'paymentPending', 'emptyAccount', 'offline', 'serverError'] as const;

  it.each(SCENARIOS)('scenario "%s" leaves every screen query in a known state', async (scenario) => {
    const ports = createMockAdapters({ latencyMs: 0, scenario });
    const settled = await Promise.allSettled([
      ports.auth.requestOtp({ phone: '08031234567', purpose: 'login' }),
    ]);

    // Auth is expected to fail only in the offline/serverError scenarios.
    const authRejected = settled[0].status === 'rejected';
    const expectedRejection = scenario === 'offline' || scenario === 'serverError';
    expect(authRejected).toBe(expectedRejection);
    if (authRejected) {
      const reason = (settled[0] as PromiseRejectedResult).reason as Error;
      expect(['OfflineError', 'ServerError']).toContain(reason.name);
      // Screens render the offline banner or a calm error block, never a crash.
      expect(errorCopy(reason, 'deliveries').title).toBeTruthy();
      return;
    }

    await ports.auth.verifyOtp({ phone: '08031234567', code: '482913', purpose: 'login' });
    const results = await Promise.allSettled([
      ports.delivery.list(),
      ports.delivery.listAddresses(),
      ports.notification.list(30),
      ports.issue.listMine(),
      ports.auth.getProfile(),
      ports.rider.getProfile(),
    ]);

    for (const result of results) {
      expect(result.status).toBe('fulfilled');
    }

    const deliveries = (results[0] as PromiseFulfilledResult<unknown[]>).value;
    if (scenario === 'emptyAccount') {
      expect(deliveries.length).toBe(0);
      expect(emptyCopy('deliveries').title).toBe('No deliveries yet');
    } else {
      expect(deliveries.length).toBeGreaterThan(0);
    }
  });
});
