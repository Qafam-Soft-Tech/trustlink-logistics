import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateIssueInput, ProofInput, RiderStatus, SubmitKycInput, VehicleType } from '@trustlink/shared';
import { useData } from '../data/DataContext';

const TERMINAL_STATUSES = ['delivered', 'failed', 'returned', 'cancelled'];

/* ---------------- work ---------------- */

export function useMyQueue() {
  const data = useData();
  return useQuery({ queryKey: ['rider-queue'], queryFn: () => data.dispatch.myQueue(), refetchInterval: 10000 });
}

/** Every delivery assigned to this rider (active + completed history). */
export function useMyJobs() {
  const data = useData();
  return useQuery({ queryKey: ['rider-jobs'], queryFn: () => data.delivery.list(), refetchInterval: 10000 });
}

export function useDeliveryJob(id?: string) {
  const data = useData();
  return useQuery({
    queryKey: ['rider-job', id],
    queryFn: () => data.delivery.get(id as string),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL_STATUSES.includes(status) ? false : 10000;
    },
  });
}

function useJobInvalidation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['rider-queue'] });
    queryClient.invalidateQueries({ queryKey: ['rider-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['rider-job'] });
  };
}

/** Acknowledge does NOT change status (SC-4) — it records that the rider accepted the job. */
export function useAcknowledgeJob() {
  const data = useData();
  const invalidate = useJobInvalidation();
  return useMutation({ mutationFn: (deliveryId: string) => data.dispatch.acknowledge(deliveryId), onSuccess: invalidate });
}

export function useConfirmPickup() {
  const data = useData();
  const invalidate = useJobInvalidation();
  return useMutation({ mutationFn: (deliveryId: string) => data.execution.pickup(deliveryId), onSuccess: invalidate });
}

export function useMarkInTransit() {
  const data = useData();
  const invalidate = useJobInvalidation();
  return useMutation({ mutationFn: (deliveryId: string) => data.execution.inTransit(deliveryId), onSuccess: invalidate });
}

export function useReportFailure() {
  const data = useData();
  const invalidate = useJobInvalidation();
  return useMutation({
    mutationFn: ({ deliveryId, reason }: { deliveryId: string; reason: string }) => data.execution.reportFailure(deliveryId, reason),
    onSuccess: invalidate,
  });
}

export function useCompleteDelivery() {
  const data = useData();
  const invalidate = useJobInvalidation();
  return useMutation({
    mutationFn: ({ id, proof }: { id: string; proof: ProofInput }) => data.execution.complete(id, proof),
    onSuccess: invalidate,
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

export function useCreateRiderIssue() {
  const data = useData();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIssueInput) => data.issue.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rider-issues'] }),
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
