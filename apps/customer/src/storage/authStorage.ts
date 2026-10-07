import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@trustlink/shared';

const TOKEN_KEY = 'trustlink.token';
const USER_KEY = 'trustlink.user';
const ONBOARDING_KEY = 'trustlink.onboarding_seen';

let tokenCache: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

/** Auth persistence: token + user in SecureStore, onboarding flag in AsyncStorage. */
export const authStorage = {
  async loadToken(): Promise<string | null> {
    if (tokenCache !== null) return tokenCache || null;
    try {
      tokenCache = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      tokenCache = null;
    }
    return tokenCache;
  },
  currentToken(): string | null {
    return tokenCache;
  },
  async setToken(token: string): Promise<void> {
    tokenCache = token;
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  async clearToken(): Promise<void> {
    tokenCache = '';
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch {
      /* ignore */
    }
  },
  async loadUser(): Promise<User | null> {
    try {
      const raw = await SecureStore.getItemAsync(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },
  async setUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  },
  async getOnboardingSeen(): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(ONBOARDING_KEY)) === '1';
    } catch {
      return false;
    }
  },
  async setOnboardingSeen(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      /* ignore */
    }
  },
  setUnauthorizedHandler(fn: (() => void) | null): void {
    unauthorizedHandler = fn;
  },
  notifyUnauthorized(): void {
    unauthorizedHandler?.();
  },
};
