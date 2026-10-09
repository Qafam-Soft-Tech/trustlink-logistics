import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@trustlink/shared';
import { authStorage } from '../storage/authStorage';
import { useData } from '../data/DataContext';

export interface RiderSession {
  user: User;
  token: string;
}

interface SessionContextValue {
  session: RiderSession | null;
  ready: boolean;
  sessionExpired: boolean;
  signIn: (session: RiderSession) => Promise<void>;
  signOut: () => Promise<void>;
  clearSessionExpired: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const data = useData();
  const [session, setSession] = useState<RiderSession | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [ready, setReady] = useState(false);

  // Restore a persisted rider session on cold start.
  useEffect(() => {
    let active = true;
    (async () => {
      const [token, user] = await Promise.all([authStorage.loadToken(), authStorage.loadUser()]);
      if (!active) return;
      if (token && user) {
        // Re-establish the in-memory mock session so authenticated ports work after a reload.
        await data.auth.hydrate(user).catch(() => undefined);
        if (!active) return;
        setSession({ token, user });
      }
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [data]);

  useEffect(() => {
    authStorage.setUnauthorizedHandler(() => setSessionExpired(true));
    return () => authStorage.setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback(async (next: RiderSession) => {
    await authStorage.setToken(next.token);
    await authStorage.setUser(next.user);
    setSession(next);
    setSessionExpired(false);
  }, []);

  const signOut = useCallback(async () => {
    await authStorage.clearToken();
    setSession(null);
    setSessionExpired(false);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<SessionContextValue>(
    () => ({ session, ready, sessionExpired, signIn, signOut, clearSessionExpired: () => setSessionExpired(false) }),
    [session, ready, sessionExpired, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
