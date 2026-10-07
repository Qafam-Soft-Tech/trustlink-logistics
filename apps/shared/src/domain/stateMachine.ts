/**
 * Delivery state machine + cancellation rules.
 * Mirrors the backend contract (docs/frontend/CONTRACT_SNAPSHOT.md) — pure TS.
 */
import type { DeliveryStatus } from './types';

export const TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  requested: ['searching', 'cancelled'],
  searching: ['assigned', 'cancelled'],
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'failed'],
  in_transit: ['delivered', 'failed'],
  delivered: [],
  failed: ['returned'],
  returned: [],
  cancelled: [],
};

/** Admin-only redelivery path (not in the transition map): FAILED → SEARCHING. */
export const REDELIVERY_FROM: DeliveryStatus = 'failed';
export const REDELIVERY_TO: DeliveryStatus = 'searching';

export function nextStatuses(from: DeliveryStatus): DeliveryStatus[] {
  return [...(TRANSITIONS[from] ?? [])];
}

export function canTransition(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return (TRANSITIONS[from] ?? []).includes(to);
}

export const TERMINAL_STATUSES: DeliveryStatus[] = ['delivered', 'returned', 'cancelled'];

export function isTerminal(status: DeliveryStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export type CancellationFeeType = 'free' | 'partial' | 'full';

export interface CancellationRule {
  canCancel: boolean;
  type: CancellationFeeType;
  /** only for `partial` */
  percentage?: number;
}

const CANCELLATION_RULES: Record<DeliveryStatus, CancellationRule> = {
  requested: { canCancel: true, type: 'free' },
  searching: { canCancel: true, type: 'free' },
  assigned: { canCancel: true, type: 'partial', percentage: 50 },
  picked_up: { canCancel: true, type: 'partial', percentage: 75 },
  in_transit: { canCancel: true, type: 'full' },
  delivered: { canCancel: false, type: 'full' },
  failed: { canCancel: false, type: 'full' },
  returned: { canCancel: false, type: 'full' },
  cancelled: { canCancel: false, type: 'free' },
};

export function cancellationRule(status: DeliveryStatus): CancellationRule {
  return CANCELLATION_RULES[status];
}

export interface CancellationComputation {
  canCancel: boolean;
  fee: number;
  refundAmount: number;
  reason: string;
}

/** Fee table (naira). Mirrors NotificationService.CANCELLATION_FEES. */
export function computeCancellation(status: DeliveryStatus, fare: number): CancellationComputation {
  const rule = cancellationRule(status);
  const amount = fare || 0;

  if (!rule.canCancel) {
    return { canCancel: false, fee: 0, refundAmount: 0, reason: 'Cannot cancel delivery in current status' };
  }
  if (rule.type === 'free') {
    return { canCancel: true, fee: 0, refundAmount: amount, reason: 'Free cancellation' };
  }
  if (rule.type === 'partial') {
    const pct = rule.percentage ?? 0;
    const fee = round2((amount * pct) / 100);
    return { canCancel: true, fee, refundAmount: round2(amount - fee), reason: `${pct}% cancellation fee applies` };
  }
  return { canCancel: true, fee: amount, refundAmount: 0, reason: 'Full fare charged as cancellation fee' };
}

/** 1st failure → FAILED; 2nd failure → RETURNED. */
export function statusAfterFailure(currentAttempts: number): DeliveryStatus {
  return currentAttempts + 1 >= 2 ? 'returned' : 'failed';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
