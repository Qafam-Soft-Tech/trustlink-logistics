import type { HttpClient, HttpRequestConfig } from '@trustlink/shared';
import { api } from '../utils/api';

/** Adapts the app's axios instance to the shared HttpClient port (injected into the api adapters). */
export const httpClient: HttpClient = {
  get: (path: string, config?: HttpRequestConfig) => api.get(path, config as never).then((r) => r.data),
  post: (path: string, body?: unknown, config?: HttpRequestConfig) => api.post(path, body, config as never).then((r) => r.data),
  put: (path: string, body?: unknown, config?: HttpRequestConfig) => api.put(path, body, config as never).then((r) => r.data),
  delete: (path: string, config?: HttpRequestConfig) => api.delete(path, config as never).then((r) => r.data),
};
