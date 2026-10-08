/** Mock data adapters — implement every port against an in-memory store. */
import type { DataPorts } from '../ports';
import { MockStore } from './store';
import { buildScenario, type ScenarioName, SCENARIOS } from './scenarios';
import { mockConfig, setMockLatency } from './config';
import { assertOnline, sleep } from './transport';
import type { Delivery, DeliveryStatus } from '../../domain/types';

export interface MockLayerOptions {
  latencyMs?: number;
  scenario?: ScenarioName;
}

/** Demo-only control surface for the investor Demo menu. */
export interface DemoControls {
  scenarios: ScenarioName[];
  scenario(): ScenarioName;
  setScenario(name: ScenarioName): void;
  reset(): void;
  advance(deliveryId: string): Delivery;
  recipientCodes(): Array<{ id: string; trackingNumber: string; status: DeliveryStatus; code: string }>;
  /** force the pending OTP to be expired */
  expireOtp(): void;
}

export function createMockStore(options: MockLayerOptions = {}): MockStore {
  if (options.latencyMs !== undefined) setMockLatency(options.latencyMs);
  return new MockStore(buildScenario(options.scenario ?? 'happy'));
}

/** Builds adapters over a store provided by a getter (so the store can be swapped in demo mode). */
export function createMockAdaptersFromStore(getStore: () => MockStore): DataPorts {
  async function run<T>(fn: (store: MockStore) => T): Promise<T> {
    const store = getStore();
    assertOnline(store.state.flags);
    await sleep(mockConfig.latencyMs);
    return fn(store);
  }

  return {
    auth: {
      requestOtp: (input) => run((s) => s.authRequestOtp(input)),
      verifyOtp: (input) => run((s) => s.authVerifyOtp(input)),
      resendOtp: (input) => run((s) => s.authResendOtp(input)),
      getProfile: () => run((s) => s.getSession().user),
      updateProfile: (patch) => run((s) => s.updateProfile(patch)),
      setupProfile: (input) => run((s) => s.setupProfile(input)),
    },
    delivery: {
      create: (input) => run((s) => s.createDelivery(input)),
      list: (status) => run((s) => s.listDeliveries(status)),
      get: (id) => run((s) => s.getDelivery(id)),
      track: (trackingNumber) => run((s) => s.track(trackingNumber)),
      listAddresses: () => run((s) => s.listAddresses()),
      createAddress: (input) => run((s) => s.createAddress(input)),
      updateAddress: (id, patch) => run((s) => s.updateAddress(id, patch)),
      deleteAddress: (id) => run((s) => s.deleteAddress(id)),
      setDefaultAddress: (id) => run((s) => s.setDefaultAddress(id)),
      cancelPreview: (id) => run((s) => s.cancelPreview(id)),
      cancel: (id) => run((s) => s.cancel(id)),
      proof: (id) => run((s) => s.proof(id)),
    },
    pricing: {
      calculate: (input) => run((s) => s.calculateFare(input)),
      getValues: () => run((s) => ({ ...s.state.pricing })),
      getConfigs: () => run((s) => s.state.pricingConfigs.map((c) => ({ ...c }))),
      updateConfig: (key, value, description) => run((s) => s.updateConfig(key, value, description)),
    },
    payment: {
      initialize: (input) =>
        run((s) => {
          const p = s.initializePayment(input);
          return { paymentId: p.id, reference: p.reference, authorizationUrl: p.authorizationUrl as string, accessCode: p.accessCode ?? undefined, status: p.status };
        }),
      getByReference: (reference) => run((s) => s.paymentByReference(reference)),
      getByDelivery: (deliveryId) => run((s) => s.paymentByDelivery(deliveryId)),
      verify: (reference) => run((s) => s.verifyPayment(reference)),
    },
    notification: {
      list: (limit) => run((s) => s.listNotifications(limit ?? 20)),
    },
    issue: {
      create: (input) => run((s) => s.createIssue(input)),
      listMine: (status) => run((s) => s.listMineIssues(status)),
      get: (id) => run((s) => s.getIssue(id)),
      updateStatus: (id, status, resolution) => run((s) => s.updateIssueStatus(id, status, resolution)),
    },
    kyc: {
      submit: (input) => run((s) => s.submitKyc(input)),
      status: () => run((s) => s.kycStatus()),
      canGoOnline: () => run((s) => s.canGoOnline()),
    },
    rider: {
      getProfile: () => run((s) => s.getRiderProfile()),
      updateProfile: (patch) => run((s) => s.updateRiderProfile(patch)),
      toggleStatus: () => run((s) => s.toggleRiderStatus()),
      setStatus: (status) => run((s) => s.setRiderStatus(status)),
      updateLocation: (lat, lng) => run((s) => s.updateRiderLocation(lat, lng)),
    },
    dispatch: {
      board: () => run((s) => s.board()),
      eligibleRiders: (deliveryId) => run((s) => s.eligibleRiders(deliveryId)),
      assign: (deliveryId, riderId) => run((s) => s.assignRider(deliveryId, riderId)),
      reassign: (deliveryId, newRiderId, reason) => run((s) => s.reassignRider(deliveryId, newRiderId, reason)),
      myQueue: () => run((s) => s.myQueue()),
      acknowledge: (deliveryId) => run((s) => s.acknowledge(deliveryId)),
    },
    execution: {
      pickup: (deliveryId) => run((s) => s.pickup(deliveryId)),
      inTransit: (deliveryId) => run((s) => s.inTransit(deliveryId)),
      complete: (deliveryId, proof) => run((s) => s.complete(deliveryId, proof)),
      reportFailure: (deliveryId, reason) => run((s) => s.reportFailure(deliveryId, reason)),
      scheduleRedelivery: (deliveryId) => run((s) => s.scheduleRedelivery(deliveryId)),
    },
    admin: {
      listUsers: (filter) => run((s) => s.listUsers(filter)),
      getUser: (id) => run((s) => s.getUser(id)),
      updateKycStatus: (userId, status, reason) => run((s) => s.updateKycStatus(userId, status, reason)),
      toggleActive: (userId) => run((s) => s.toggleActive(userId)),
      pendingKyc: () => run((s) => s.pendingKyc()),
      approveKyc: (userId) => run((s) => s.approveKyc(userId)),
      rejectKyc: (userId, reason) => run((s) => s.rejectKyc(userId, reason)),
      allDeliveries: (status) => run((s) => s.listDeliveriesAdmin(status)),
      allIssues: (filter) => run((s) => s.allIssues(filter)),
      assignIssue: (id, assignedToId) => run((s) => s.assignIssue(id, assignedToId)),
    },
  };
}

/** Convenience: build adapters over a single store instance. */
export function createMockAdapters(options: MockLayerOptions = {}): DataPorts {
  const store = createMockStore(options);
  return createMockAdaptersFromStore(() => store);
}

/** Build adapters + demo controls over a swappable store. */
export function createMockLayer(options: MockLayerOptions = {}): { ports: DataPorts; demo: DemoControls } {
  if (options.latencyMs !== undefined) setMockLatency(options.latencyMs);
  let scenario: ScenarioName = options.scenario ?? 'happy';
  let store = new MockStore(buildScenario(scenario));
  const ports = createMockAdaptersFromStore(() => store);
  const demo: DemoControls = {
    scenarios: SCENARIOS,
    scenario: () => scenario,
    setScenario: (name) => {
      scenario = name;
      store = new MockStore(buildScenario(name));
    },
    reset: () => {
      store = new MockStore(buildScenario(scenario));
    },
    advance: (deliveryId) => store.advanceDelivery(deliveryId),
    recipientCodes: () => store.activeRecipientCodes(),
    expireOtp: () => store.expireOtpNow(),
  };
  return { ports, demo };
}

export { MockStore } from './store';
export { mockConfig, setMockLatency } from './config';
export { buildScenario, SCENARIOS, type ScenarioName } from './scenarios';
export type { MockState, MockSession } from './store';
