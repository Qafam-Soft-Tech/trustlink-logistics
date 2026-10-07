import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { createTheme, type Theme, type ThemeMode, type ResolvedMode } from './index';

/** Storage adapter injected by each app (e.g. AsyncStorage) so shared gains no dependency. */
export interface ThemeStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

const STORAGE_KEY = '@trustlink/theme-mode';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  resolvedMode: ResolvedMode;
  setMode(mode: ThemeMode): void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: createTheme('light'),
  mode: 'system',
  resolvedMode: 'light',
  setMode: () => {},
});

export function ThemeProvider({
  children,
  storage,
  initialMode = 'system',
}: {
  children: React.ReactNode;
  storage?: ThemeStorage;
  initialMode?: ThemeMode;
}) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  useEffect(() => {
    let active = true;
    storage
      ?.getItem(STORAGE_KEY)
      .then((v) => {
        if (active && (v === 'light' || v === 'dark' || v === 'system')) setModeState(v);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [storage]);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    storage?.setItem(STORAGE_KEY, next).catch(() => undefined);
  };

  const resolvedMode: ResolvedMode = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: createTheme(resolvedMode), mode, resolvedMode, setMode }),
    [resolvedMode, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export { STORAGE_KEY as THEME_STORAGE_KEY };
