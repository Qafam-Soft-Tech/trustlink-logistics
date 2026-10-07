/** Composition root: selects mock or api adapters, driven by env (default mock). */
import type { DataPorts } from './ports';
import type { HttpClient } from './http';
import { createMockAdapters, type MockLayerOptions } from './mock';
import { createApiAdapters } from './api';

export type DataSource = 'mock' | 'api';

export interface DataLayerOptions {
  /** explicit source (e.g. admin passes import.meta.env.VITE_DATA_SOURCE) */
  source?: DataSource | string | null;
  /** required when source === 'api' */
  httpClient?: HttpClient;
  mock?: MockLayerOptions;
}

export interface DataLayer extends DataPorts {
  source: DataSource;
}

/** Anything other than the literal "api" resolves to mock. */
export function resolveDataSource(explicit?: string | null): DataSource {
  return (explicit ?? '').trim().toLowerCase() === 'api' ? 'api' : 'mock';
}

function readEnvSource(): string | undefined {
  if (typeof process !== 'undefined' && process && process.env) {
    return process.env.EXPO_PUBLIC_DATA_SOURCE;
  }
  return undefined;
}

export function createDataLayer(options: DataLayerOptions = {}): DataLayer {
  const source = resolveDataSource(options.source ?? readEnvSource());
  let ports: DataPorts;
  if (source === 'api') {
    if (!options.httpClient) {
      throw new Error('createDataLayer: httpClient is required when source is "api"');
    }
    ports = createApiAdapters(options.httpClient);
  } else {
    ports = createMockAdapters(options.mock);
  }
  return { source, ...ports };
}
