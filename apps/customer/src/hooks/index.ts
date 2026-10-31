import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateDeliveryInput, CreateIssueInput, DeliveryStatus, InitializePaymentInput, IssueStatus, PackageType } from '@trustlink/shared';
import { useData } from '../data/DataContext';

const TERMINAL_STATUSES: DeliveryStatus[] = ['delivered', 'failed', 'returned', 'cancelled'];

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
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL_STATUSES.includes(status) ? false : 10000;
    },
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

export function useAddresses() {
  const data = useData();
  return useQuery({ queryKey: ['addresses'], queryFn: () => data.delivery.listAddresses() });
}

export function useCreateAddress() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<import('@trustlink/shared').Address>) => data.delivery.createAddress(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useUpdateAddress() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<import('@trustlink/shared').Address> }) => data.delivery.updateAddress(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useDeleteAddress() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => data.delivery.deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useSetDefaultAddress() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => data.delivery.setDefaultAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

/** Client-side distance estimate for a pickup/drop-off area pair (feeds the fare quote, SC-8). */
export function useDistanceEstimate(pickupArea?: string, dropoffArea?: string) {
  const data = useData();
  return useQuery({
    queryKey: ['distance', pickupArea, dropoffArea],
    queryFn: () => data.pricing.estimateDistance({ pickupArea: pickupArea as string, dropoffArea: dropoffArea as string }),
    enabled: Boolean(pickupArea && dropoffArea),
  });
}

export function useFareQuote(input: {
  pickupArea?: string;
  dropoffArea?: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
  weightKg: number;
  packageType: PackageType;
}) {
  const data = useData();
  const hasLocation = Boolean(input.pickupArea && input.dropoffArea) ||
    (typeof input.pickupLatitude === 'number' && typeof input.dropoffLatitude === 'number');
  return useQuery({
    queryKey: ['fare', input.pickupArea, input.dropoffArea, input.pickupLatitude, input.dropoffLatitude, input.weightKg, input.packageType],
    queryFn: () => data.pricing.calculate(input),
    enabled: hasLocation,
  });
}

export function useUploadFile() {
  const data = useData();
  return useMutation({
    mutationFn: (input: { uri: string; name?: string; type?: string }) => data.files.upload(input),
  });
}

export function useResendRecipientOtp() {
  const data = useData();
  return useMutation({ mutationFn: (deliveryId: string) => data.delivery.resendRecipientOtp(deliveryId) });
}

export function useInitializePayment() {
  const data = useData();
  return useMutation({ mutationFn: (input: InitializePaymentInput) => data.payment.initialize(input) });
}

export function useVerifyPayment() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) => data.payment.verify(reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['payment'] });
    },
  });
}

export function usePayment(reference?: string) {
  const data = useData();
  return useQuery({
    queryKey: ['payment', reference],
    queryFn: () => data.payment.getByReference(reference as string),
    enabled: Boolean(reference),
  });
}

export function useDeliveryProof(id?: string) {
  const data = useData();
  return useQuery({
    queryKey: ['proof', id],
    queryFn: () => data.delivery.proof(id as string),
    enabled: Boolean(id),
  });
}

/* ---------------- support ---------------- */

export function useMyIssues(status?: IssueStatus) {
  const data = useData();
  return useQuery({ queryKey: ['issues', status ?? 'all'], queryFn: () => data.issue.listMine(status) });
}

export function useIssue(id?: string) {
  const data = useData();
  return useQuery({ queryKey: ['issue', id], queryFn: () => data.issue.get(id as string), enabled: Boolean(id) });
}

export function useCreateIssue() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIssueInput) => data.issue.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['issues'] }),
  });
}

/* ---------------- notifications ---------------- */

export function useMarkNotificationRead() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => data.notification.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => data.notification.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
