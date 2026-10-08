import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useData } from '../data/DataContext';

export type PaymentConfirmationState = 'verifying' | 'pending' | 'success' | 'failed' | 'timeout';

const MAX_POLLS = 3;
const POLL_INTERVAL_MS = 2000;

/**
 * Verifies a payment once, then polls the payment record while the gateway stays pending.
 * The polling timer lives here (never in a screen) and never simulates latency.
 */
export function usePaymentConfirmation(reference?: string, enabled = true): { state: PaymentConfirmationState; attempt: number } {
  const data = useData();
  const queryClient = useQueryClient();
  const [state, setState] = useState<PaymentConfirmationState>('verifying');
  const [attempt, setAttempt] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || !reference || started.current) return;
    started.current = true;
    let active = true;
    (async () => {
      try {
        const result = await data.payment.verify(reference);
        if (!active) return;
        if (result.status === 'success') {
          queryClient.invalidateQueries({ queryKey: ['deliveries'] });
          setState('success');
        } else if (result.status === 'failed') {
          setState('failed');
        } else {
          setState('pending');
        }
      } catch (error) {
        if (!active) return;
        // Offline is a failure to act on; anything else (gateway timeout) we surface as timeout.
        setState((error as Error).name === 'OfflineError' ? 'failed' : 'timeout');
      }
    })();
    return () => {
      active = false;
    };
  }, [enabled, reference, data, queryClient]);

  useEffect(() => {
    if (state !== 'pending' || !reference) return;
    if (attempt >= MAX_POLLS) {
      setState('timeout');
      return;
    }
    const id = setTimeout(async () => {
      try {
        const payment = await data.payment.getByReference(reference);
        if (payment.status === 'success') {
          queryClient.invalidateQueries({ queryKey: ['deliveries'] });
          setState('success');
          return;
        }
        if (payment.status === 'failed' || payment.status === 'cancelled') {
          setState('failed');
          return;
        }
      } catch {
        /* keep polling until the attempts run out */
      }
      setAttempt((a) => a + 1);
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [state, attempt, reference, data, queryClient]);

  return { state, attempt };
}
