import { mockConfig } from './config';
import { ConflictError } from '../http';

export function sleep(ms: number): Promise<void> {
  if (!ms || ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface MockFlags {
  offline: boolean;
  serverError: boolean;
}

export function assertOnline(flags: MockFlags): void {
  if (flags.offline) {
    const err = new Error('You appear to be offline. Check your connection and try again.');
    err.name = 'OfflineError';
    throw err;
  }
  if (flags.serverError) {
    const err = new Error('Something went wrong on our end. Please try again.');
    err.name = 'ServerError';
    throw err;
  }
}

export function requireSession<T>(session: T | null): T {
  if (!session) {
    throw new ConflictError('Authentication required');
  }
  return session;
}
