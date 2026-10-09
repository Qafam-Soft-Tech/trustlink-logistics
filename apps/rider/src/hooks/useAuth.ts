import { useMutation } from '@tanstack/react-query';
import { useData } from '../data/DataContext';

/** Rider auth mutations — the flow is shared with the customer app, with rider copy and role. */

export function useRequestOtp() {
  const data = useData();
  return useMutation({
    mutationFn: (input: { phone: string; purpose: 'signup' | 'login' }) => data.auth.requestOtp({ ...input, role: 'rider' }),
  });
}

export function useVerifyOtp() {
  const data = useData();
  return useMutation({
    mutationFn: (input: { phone: string; code: string; purpose: 'signup' | 'login' }) => data.auth.verifyOtp(input),
  });
}

export function useResendOtp() {
  const data = useData();
  return useMutation({
    mutationFn: (input: { phone: string; purpose: 'signup' | 'login' }) => data.auth.resendOtp(input),
  });
}

export function useSetupProfile() {
  const data = useData();
  return useMutation({
    mutationFn: (input: { phone: string; firstName: string; lastName: string; email?: string; vehicleType?: string; vehiclePlate?: string }) =>
      data.auth.setupProfile({ ...input, role: 'rider' }),
  });
}
