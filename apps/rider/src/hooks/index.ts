import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProofInput, RiderStatus, SubmitKycInput, VehicleType } from '@trustlink/shared';
import { useData } from '../data/DataContext';

/* ---------------- work ---------------- */

export function useMyQueue() {
  const data = useData();
  return useQuery({ queryKey: ['rider-queue'], queryFn: () => data.dispatch.myQueue(), refetchInterval: 10000 });
}

export function useCompleteDelivery() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, proof }: { id: string; proof: ProofInput }) => data.execution.complete(id, proof),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-queue'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}

/* ---------------- rider profile ---------------- */

export function useRiderProfile() {
  const data = useData();
  return useQuery({ queryKey: ['rider-profile'], queryFn: () => data.rider.getProfile() });
}

export function useMyProfile() {
  const data = useData();
  return useQuery({ queryKey: ['rider-user'], queryFn: () => data.auth.getProfile() });
}

export function useSetRiderStatus() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: RiderStatus) => data.rider.setStatus(status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rider-profile'] }),
  });
}

export function useUpdateRiderProfile() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: { vehicleType?: VehicleType; vehiclePlate?: string; vehicleModel?: string; vehicleColor?: string; zone?: string }) =>
      data.rider.updateProfile(patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rider-profile'] }),
  });
}

/* ---------------- KYC ---------------- */

export function useKycStatus() {
  const data = useData();
  return useQuery({ queryKey: ['kyc-status'], queryFn: () => data.kyc.status() });
}

export function useSubmitKyc() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitKycInput) => data.kyc.submit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
      queryClient.invalidateQueries({ queryKey: ['rider-profile'] });
      queryClient.invalidateQueries({ queryKey: ['rider-user'] });
    },
  });
}

/* ---------------- notifications ---------------- */

export function useMyNotifications(limit = 30) {
  const data = useData();
  return useQuery({ queryKey: ['rider-notifications', limit], queryFn: () => data.notification.list(limit) });
}
