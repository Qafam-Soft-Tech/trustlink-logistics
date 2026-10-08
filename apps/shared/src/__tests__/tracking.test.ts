import { describe, it, expect } from 'vitest';
import { createMockAdapters } from '../data/mock';
import { DEMO_OTP } from '../domain/constants';
import {
  ASSIGNING_DELAY_MINUTES,
  RECIPIENT_CODE_NOTE,
  isAssigningDelayed,
  lastStatusChangeAt,
  trackingHeadline,
  trackingShareText,
  wasReassigned,
} from '../domain/tracking';
import type { Delivery, DeliveryEvent, DeliveryStatus } from '../domain/types';

const CUSTOMER_PHONE = '08031234567';

function event(status: DeliveryStatus, createdAt: string): DeliveryEvent {
  return { id: `ev-${status}-${createdAt}`, deliveryId: 'del-test', status, actorId: null, actorRole: null, notes: null, latitude: null, longitude: null, createdAt };
}

function delivery(partial: Partial<Delivery>): Delivery {
  return {
    id: 'del-test',
    trackingNumber: 'TLK-2026-001',
    customerId: 'cust-amina',
    riderId: null,
    pickupStreet: '12 Aminu Kano Crescent',
    pickupArea: 'Wuse 2',
    dropoffStreet: 'Plot 447 Constitution Avenue',
    dropoffArea: 'CBD',
    packageType: 'parcel',
    packageWeight: 5,
    senderName: 'Amina Bello',
    senderPhone: CUSTOMER_PHONE,
    recipientName: 'Chinedu Obi',
    recipientPhone: '08060000001',
    status: 'searching',
    redeliveryAttempts: 0,
    createdAt: '2026-09-01T09:00:00.000Z',
    ...partial,
  };
}

describe('tracking model', () => {
  it('has a headline for every active status', () => {
    expect(trackingHeadline('requested').title).toBe('Request received');
    expect(trackingHeadline('searching').title).toBe('Assigning your rider');
    expect(trackingHeadline('assigned').title).toBe('Rider on the way');
    expect(trackingHeadline('picked_up').title).toBe('Package picked up');
    expect(trackingHeadline('in_transit').title).toBe('In transit');
  });

  it('flags a SEARCHING delivery as delayed past the window, and not before it', () => {
    const now = Date.parse('2026-09-01T09:10:00.000Z');
    const old = delivery({ events: [event('requested', '2026-09-01T09:00:00.000Z'), event('searching', '2026-09-01T09:00:30.000Z')] });
    const fresh = delivery({ events: [event('requested', '2026-09-01T09:09:00.000Z'), event('searching', '2026-09-01T09:09:30.000Z')] });

    expect(ASSIGNING_DELAY_MINUTES).toBe(5);
    expect(isAssigningDelayed(old, now)).toBe(true);
    expect(isAssigningDelayed(fresh, now)).toBe(false);
    expect(isAssigningDelayed(delivery({ status: 'assigned', events: old.events }), now)).toBe(false);
    expect(lastStatusChangeAt(old)).toBe('2026-09-01T09:00:30.000Z');
  });

  it('detects a reassignment from a second "assigned" event', () => {
    const single = delivery({ events: [event('assigned', '2026-09-01T09:00:00.000Z')] });
    const twice = delivery({
      events: [event('assigned', '2026-09-01T09:00:00.000Z'), event('searching', '2026-09-01T09:05:00.000Z'), event('assigned', '2026-09-01T09:06:00.000Z')],
    });
    expect(wasReassigned(single)).toBe(false);
    expect(wasReassigned(twice)).toBe(true);
  });

  it('shares the tracking number as text with no URL (track endpoint is not public — SC-15)', () => {
    const d = delivery({});
    const text = trackingShareText(d);
    expect(text).toContain('TLK-2026-001');
    expect(text).toContain('Wuse 2');
    expect(text).not.toMatch(/http/i);
    expect(RECIPIENT_CODE_NOTE).toMatch(/code/i);
  });
});

describe('mock rider decoration', () => {
  it('attaches the rider vehicle type for assigned deliveries (demo-only field)', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await ports.auth.requestOtp({ phone: CUSTOMER_PHONE, purpose: 'login' });
    await ports.auth.verifyOtp({ phone: CUSTOMER_PHONE, code: DEMO_OTP, purpose: 'login' });

    const deliveries = await ports.delivery.list();
    const assigned = deliveries.find((d) => d.riderId && ['assigned', 'picked_up', 'in_transit'].includes(d.status));
    expect(assigned).toBeTruthy();
    if (assigned) {
      expect(assigned.riderVehicleType).toBeTruthy();
      const one = await ports.delivery.get(assigned.id);
      expect(one.riderVehicleType).toBe(assigned.riderVehicleType);
    }
  });
});
