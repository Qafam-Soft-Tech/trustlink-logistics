import { useEffect, useState } from 'react';

/** OTP resend/expiry countdown. The timer lives here, never in a screen. */
export function useCountdown(seconds: number, active: boolean, resetKey = 0): number {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (!active) {
      setRemaining(seconds);
      return;
    }
    setRemaining(seconds);
    const id = setInterval(() => setRemaining((r) => (r <= 1 ? 0 : r - 1)), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, active, resetKey]);
  return remaining;
}
