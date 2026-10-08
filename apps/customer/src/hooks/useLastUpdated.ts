import { useEffect, useState } from 'react';

/** Seconds since a timestamp, ticking once a second. The clock lives here, never in a screen. */
export function useLastUpdated(timestamp?: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!timestamp) return 0;
  return Math.max(0, Math.floor((now - timestamp) / 1000));
}
