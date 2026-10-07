import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@trustlink/shared';
import { useData } from '../data/DataContext';

export interface Session {
  user: User;
  token: string;
}

interface SessionContextValue {
  session: Session | null;
  onboardingSeen: boolean;
  ready: boolean;
  signIn: (session: Session) => void;
  signOut: () => void;
  completeOnboarding: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/**
 * Temporary session for the shell. In mock mode it seeds a demo session so the
 * navigation tree is reachable without OTP; Phase 4 replaces this with the real
 * auth/session flow (secure-store token).
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const data = useData();
  const [session, setSession] = useState<Session | null>(null);
  const [onboardingSeen, setOnboardingSeen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    if (data.source === 'mock') {
      data.auth
        .verifyOtp({ phone: '08031234567', code: '482913', purpose: 'login' })
        .then((r) => {
          if (active) setSession({ user: r.user, token: r.token });
        })
        .catch(() => undefined)
        .finally(() => {
          if (active) setReady(true);
        });
    } else {
      setReady(true);
    }
    return () => {
      active = false;
    };
  }, [data]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      onboardingSeen,
      ready,
      signIn: setSession,
      signOut: () => setSession(null),
      completeOnboarding: () => setOnboardingSeen(true),
    }),
    [session, onboardingSeen, ready],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
