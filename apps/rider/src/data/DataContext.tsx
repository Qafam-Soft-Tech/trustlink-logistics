import React, { createContext, useContext, useMemo } from 'react';
import { createDataLayer, type DataLayer } from '@trustlink/shared';
import { httpClient } from './httpClient';

const DataContext = createContext<DataLayer | null>(null);

/** Provides the data layer (mock | api) sourced from EXPO_PUBLIC_DATA_SOURCE (default mock). */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const source = process.env.EXPO_PUBLIC_DATA_SOURCE;
  const layer = useMemo(() => createDataLayer({ source, httpClient }), [source]);
  return <DataContext.Provider value={layer}>{children}</DataContext.Provider>;
}

export function useData(): DataLayer {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
