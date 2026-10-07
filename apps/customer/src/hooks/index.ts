import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateDeliveryInput, DeliveryStatus } from '@trustlink/shared';
import { useData } from '../data/DataContext';

export function useDeliveries(status?: DeliveryStatus) {
  const data = useData();
  return useQuery({
    queryKey: ['deliveries', status ?? 'all'],
    queryFn: () => data.delivery.list(status),
  });
}

export function useDelivery(id?: string) {
  const data = useData();
  return useQuery({
    queryKey: ['delivery', id],
    queryFn: () => data.delivery.get(id as string),
    enabled: Boolean(id),
    refetchInterval: 10000,
  });
}

export function useProfile() {
  const data = useData();
  return useQuery({ queryKey: ['profile'], queryFn: () => data.auth.getProfile() });
}

export function useCancelPreview(id?: string) {
  const data = useData();
  return useQuery({
    queryKey: ['cancel-preview', id],
    queryFn: () => data.delivery.cancelPreview(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateDelivery() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDeliveryInput) => data.delivery.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deliveries'] }),
  });
}

export function useTrackDelivery() {
  const data = useData();
  return useMutation({ mutationFn: (trackingNumber: string) => data.delivery.track(trackingNumber) });
}

export function useNotifications(limit = 20) {
  const data = useData();
  return useQuery({ queryKey: ['notifications', limit], queryFn: () => data.notification.list(limit) });
}

export function useCancelDelivery() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => data.delivery.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deliveries'] }),
  });
}
