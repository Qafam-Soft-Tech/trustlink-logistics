import { describe, it, expect } from 'vitest';
import { canTransition, nextStatuses, cancellationRule, computeCancellation, statusAfterFailure, isTerminal } from '../domain/stateMachine';
import type { DeliveryStatus } from '../domain/types';

describe('state machine', () => {
  it('allows REQUESTED → SEARCHING', () => {
    expect(canTransition('requested', 'searching')).toBe(true);
  });
  it('allows REQUESTED → CANCELLED', () => {
    expect(canTransition('requested', 'cancelled')).toBe(true);
  });
  it('rejects REQUESTED → DELIVERED', () => {
    expect(canTransition('requested', 'delivered')).toBe(false);
  });
  it('allows FAILED → RETURNED (only mapped transition)', () => {
    expect(nextStatuses('failed')).toEqual(['returned']);
  });
  it('terminates DELIVERED', () => {
    expect(nextStatuses('delivered')).toEqual([]);
    expect(isTerminal('delivered')).toBe(true);
  });
  it('terminates RETURNED and CANCELLED', () => {
    expect(nextStatuses('returned')).toEqual([]);
    expect(nextStatuses('cancelled')).toEqual([]);
  });
  it('rejects DELIVERED → anything', () => {
    (['requested', 'searching', 'cancelled', 'failed'] as DeliveryStatus[]).forEach((to) => {
      expect(canTransition('delivered', to)).toBe(false);
    });
  });
  it('allows IN_TRANSIT → DELIVERED and → FAILED', () => {
    expect(canTransition('in_transit', 'delivered')).toBe(true);
    expect(canTransition('in_transit', 'failed')).toBe(true);
  });
});

describe('cancellation rules', () => {
  it('free at REQUESTED/SEARCHING', () => {
    expect(cancellationRule('requested').type).toBe('free');
    expect(cancellationRule('searching').type).toBe('free');
  });
  it('50% at ASSIGNED', () => {
    expect(cancellationRule('assigned')).toMatchObject({ type: 'partial', percentage: 50 });
  });
  it('75% at PICKED_UP', () => {
    expect(cancellationRule('picked_up')).toMatchObject({ type: 'partial', percentage: 75 });
  });
  it('full at IN_TRANSIT', () => {
    expect(cancellationRule('in_transit')).toMatchObject({ canCancel: true, type: 'full' });
  });
  it('not cancellable at terminal statuses', () => {
    (['delivered', 'failed', 'returned', 'cancelled'] as DeliveryStatus[]).forEach((s) => {
      expect(cancellationRule(s).canCancel).toBe(false);
    });
  });
  it('computes free refund on ₦1400', () => {
    expect(computeCancellation('requested', 1400)).toMatchObject({ canCancel: true, fee: 0, refundAmount: 1400 });
  });
  it('computes 50% fee on ₦1400', () => {
    expect(computeCancellation('assigned', 1400)).toMatchObject({ fee: 700, refundAmount: 700 });
  });
  it('computes 75% fee on ₦1400', () => {
    expect(computeCancellation('picked_up', 1400)).toMatchObject({ fee: 1050, refundAmount: 350 });
  });
  it('computes full fee on ₦1400', () => {
    expect(computeCancellation('in_transit', 1400)).toMatchObject({ fee: 1400, refundAmount: 0 });
  });
});

describe('failure counters', () => {
  it('1st failure → failed', () => {
    expect(statusAfterFailure(0)).toBe('failed');
  });
  it('2nd failure → returned', () => {
    expect(statusAfterFailure(1)).toBe('returned');
  });
  it('beyond 2 → returned', () => {
    expect(statusAfterFailure(2)).toBe('returned');
  });
});
