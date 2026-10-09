import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AdminState, Delivery, DeliveryEvent, DeliveryStatus, IssueStatus } from './types';
import { createInitialState } from './mock';

/** In-memory admin mock data + the actions the console can perform (SC-40: admin-local mock). */
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

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState>(() => createInitialState());

  const assignRider = useCallback(
    (deliveryId: string, riderId: string) => {
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
    },
    [],
  );

  const reassignRider = useCallback(
    (deliveryId: string, riderId: string, reason: string) => {
      setState((prev) => {
        const rider = prev.riders.find((r) => r.id === riderId);
        if (!rider) return prev;
        return {
          ...prev,
          deliveries: prev.deliveries.map((d) =>
            d.id === deliveryId
              ? {
                  ...d,
                  riderId,
                  status: 'assigned',
                  updatedAt: nowIso(),
                  events: pushEvent(d, 'assigned', `Reassigned to ${rider.firstName} ${rider.lastName} — ${reason}`),
                }
              : d,
          ),
          riders: prev.riders.map((r) =>
            r.id === riderId ? { ...r, status: 'on_trip' } : r.id === prev.deliveries.find((d) => d.id === deliveryId)?.riderId ? { ...r, status: 'online' } : r,
          ),
        };
      });
    },
    [],
  );

  const scheduleRedelivery = useCallback(
    (deliveryId: string) => {
      setState((prev) => ({
        ...prev,
        deliveries: prev.deliveries.map((d) =>
          d.id === deliveryId && d.status === 'failed' && d.redeliveryAttempts < 2
            ? { ...d, status: 'searching', riderId: null, updatedAt: nowIso(), events: pushEvent(d, 'searching', 'Redelivery scheduled by dispatch') }
            : d,
        ),
      }));
    },
    [],
  );

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

export function useAdminData(): AdminDataApi {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used within an AdminDataProvider');
  return ctx;
}
