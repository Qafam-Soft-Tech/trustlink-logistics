import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProofInput, RiderStatus } from '@trustlink/shared';
import { useData } from '../data/DataContext';

export function useMyQueue() {
  const data = useData();
  return useQuery({
    queryKey: ['rider-queue'],
    queryFn: () => data.dispatch.myQueue(),
    refetchInterval: 10000,
  });
}

export function useRiderProfile() {
  const data = useData();
  return useQuery({ queryKey: ['rider-profile'], queryFn: () => data.rider.getProfile() });
}

export function useKycStatus() {
  const data = useData();
  return useQuery({ queryKey: ['kyc-status'], queryFn: () => data.kyc.status() });
}

export function useSetRiderStatus() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: RiderStatus) => data.rider.setStatus(status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rider-profile'] }),
  });
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
