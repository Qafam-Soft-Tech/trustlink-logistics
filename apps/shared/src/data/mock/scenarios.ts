/** Named demo scenarios. Deterministic seeds for the mock store. */
import type { MockState } from './store';
import { DEFAULT_PRICING } from '../../domain/fare';
import {
  DEMO_ADDRESSES,
  DEMO_CUSTOMER,
  DEMO_DELIVERIES,
  DEMO_ISSUES,
  DEMO_NOTIFICATIONS,
  DEMO_RIDER_NOTIFICATIONS,
  DEMO_RIDERS,
} from '../../mocks/fixtures';
import type { Notification, PricingConfig, ProofOfDelivery } from '../../domain/types';

export type ScenarioName =
  | 'happy'
  | 'failedOnce'
  | 'failedTwiceReturned'
  | 'assigningDelayed'
  | 'paymentFails'
  | 'paymentPending'
  | 'emptyAccount'
  | 'offline'
  | 'serverError';

export const SCENARIOS: ScenarioName[] = [
  'happy',
  'failedOnce',
  'failedTwiceReturned',
  'assigningDelayed',
  'paymentFails',
  'paymentPending',
  'emptyAccount',
  'offline',
  'serverError',
];

function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function configsFromPricing(): PricingConfig[] {
  return (Object.keys(DEFAULT_PRICING) as Array<keyof typeof DEFAULT_PRICING>).map((key) => ({
    key,
    value: DEFAULT_PRICING[key],
    description: `${key} (default)`,
  }));
}

export function buildBaseState(): MockState {
  return {
    customer: copy(DEMO_CUSTOMER),
    customers: { [DEMO_CUSTOMER.phone]: copy(DEMO_CUSTOMER) },
    addresses: copy(DEMO_ADDRESSES),
    deliveries: copy(DEMO_DELIVERIES),
    riders: copy(DEMO_RIDERS),
    notifications: [...recentNotifications(), ...copy(DEMO_RIDER_NOTIFICATIONS)],
    issues: copy(DEMO_ISSUES),
    payments: [],
    pricing: { ...DEFAULT_PRICING },
    pricingConfigs: configsFromPricing(),
    session: null,
    authFlow: null,
    lockedPhones: [],
    flags: { offline: false, serverError: false },
    podByDelivery: seedPods(),
    paymentShouldFail: false,
    paymentShouldHang: false,
    kycSubmittedAt: null,
  };
}

/**
 * Most notifications stay historical (September fixtures) but the three newest are dated today,
 * so the Today / Earlier grouping is visible in the demo. Times are relative, like the auth flow.
 */
function recentNotifications(): Notification[] {
  const now = Date.now();
  return copy(DEMO_NOTIFICATIONS).map((n, i) => {
    if (i >= 3) return n;
    const at = new Date(now - (i + 1) * 45 * 60_000).toISOString();
    return { ...n, createdAt: at, sentAt: at };
  });
}

/** Proof-of-delivery records for the delivered fixtures (so the POD/receipt screens have data). */
function seedPods(): Record<string, ProofOfDelivery> {
  const pods: Record<string, ProofOfDelivery> = {};
  for (const d of DEMO_DELIVERIES) {
    if (d.status !== 'delivered') continue;
    pods[d.id] = {
      id: `pod-${d.id}`,
      deliveryId: d.id,
      photoUrl: `file://trustlink-pod-${d.trackingNumber}.jpg`,
      recipientOtp: d.recipientCode ?? '482913',
      recipientName: d.recipientName,
      recipientPhone: d.recipientPhone,
      latitude: null,
      longitude: null,
      notes: 'Handed to the recipient at the drop-off point.',
      createdAt: d.deliveredAt ?? d.updatedAt ?? d.createdAt,
    };
  }
  return pods;
}

export function buildScenario(name: ScenarioName): MockState {
  const base = buildBaseState();

  switch (name) {
    case 'emptyAccount':
      return { ...base, addresses: [], deliveries: [], notifications: [], issues: [] };
    case 'offline':
      return { ...base, flags: { offline: true, serverError: false } };
    case 'serverError':
      return { ...base, flags: { offline: false, serverError: true } };
    case 'paymentFails':
      return { ...base, paymentShouldFail: true };
    case 'paymentPending':
      // verifyPayment keeps returning "pending" → the Processing screen polls and times out.
      return { ...base, paymentShouldHang: true };
    case 'failedOnce':
    case 'failedTwiceReturned':
    case 'assigningDelayed':
    case 'happy':
    default:
      // The base fixture already contains a FAILED (attempts=1), a RETURNED (attempts=2),
      // and SEARCHING deliveries awaiting a rider — covering these scenario states.
      return base;
  }
}
