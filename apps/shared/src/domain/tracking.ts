/**
 * Status-tracking helpers (R1 is status-based — SC-1). Pure TS, unit-tested.
 */
import type { Delivery, DeliveryStatus } from './types';

/** A SEARCHING delivery older than this shows the "assigning delayed" state. */
export const ASSIGNING_DELAY_MINUTES = 5;

export const RECIPIENT_CODE_NOTE =
  'Your rider will ask for this code at delivery. Share it only with the person receiving the package.';

export interface TrackingHeadline {
  title: string;
  message: string;
}

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  requested: 'Requested',
  searching: 'Searching',
  assigned: 'Assigned',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  delivered: 'Delivered',
  failed: 'Failed',
  returned: 'Returned',
  cancelled: 'Cancelled',
};

export function deliveryStatusLabel(status: DeliveryStatus): string {
  return DELIVERY_STATUS_LABELS[status] ?? status;
}

const HEADLINES: Record<DeliveryStatus, TrackingHeadline> = {
  requested: { title: 'Request received', message: 'We\u2019re preparing your request for dispatch.' },
  searching: { title: 'Assigning your rider', message: 'We\u2019re finding the nearest available rider for you.' },
  assigned: { title: 'Rider on the way', message: 'Your rider is heading to the pickup point.' },
  picked_up: { title: 'Package picked up', message: 'Your package is with the rider and on the move.' },
  in_transit: { title: 'In transit', message: 'Your package is on the way to the recipient.' },
  delivered: { title: 'Delivered', message: 'Your package has been delivered.' },
  failed: { title: 'Delivery unsuccessful', message: 'We couldn\u2019t complete this delivery.' },
  returned: { title: 'Returned to sender', message: 'The package is on its way back to you.' },
  cancelled: { title: 'Cancelled', message: 'This delivery was cancelled.' },
};

export function trackingHeadline(status: DeliveryStatus): TrackingHeadline {
  return HEADLINES[status] ?? { title: status, message: '' };
}

/** Timestamp of the latest status change (falls back to updatedAt/createdAt). */
export function lastStatusChangeAt(delivery: Pick<Delivery, 'events' | 'updatedAt' | 'createdAt'>): string | null {
  const events = delivery.events ?? [];
  return events.length > 0 ? events[events.length - 1].createdAt : delivery.updatedAt ?? delivery.createdAt ?? null;
}

/** True when a delivery has been SEARCHING (awaiting manual dispatch) longer than the delay window. */
export function isAssigningDelayed(
  delivery: Pick<Delivery, 'status' | 'events' | 'updatedAt' | 'createdAt'>,
  nowMs: number = Date.now(),
): boolean {
  if (delivery.status !== 'searching') return false;
  const iso = lastStatusChangeAt(delivery);
  if (!iso) return false;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return false;
  return nowMs - at > ASSIGNING_DELAY_MINUTES * 60_000;
}

export function assignmentCount(delivery: Pick<Delivery, 'events'>): number {
  return (delivery.events ?? []).filter((e) => e.status === 'assigned').length;
}

/** A second "assigned" event means dispatch reassigned the job. */
export function wasReassigned(delivery: Pick<Delivery, 'events'>): boolean {
  return assignmentCount(delivery) > 1;
}

/**
 * Share text — tracking number only. `GET /deliveries/track/:trackingNumber` needs a JWT (SC-15),
 * so a recipient cannot open a tracking link; we never share a URL.
 */
export function trackingShareText(delivery: Pick<Delivery, 'trackingNumber' | 'pickupArea' | 'dropoffArea'>): string {
  const route = delivery.pickupArea && delivery.dropoffArea ? ` (${delivery.pickupArea} → ${delivery.dropoffArea})` : '';
  return `TrustLink delivery ${delivery.trackingNumber}${route}. Track it in the TrustLink app.`;
}

/** Calm copy for the unsuccessful-delivery screen — explains what happens next. */
const FAILURE_REASONS: Record<string, string> = {
  recipient_unavailable: 'The recipient wasn\u2019t available to receive the package.',
  wrong_address: 'We couldn\u2019t locate the address on this request.',
  refused: 'The recipient declined to accept the package.',
};

export function failureReasonCopy(reason?: string | null): string {
  return (reason && FAILURE_REASONS[reason]) || 'This delivery couldn\u2019t be completed.';
}

export const REDELIVERY_NOTICE =
  'TrustLink will arrange one redelivery at no extra cost. You\u2019ll get an alert as soon as a rider is found.';

/** A FAILED delivery that dispatch has put back into SEARCHING (D15 — admin-only redelivery). */
export function isRedeliveryScheduled(delivery: Pick<Delivery, 'status' | 'redeliveryAttempts'>): boolean {
  return delivery.status === 'searching' && (delivery.redeliveryAttempts ?? 0) >= 1;
}

/** Which terminal screen a completed delivery opens from the list. */
export function terminalScreenFor(status: DeliveryStatus): 'Pod' | 'Failed' | 'Returned' | 'Cancelled' | 'Details' {
  if (status === 'delivered') return 'Pod';
  if (status === 'failed') return 'Failed';
  if (status === 'returned') return 'Returned';
  if (status === 'cancelled') return 'Cancelled';
  return 'Details';
}
