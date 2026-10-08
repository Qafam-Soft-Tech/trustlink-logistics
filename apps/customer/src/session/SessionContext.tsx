import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@trustlink/shared';
import { authStorage } from '../storage/authStorage';

export interface Session {
  user: User;
  token: string;
}

interface SessionContextValue {
  session: Session | null;
  onboardingSeen: boolean;
  ready: boolean;
  sessionExpired: boolean;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  clearSessionExpired: () => void;
  /** clears token, user, onboarding flag and the query cache (Demo menu) */
  resetAll: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [onboardingSeen, setOnboardingSeen] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [ready, setReady] = useState(false);

  // Restore persisted session + onboarding flag on cold start.
  useEffect(() => {
    let active = true;
    (async () => {
      const [token, user, seen] = await Promise.all([authStorage.loadToken(), authStorage.loadUser(), authStorage.getOnboardingSeen()]);
      if (!active) return;
      setOnboardingSeen(seen);
      if (token && user) setSession({ token, user });
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // A 401 anywhere → surface the SessionExpired sheet.
  useEffect(() => {
    authStorage.setUnauthorizedHandler(() => setSessionExpired(true));
    return () => authStorage.setUnauthorizedHandler(null);
  }, []);

  const signIn = useCallback(async (next: Session) => {
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

  const completeOnboarding = useCallback(async () => {
    await authStorage.setOnboardingSeen();
    setOnboardingSeen(true);
  }, []);

  const resetAll = useCallback(async () => {
    await authStorage.clearToken();
    await authStorage.clearOnboarding();
    setSession(null);
    setOnboardingSeen(false);
    setSessionExpired(false);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<SessionContextValue>(
    () => ({ session, onboardingSeen, ready, sessionExpired, signIn, signOut, completeOnboarding, clearSessionExpired: () => setSessionExpired(false), resetAll }),
    [session, onboardingSeen, ready, sessionExpired, signIn, signOut, completeOnboarding, resetAll],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
