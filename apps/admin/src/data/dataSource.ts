/**
 * Admin data source. `mock` uses the in-memory demo world; `api` uses the real backend.
 * The source is explicit: a production build must set `VITE_DATA_SOURCE` (no silent default — Phase 17B).
 *
 * "Development" is decided by **Vite's `import.meta.env.PROD`**, not `process.env.NODE_ENV`
 * (this machine exports NODE_ENV=production globally, which would break `npm run dev`).
 */
export type AdminDataSource = 'mock' | 'api';

export function readAdminDataSource(): AdminDataSource {
  const explicit = (import.meta.env.VITE_DATA_SOURCE as string | undefined)?.trim().toLowerCase();

  if (!explicit) {
    if (import.meta.env.PROD) {
      throw new Error('VITE_DATA_SOURCE is required in production builds. Set it to "mock" (or "api" once an admin API client exists).');
    }
    return 'mock';
  }

  if (explicit !== 'mock' && explicit !== 'api') {
    throw new Error(`Unknown VITE_DATA_SOURCE "${explicit}" — expected "mock" or "api".`);
  }

  return explicit as AdminDataSource;
}
