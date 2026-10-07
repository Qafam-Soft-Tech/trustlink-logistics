/** Named demo scenarios. Deterministic seeds for the mock store. */
import type { MockState } from './store';
import { DEFAULT_PRICING } from '../../domain/fare';
import {
  DEMO_ADDRESSES,
  DEMO_CUSTOMER,
  DEMO_DELIVERIES,
  DEMO_ISSUES,
  DEMO_NOTIFICATIONS,
  DEMO_RIDERS,
} from '../../mocks/fixtures';
import type { PricingConfig } from '../../domain/types';

export type ScenarioName =
  | 'happy'
  | 'failedOnce'
  | 'failedTwiceReturned'
  | 'assigningDelayed'
  | 'paymentFails'
  | 'emptyAccount'
  | 'offline'
  | 'serverError';

export const SCENARIOS: ScenarioName[] = [
  'happy',
  'failedOnce',
  'failedTwiceReturned',
  'assigningDelayed',
  'paymentFails',
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
    addresses: copy(DEMO_ADDRESSES),
    deliveries: copy(DEMO_DELIVERIES),
    riders: copy(DEMO_RIDERS),
    notifications: copy(DEMO_NOTIFICATIONS),
    issues: copy(DEMO_ISSUES),
    payments: [],
    pricing: { ...DEFAULT_PRICING },
    pricingConfigs: configsFromPricing(),
    session: null,
    flags: { offline: false, serverError: false },
    podByDelivery: {},
    paymentShouldFail: false,
  };
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
