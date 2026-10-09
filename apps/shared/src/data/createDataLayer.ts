/** Composition root: selects mock or api adapters, driven by env (default mock). */
import type { DataPorts } from './ports';
import type { HttpClient } from './http';
import { createMockLayer, type DemoControls, type MockLayerOptions } from './mock';
import { createApiAdapters } from './api';

export type DataSource = 'mock' | 'api';

export interface DataLayerOptions {
  /** explicit source (e.g. admin passes import.meta.env.VITE_DATA_SOURCE) */
  source?: DataSource | string | null;
  /** required when source === 'api' */
  httpClient?: HttpClient;
  mock?: MockLayerOptions;
  /**
   * Whether the host app is in development. The mobile apps pass React Native's `__DEV__`
   * (true in Expo Go dev, false in a production build).
   *
   * Shared stays pure TS and deliberately does **not** read `process.env.NODE_ENV`: this machine
   * exports NODE_ENV=production globally, so that check would make `npx expo start` throw in Expo Go.
   * Defaults to `false` (fail-fast) when the caller omits it.
   */
  isDev?: boolean;
}

export interface DataLayer extends DataPorts {
  source: DataSource;
  /** present only for the mock source — investor demo controls */
  demo?: DemoControls;
}

/**
 * Resolve the data source. There is **no silent default in production**: a non-dev build must set
 * `EXPO_PUBLIC_DATA_SOURCE` (mobile) or `VITE_DATA_SOURCE` (admin) to `"mock"` or `"api"` — this is
 * what stops a demo build from being shipped as if it were live.
 *
 * `isDev` is supplied by the host app (mobile: React Native's `__DEV__`; the console keeps its own
 * guard using Vite's `import.meta.env.PROD`). It is never derived from `process.env.NODE_ENV`.
 */
export function resolveDataSource(explicit?: string | null, isDev = false): DataSource {
  const value = (explicit ?? '').trim().toLowerCase();
  if (!value) {
    if (!isDev) {
      throw new Error(
        'Data source is required in production builds. Set EXPO_PUBLIC_DATA_SOURCE (mobile) or VITE_DATA_SOURCE (admin) to "mock" or "api".',
      );
    }
    return 'mock';
  }
  if (value !== 'mock' && value !== 'api') {
    throw new Error(`Unknown data source "${value}" — expected "mock" or "api".`);
  }
  return value;
}

function readEnvSource(): string | undefined {
  if (typeof process !== 'undefined' && process && process.env) {
    return process.env.EXPO_PUBLIC_DATA_SOURCE;
  }
  return undefined;
}

export function createDataLayer(options: DataLayerOptions = {}): DataLayer {
  const source = resolveDataSource(options.source ?? readEnvSource(), options.isDev ?? false);
  if (source === 'api') {
    if (!options.httpClient) {
      throw new Error('createDataLayer: httpClient is required when source is "api"');
    }
    return { source, ...createApiAdapters(options.httpClient) };
  }
  const { ports, demo } = createMockLayer(options.mock);
  return { source, ...ports, demo };
}
