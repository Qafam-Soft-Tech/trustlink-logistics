import axios from 'axios';
import { authStorage } from '../storage/authStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Attach the Bearer token to every request. */
api.interceptors.request.use(async (config) => {
  const token = authStorage.currentToken() ?? (await authStorage.loadToken());
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      authStorage.notifyUnauthorized();
    }
    return Promise.reject(error);
  },
);
