/** API adapters — implement every port against the REAL backend routes. */
import type { DataPorts } from '../ports';
import { HttpClient, NotSupportedByBackendError } from '../http';
import type {
  Address,
  AuthResult,
  CancellationPreview,
  CancelResult,
  Delivery,
  DeliveryStatus,
  FareBreakdown,
  Issue,
  IssueStatus,
  KycStatus,
  Notification,
  Payment,
  PaymentStatus,
  PricingConfig,
  PricingConfigKey,
  PricingValues,
  ProofInput,
  ProofOfDelivery,
  RiderProfile,
  RiderStatus,
  User,
  VehicleType,
} from '../../domain/types';
import { DEFAULT_PRICING } from '../../domain/fare';

interface KycStatusResponse {
  status: KycStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

interface VerifyPaymentResponse {
  status: string;
  amount: number;
  paidAt?: string;
  channel?: string;
  gatewayResponse: string;
}

export function createApiAdapters(http: HttpClient): DataPorts {
  const notSupported = (method: string, path: string, note?: string): never => {
    throw new NotSupportedByBackendError(method, path, note);
  };

  return {
    auth: {
      requestOtp: (input) =>
        input.purpose === 'signup'
          ? http.post<{ message: string; userId?: string }>('/auth/signup', {
              phone: input.phone,
              role: input.role,
              firstName: input.firstName,
              lastName: input.lastName,
            })
          : http.post<{ message: string; userId?: string }>('/auth/login', { phone: input.phone }),
      verifyOtp: (input) =>
        input.purpose === 'signup'
          ? http.post<AuthResult>('/auth/verify-otp', { phone: input.phone, code: input.code })
          : http.post<AuthResult>('/auth/verify-login-otp', { phone: input.phone, code: input.code }),
      resendOtp: (input) => http.post<{ message: string }>('/auth/resend-otp', { phone: input.phone, purpose: input.purpose }),
      getProfile: () => http.get<User>('/auth/profile'),
      updateProfile: (patch) => http.put<User>('/auth/profile', patch),
      setupProfile: (input) => http.post<AuthResult>('/auth/profile/setup', input),
    },

    delivery: {
      create: (input) => http.post<Delivery>('/deliveries', input),
      list: (status) => http.get<Delivery[]>('/deliveries', { params: { status } }),
      get: (id) => http.get<Delivery>(`/deliveries/${id}`),
      track: (trackingNumber) => http.get<Delivery>(`/deliveries/track/${trackingNumber}`),
      listAddresses: () => http.get<Address[]>('/deliveries/addresses'),
      createAddress: (input) => http.post<Address>('/deliveries/addresses', input),
      updateAddress: (id, patch) => http.put<Address>(`/deliveries/addresses/${id}`, patch),
      deleteAddress: () => notSupported('DELETE', '/deliveries/addresses/:id', 'no delete route — SC-14'),
      setDefaultAddress: (id) => http.post<void>(`/deliveries/addresses/${id}/default`),
      cancelPreview: (id) => http.get<CancellationPreview>(`/notifications/cancellation-preview/${id}`),
      cancel: (id) => http.post<CancelResult>(`/notifications/cancel/${id}`),
      proof: (id) => http.get<ProofOfDelivery | null>(`/deliveries/${id}/proof`),
    },

    pricing: {
      calculate: (input) => http.post<FareBreakdown>('/pricing/calculate', input),
      getValues: async () => {
        const configs = await http.get<PricingConfig[]>('/pricing/config');
        const values: PricingValues = { ...DEFAULT_PRICING };
        for (const c of configs) {
          if (c.key in values) values[c.key] = Number(c.value);
        }
        return values;
      },
      getConfigs: () => http.get<PricingConfig[]>('/pricing/config'),
      updateConfig: (key: PricingConfigKey, value: number, description?: string) =>
        http.put<PricingConfig>(`/pricing/config/${key}`, { value, description }),
    },

    payment: {
      initialize: (input) =>
        http.post<{ paymentId: string; reference: string; authorizationUrl: string; accessCode?: string; status: PaymentStatus }>(
          '/payments/initialize',
          {
            deliveryId: input.deliveryId,
            // backend InitializePaymentDto documents amount "in kobo" (see SC-16)
            amount: Math.round(input.amountNaira * 100),
            email: input.email,
            phone: input.phone,
            provider: input.provider,
          },
        ),
      getByReference: (reference) => http.get<Payment>(`/payments/${reference}`),
      getByDelivery: (deliveryId) => http.get<Payment | null>(`/payments/delivery/${deliveryId}`),
      verify: (reference) => http.post<VerifyPaymentResponse>(`/payments/verify/${reference}`),
    },

    notification: {
      list: (limit) => http.get<Notification[]>('/notifications', { params: { limit } }),
    },

    issue: {
      create: (input) => http.post<Issue>('/issues', input),
      listMine: (status) => http.get<Issue[]>('/issues', { params: { status } }),
      get: (id) => http.get<Issue>(`/issues/${id}`),
      updateStatus: (id, status, resolution) => http.put<Issue>(`/issues/${id}/status`, { status, resolution }),
    },

    kyc: {
      submit: (input) => http.post<unknown>('/kyc/submit', input),
      status: () => http.get<KycStatusResponse>('/kyc/status'),
      canGoOnline: () => http.get<{ canGoOnline: boolean }>('/kyc/can-go-online'),
    },

    rider: {
      getProfile: () => http.get<RiderProfile>('/rider/profile'),
      updateProfile: (patch) => http.put<RiderProfile>('/rider/profile', patch),
      toggleStatus: () => http.put<RiderProfile>('/rider/profile/status'),
      setStatus: (status: RiderStatus) => http.put<RiderProfile>('/rider/profile/status/set', { status }),
      updateLocation: (latitude, longitude) => http.put<RiderProfile>('/rider/profile/location', { latitude, longitude }),
    },

    dispatch: {
      board: () => http.get<Delivery[]>('/dispatch/board'),
      eligibleRiders: (deliveryId) =>
        http.get<Array<{ rider: RiderProfile; distanceKm: number; estimatedTimeMinutes: number }>>(`/dispatch/${deliveryId}/eligible-riders`),
      assign: (deliveryId, riderId) => http.put<Delivery>(`/dispatch/${deliveryId}/assign`, { riderId }),
      reassign: (deliveryId, newRiderId, reason) => http.put<Delivery>(`/dispatch/${deliveryId}/reassign`, { newRiderId, reason }),
      myQueue: () => http.get<Delivery[]>('/dispatch/my-queue'),
      acknowledge: (deliveryId) => http.post<Delivery>(`/dispatch/${deliveryId}/acknowledge`),
    },

    execution: {
      pickup: (deliveryId, latitude, longitude) => http.put<Delivery>(`/deliveries/${deliveryId}/pickup`, { latitude, longitude }),
      inTransit: (deliveryId, latitude, longitude) => http.put<Delivery>(`/deliveries/${deliveryId}/in-transit`, { latitude, longitude }),
      complete: (deliveryId, proof: ProofInput) => http.post<Delivery>(`/deliveries/${deliveryId}/complete`, proof),
      reportFailure: (deliveryId, reason, latitude, longitude) =>
        http.post<Delivery>(`/deliveries/${deliveryId}/failure`, { reason, latitude, longitude }),
      scheduleRedelivery: (deliveryId) => http.post<Delivery>(`/deliveries/${deliveryId}/redelivery`),
    },

    admin: {
      listUsers: (filter) => http.get<User[]>('/users', { params: { role: filter?.role, isActive: filter?.isActive } }),
      getUser: (id) => http.get<User>(`/users/${id}`),
      updateKycStatus: (userId, status, rejectionReason) => http.put<User>(`/users/${userId}/kyc`, { status, rejectionReason }),
      toggleActive: (userId) => http.put<User>(`/users/${userId}/toggle-active`),
      pendingKyc: () => http.get<unknown[]>('/kyc/pending'),
      approveKyc: (userId) => http.put<unknown>(`/kyc/${userId}/approve`),
      rejectKyc: (userId, reason) => http.put<unknown>(`/kyc/${userId}/reject`, { reason }),
      allDeliveries: (status) => http.get<Delivery[]>('/deliveries/all', { params: { status } }),
      allIssues: (filter) => http.get<Issue[]>('/issues/all', { params: { status: filter?.status, priority: filter?.priority } }),
      assignIssue: (id, assignedToId) => http.put<Issue>(`/issues/${id}/assign`, { assignedToId }),
    },
  };
}
