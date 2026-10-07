/** HTTP abstraction the api adapters depend on (injected). Pure TS. */

export interface HttpRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: unknown;
}

export interface HttpClient {
  get<T>(path: string, config?: HttpRequestConfig): Promise<T>;
  post<T>(path: string, body?: unknown, config?: HttpRequestConfig): Promise<T>;
  put<T>(path: string, body?: unknown, config?: HttpRequestConfig): Promise<T>;
  delete<T>(path: string, config?: HttpRequestConfig): Promise<T>;
}

/** Thrown by api adapters for capabilities the backend does not expose (SC-14). */
export class NotSupportedByBackendError extends Error {
  readonly method: string;
  readonly path: string;
  constructor(method: string, path: string, note?: string) {
    super(`Not supported by backend: ${method} ${path}${note ? ` (${note})` : ''}`);
    this.name = 'NotSupportedByBackendError';
    this.method = method;
    this.path = path;
  }
}

/** Domain-level error for illegal state-machine transitions / role rules (maps to 409). */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
