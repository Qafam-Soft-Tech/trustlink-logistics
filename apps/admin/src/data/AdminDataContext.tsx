import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminState,
  AdminUser,
  Delivery,
  DeliveryEvent,
  DeliveryStatus,
  Issue,
  IssuePriority,
  IssueStatus,
  IssueType,
  PaymentStatus,
  PricingConfig,
  RiderProfile,
  UserRole,
} from './types';
import { createInitialState } from './mock';
import { readAdminDataSource } from './dataSource';
import {
  adminApi,
  type ApiDelivery,
  type ApiIssue,
  type ApiKyc,
  type ApiPayment,
  type ApiPricingConfig,
  type ApiRiderRecord,
  type ApiUser,
} from '../api/adminApi';

/**
 * Intended behaviour the backend does not implement (SC-43): a rider returns ONLINE when their job
 * ends, unless they still have another active delivery. Mirrored from the shared mock.
 */
function releaseRider(state: AdminState, riderId?: string | null, exceptDeliveryId?: string): RiderProfile[] {
  if (!riderId) return state.riders;
  const stillBusy = state.deliveries.some(
    (delivery) =>
      delivery.riderId === riderId &&
      delivery.id !== exceptDeliveryId &&
      ['assigned', 'picked_up', 'in_transit'].includes(delivery.status),
  );
  if (stillBusy) return state.riders;
  return state.riders.map((rider) => (rider.id === riderId && rider.status === 'on_trip' ? { ...rider, status: 'online' } : rider));
}

/** The actions and state the console pages consume. Both the mock and API providers implement it. */
export interface AdminDataApi {
  state: AdminState;
  assignRider(deliveryId: string, riderId: string): void;
  reassignRider(deliveryId: string, riderId: string, reason: string): void;
  scheduleRedelivery(deliveryId: string): void;
  approveKyc(riderId: string): void;
  rejectKyc(riderId: string, reason: string): void;
  toggleUserActive(userId: string): void;
  assignIssue(issueId: string, adminId: string): void;
  updateIssueStatus(issueId: string, status: IssueStatus, resolution?: string): void;
  updatePricing(key: string, value: number): void;
  resetData(): void;
}

const AdminDataContext = createContext<AdminDataApi | undefined>(undefined);

function nowIso(): string {
  return new Date().toISOString();
}

function pushEvent(delivery: Delivery, status: DeliveryStatus, note: string): DeliveryEvent[] {
  return [
    ...delivery.events,
    { id: `ev-admin-${delivery.events.length + 1}`, status, at: nowIso(), note, actorRole: 'admin' },
  ];
}

/* ---------------- mock provider ---------------- */

function MockAdminDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>(() => createInitialState());

  const assignRider = useCallback((deliveryId: string, riderId: string) => {
    setState((prev) => {
      const rider = prev.riders.find((r) => r.id === riderId);
      if (!rider) return prev;
      return {
        ...prev,
        deliveries: prev.deliveries.map((d) =>
          d.id === deliveryId
            ? { ...d, riderId, status: 'assigned', updatedAt: nowIso(), events: pushEvent(d, 'assigned', `Assigned to ${rider.firstName} ${rider.lastName}`) }
            : d,
        ),
        riders: prev.riders.map((r) => (r.id === riderId ? { ...r, status: 'on_trip' } : r)),
      };
    });
  }, []);

  const reassignRider = useCallback((deliveryId: string, riderId: string, reason: string) => {
    setState((prev) => {
      const rider = prev.riders.find((r) => r.id === riderId);
      if (!rider) return prev;
      const previousRiderId = prev.deliveries.find((d) => d.id === deliveryId)?.riderId;
      return {
        ...prev,
        deliveries: prev.deliveries.map((d) =>
          d.id === deliveryId
            ? { ...d, riderId, status: 'assigned', updatedAt: nowIso(), events: pushEvent(d, 'assigned', `Reassigned to ${rider.firstName} ${rider.lastName} — ${reason}`) }
            : d,
        ),
        riders: prev.riders.map((r) => (r.id === riderId ? { ...r, status: 'on_trip' } : r.id === previousRiderId ? { ...r, status: 'online' } : r)),
      };
    });
  }, []);

  const scheduleRedelivery = useCallback((deliveryId: string) => {
    setState((prev) => {
      const target = prev.deliveries.find((d) => d.id === deliveryId);
      if (!target || target.status !== 'failed' || target.redeliveryAttempts >= 2) return prev;
      const previousRiderId = target.riderId;
      return {
        ...prev,
        deliveries: prev.deliveries.map((d) =>
          d.id === deliveryId
            ? { ...d, status: 'searching', riderId: null, updatedAt: nowIso(), events: pushEvent(d, 'searching', 'Redelivery scheduled by dispatch') }
            : d,
        ),
        riders: releaseRider(prev, previousRiderId, deliveryId),
      };
    });
  }, []);

  const approveKyc = useCallback((riderId: string) => {
    setState((prev) => ({
      ...prev,
      riders: prev.riders.map((r) => (r.id === riderId ? { ...r, kycStatus: 'approved', kycRejectionReason: null } : r)),
    }));
  }, []);

  const rejectKyc = useCallback((riderId: string, reason: string) => {
    setState((prev) => ({
      ...prev,
      riders: prev.riders.map((r) => (r.id === riderId ? { ...r, kycStatus: 'rejected', kycRejectionReason: reason } : r)),
    }));
  }, []);

  const toggleUserActive = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)),
      riders: prev.riders.map((r) => (r.id === userId ? { ...r, status: r.status === 'offline' ? 'online' : 'offline' } : r)),
    }));
  }, []);

  const assignIssue = useCallback((issueId: string, adminId: string) => {
    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((i) =>
        i.id === issueId ? { ...i, assignedToId: adminId, status: i.status === 'open' ? 'in_progress' : i.status, updatedAt: nowIso() } : i,
      ),
    }));
  }, []);

  const updateIssueStatus = useCallback((issueId: string, status: IssueStatus, resolution?: string) => {
    setState((prev) => ({
      ...prev,
      issues: prev.issues.map((i) => (i.id === issueId ? { ...i, status, resolution: resolution ?? i.resolution ?? null, updatedAt: nowIso() } : i)),
    }));
  }, []);

  const updatePricing = useCallback((key: string, value: number) => {
    setState((prev) => ({ ...prev, pricing: prev.pricing.map((p) => (p.key === key ? { ...p, value } : p)) }));
  }, []);

  const resetData = useCallback(() => setState(createInitialState()), []);

  const value = useMemo<AdminDataApi>(
    () => ({ state, assignRider, reassignRider, scheduleRedelivery, approveKyc, rejectKyc, toggleUserActive, assignIssue, updateIssueStatus, updatePricing, resetData }),
    [state, assignRider, reassignRider, scheduleRedelivery, approveKyc, rejectKyc, toggleUserActive, assignIssue, updateIssueStatus, updatePricing, resetData],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

/* ---------------- api provider ---------------- */

function displayName(user?: ApiUser | null): string {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Unknown';
}

function mapDelivery(delivery: ApiDelivery, payment?: ApiPayment): Delivery {
  const status = delivery.status as DeliveryStatus;
  return {
    id: delivery.id,
    trackingNumber: delivery.trackingNumber,
    customerName: displayName(delivery.customer),
    customerPhone: delivery.customer?.phone ?? '',
    pickupStreet: delivery.pickupStreet ?? '',
    pickupArea: delivery.pickupArea ?? '',
    dropoffStreet: delivery.dropoffStreet ?? '',
    dropoffArea: delivery.dropoffArea ?? '',
    packageType: delivery.packageType,
    packageWeight: Number(delivery.packageWeight ?? 0),
    packageDescription: delivery.packageDescription ?? undefined,
    senderName: delivery.senderName,
    senderPhone: delivery.senderPhone,
    recipientName: delivery.recipientName,
    recipientPhone: delivery.recipientPhone,
    status,
    riderId: delivery.riderId,
    fare: Number(delivery.fare ?? 0),
    paymentStatus: (payment?.status ?? 'pending') as PaymentStatus,
    paymentReference: delivery.paymentReference ?? payment?.reference ?? null,
    redeliveryAttempts: delivery.redeliveryAttempts ?? 0,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt ?? delivery.createdAt,
    events: (delivery.events ?? [])
      .map((event) => ({
        id: event.id,
        status: event.status as DeliveryStatus,
        at: event.createdAt,
        note: event.notes ?? undefined,
        actorRole: (event.actorRole as UserRole) ?? undefined,
      }))
      .sort((a, b) => a.at.localeCompare(b.at)),
    pod: null,
  };
}

function mapRider(record: ApiRiderRecord, kyc: ApiKyc | null): RiderProfile {
  return {
    id: record.user.id,
    firstName: record.user.firstName ?? '',
    lastName: record.user.lastName ?? '',
    phone: record.user.phone,
    email: record.user.email ?? undefined,
    vehicleType: record.profile.vehicleType,
    vehiclePlate: record.profile.vehiclePlate,
    zone: record.profile.zone ?? '',
    status: record.profile.status,
    kycStatus: kyc?.status ?? record.user.kycStatus ?? 'pending',
    kycRejectionReason: kyc?.rejectionReason ?? null,
    rating: Number(record.profile.rating ?? 0),
    totalDeliveries: record.profile.totalDeliveries ?? 0,
    documents: {
      nin: kyc?.nin ?? '',
      idFront: kyc?.idFrontUrl ?? '',
      idBack: kyc?.idBackUrl ?? '',
      selfie: kyc?.selfieUrl ?? '',
      vehicleRegistration: kyc?.vehicleRegistrationUrl ?? '',
    },
  };
}

function mapUser(user: ApiUser): AdminUser {
  return {
    id: user.id,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    phone: user.phone,
    email: user.email ?? undefined,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function mapIssue(issue: ApiIssue): Issue {
  return {
    id: issue.id,
    deliveryId: issue.deliveryId,
    reporterName: displayName(issue.reporter),
    type: issue.type as IssueType,
    priority: issue.priority as IssuePriority,
    title: issue.title,
    description: issue.description,
    status: issue.status as IssueStatus,
    assignedToId: issue.assignedToId ?? null,
    resolution: issue.resolution ?? null,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt ?? issue.createdAt,
  };
}

function mapPricing(config: ApiPricingConfig): PricingConfig {
  return {
    key: config.key,
    value: Number(config.value),
    description: config.description ?? '',
  };
}

function ApiAdminDataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const deliveriesQuery = useQuery({
    queryKey: ['admin', 'deliveries'],
    queryFn: adminApi.deliveries,
    refetchInterval: 10000,
  });
  const paymentsQuery = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: adminApi.payments,
    refetchInterval: 10000,
  });
  const ridersQuery = useQuery({
    queryKey: ['admin', 'riders'],
    queryFn: adminApi.riders,
    refetchInterval: 10000,
  });
  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.users(),
  });
  const issuesQuery = useQuery({
    queryKey: ['admin', 'issues'],
    queryFn: adminApi.issues,
    refetchInterval: 10000,
  });
  const pricingQuery = useQuery({
    queryKey: ['admin', 'pricing'],
    queryFn: adminApi.pricing,
  });

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
  }, [queryClient]);

  const assignRiderMutation = useMutation({
    mutationFn: ({ deliveryId, riderId }: { deliveryId: string; riderId: string }) => adminApi.assignRider(deliveryId, riderId),
    onSuccess: invalidateAll,
  });
  const reassignRiderMutation = useMutation({
    mutationFn: ({ deliveryId, riderId, reason }: { deliveryId: string; riderId: string; reason: string }) =>
      adminApi.reassignRider(deliveryId, riderId, reason),
    onSuccess: invalidateAll,
  });
  const redeliveryMutation = useMutation({
    mutationFn: (deliveryId: string) => adminApi.scheduleRedelivery(deliveryId),
    onSuccess: invalidateAll,
  });
  const approveKycMutation = useMutation({
    mutationFn: (riderId: string) => adminApi.approveKyc(riderId),
    onSuccess: invalidateAll,
  });
  const rejectKycMutation = useMutation({
    mutationFn: ({ riderId, reason }: { riderId: string; reason: string }) => adminApi.rejectKyc(riderId, reason),
    onSuccess: invalidateAll,
  });
  const toggleUserMutation = useMutation({
    mutationFn: (userId: string) => adminApi.toggleUserActive(userId),
    onSuccess: invalidateAll,
  });
  const assignIssueMutation = useMutation({
    mutationFn: ({ issueId, assignedToId }: { issueId: string; assignedToId: string }) => adminApi.assignIssue(issueId, assignedToId),
    onSuccess: invalidateAll,
  });
  const updateIssueMutation = useMutation({
    mutationFn: ({ issueId, status, resolution }: { issueId: string; status: string; resolution?: string }) =>
      adminApi.updateIssueStatus(issueId, status, resolution),
    onSuccess: invalidateAll,
  });
  const updatePricingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: number }) => adminApi.updatePricing(key, value),
    onSuccess: invalidateAll,
  });

  const paymentByDelivery = useMemo(() => {
    const map = new Map<string, ApiPayment>();
    for (const payment of paymentsQuery.data ?? []) {
      if (!map.has(payment.deliveryId)) map.set(payment.deliveryId, payment);
    }
    return map;
  }, [paymentsQuery.data]);

  const state = useMemo<AdminState>(() => ({
    deliveries: (deliveriesQuery.data ?? []).map((delivery) => mapDelivery(delivery, paymentByDelivery.get(delivery.id))),
    riders: (ridersQuery.data ?? []).map((record) => mapRider(record, record.kyc)),
    users: (usersQuery.data ?? []).map(mapUser),
    issues: (issuesQuery.data ?? []).map(mapIssue),
    pricing: (pricingQuery.data ?? []).map(mapPricing),
  }), [deliveriesQuery.data, paymentByDelivery, ridersQuery.data, usersQuery.data, issuesQuery.data, pricingQuery.data]);

  const value = useMemo<AdminDataApi>(() => ({
    state,
    assignRider: (deliveryId, riderId) => assignRiderMutation.mutate({ deliveryId, riderId }),
    reassignRider: (deliveryId, riderId, reason) => reassignRiderMutation.mutate({ deliveryId, riderId, reason }),
    scheduleRedelivery: (deliveryId) => redeliveryMutation.mutate(deliveryId),
    approveKyc: (riderId) => approveKycMutation.mutate(riderId),
    rejectKyc: (riderId, reason) => rejectKycMutation.mutate({ riderId, reason }),
    toggleUserActive: (userId) => toggleUserMutation.mutate(userId),
    assignIssue: (issueId, adminId) => assignIssueMutation.mutate({ issueId, assignedToId: adminId }),
    updateIssueStatus: (issueId, status, resolution) => updateIssueMutation.mutate({ issueId, status, resolution }),
    updatePricing: (key, value) => updatePricingMutation.mutate({ key, value }),
    resetData: invalidateAll,
  }), [state, assignRiderMutation, reassignRiderMutation, redeliveryMutation, approveKycMutation, rejectKycMutation, toggleUserMutation, assignIssueMutation, updateIssueMutation, updatePricingMutation, invalidateAll]);

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

/* ---------------- provider selection ---------------- */

export function AdminDataProvider({ children }: { children: ReactNode }) {
  return readAdminDataSource() === 'api'
    ? <ApiAdminDataProvider>{children}</ApiAdminDataProvider>
    : <MockAdminDataProvider>{children}</MockAdminDataProvider>;
}

export function useAdminData(): AdminDataApi {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used within an AdminDataProvider');
  return ctx;
}
