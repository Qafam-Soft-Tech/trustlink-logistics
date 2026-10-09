import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useData } from '../data/DataContext';

export function useRequestOtp() {
  const data = useData();
  return useMutation({
    mutationFn: (input: { phone: string; purpose: 'signup' | 'login' }) =>
      data.auth.requestOtp({ ...input, role: 'customer' }),
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
    mutationFn: (input: { phone: string; firstName: string; lastName: string; email?: string }) =>
      data.auth.setupProfile({ ...input, role: 'customer' }),
  });
}

/** PUT /auth/profile — phone and role are immutable server-side. */
export function useUpdateProfile() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: { firstName?: string; lastName?: string; email?: string }) => data.auth.updateProfile(patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}
