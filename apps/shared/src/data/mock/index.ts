/** Mock data adapters — implement every port against an in-memory store. */
import type { DataPorts } from '../ports';
import { MockStore } from './store';
import { buildScenario, type ScenarioName, SCENARIOS } from './scenarios';
import { mockConfig, setMockLatency } from './config';
import { assertOnline, sleep } from './transport';

export interface MockLayerOptions {
  latencyMs?: number;
  scenario?: ScenarioName;
}

export function createMockStore(options: MockLayerOptions = {}): MockStore {
  if (options.latencyMs !== undefined) setMockLatency(options.latencyMs);
  return new MockStore(buildScenario(options.scenario ?? 'happy'));
}

export function createMockAdapters(options: MockLayerOptions = {}): DataPorts {
  const store = createMockStore(options);

  async function run<T>(fn: () => T): Promise<T> {
    assertOnline(store.state.flags);
    await sleep(mockConfig.latencyMs);
    return fn();
  }

  return {
    auth: {
      requestOtp: (input) => run(() => store.authRequestOtp(input)),
      verifyOtp: (input) => run(() => store.authVerifyOtp(input)),
      resendOtp: () => run(() => ({ message: 'OTP resent successfully' })),
      getProfile: () => run(() => store.getSession().user),
      updateProfile: (patch) => run(() => store.updateProfile(patch)),
      setupProfile: (input) => run(() => store.setupProfile(input)),
    },
    delivery: {
      create: (input) => run(() => store.createDelivery(input)),
      list: (status) => run(() => store.listDeliveries(status)),
      get: (id) => run(() => store.getDelivery(id)),
      track: (trackingNumber) => run(() => store.track(trackingNumber)),
      listAddresses: () => run(() => store.listAddresses()),
      createAddress: (input) => run(() => store.createAddress(input)),
      updateAddress: (id, patch) => run(() => store.updateAddress(id, patch)),
      deleteAddress: (id) => run(() => store.deleteAddress(id)),
      setDefaultAddress: (id) => run(() => store.setDefaultAddress(id)),
      cancelPreview: (id) => run(() => store.cancelPreview(id)),
      cancel: (id) => run(() => store.cancel(id)),
      proof: (id) => run(() => store.proof(id)),
    },
    pricing: {
      calculate: (input) => run(() => store.calculateFare(input)),
      getValues: () => run(() => ({ ...store.state.pricing })),
      getConfigs: () => run(() => store.state.pricingConfigs.map((c) => ({ ...c }))),
      updateConfig: (key, value, description) => run(() => store.updateConfig(key, value, description)),
    },
    payment: {
      initialize: (input) => {
        return run(() => {
          const p = store.initializePayment(input);
          return { paymentId: p.id, reference: p.reference, authorizationUrl: p.authorizationUrl as string, accessCode: p.accessCode ?? undefined, status: p.status };
        });
      },
      getByReference: (reference) => run(() => store.paymentByReference(reference)),
      getByDelivery: (deliveryId) => run(() => store.paymentByDelivery(deliveryId)),
      verify: (reference) => run(() => store.verifyPayment(reference)),
    },
    notification: {
      list: (limit) => run(() => store.listNotifications(limit ?? 20)),
    },
    issue: {
      create: (input) => run(() => store.createIssue(input)),
      listMine: (status) => run(() => store.listMineIssues(status)),
      get: (id) => run(() => store.getIssue(id)),
      updateStatus: (id, status, resolution) => run(() => store.updateIssueStatus(id, status, resolution)),
    },
    kyc: {
      submit: (input) => run(() => store.submitKyc(input)),
      status: () => run(() => store.kycStatus()),
      canGoOnline: () => run(() => store.canGoOnline()),
    },
    rider: {
      getProfile: () => run(() => store.getRiderProfile()),
      updateProfile: (patch) => run(() => store.updateRiderProfile(patch)),
      toggleStatus: () => run(() => store.toggleRiderStatus()),
      setStatus: (status) => run(() => store.setRiderStatus(status)),
      updateLocation: (lat, lng) => run(() => store.updateRiderLocation(lat, lng)),
    },
    dispatch: {
      board: () => run(() => store.board()),
      eligibleRiders: (deliveryId) => run(() => store.eligibleRiders(deliveryId)),
      assign: (deliveryId, riderId) => run(() => store.assignRider(deliveryId, riderId)),
      reassign: (deliveryId, newRiderId, reason) => run(() => store.reassignRider(deliveryId, newRiderId, reason)),
      myQueue: () => run(() => store.myQueue()),
      acknowledge: (deliveryId) => run(() => store.acknowledge(deliveryId)),
    },
    execution: {
      pickup: (deliveryId) => run(() => store.pickup(deliveryId)),
      inTransit: (deliveryId) => run(() => store.inTransit(deliveryId)),
      complete: (deliveryId, proof) => run(() => store.complete(deliveryId, proof)),
      reportFailure: (deliveryId, reason) => run(() => store.reportFailure(deliveryId, reason)),
      scheduleRedelivery: (deliveryId) => run(() => store.scheduleRedelivery(deliveryId)),
    },
    admin: {
      listUsers: (filter) => run(() => store.listUsers(filter)),
      getUser: (id) => run(() => store.getUser(id)),
      updateKycStatus: (userId, status, reason) => run(() => store.updateKycStatus(userId, status, reason)),
      toggleActive: (userId) => run(() => store.toggleActive(userId)),
      pendingKyc: () => run(() => store.pendingKyc()),
      approveKyc: (userId) => run(() => store.approveKyc(userId)),
      rejectKyc: (userId, reason) => run(() => store.rejectKyc(userId, reason)),
      allDeliveries: (status) => run(() => store.listDeliveriesAdmin(status)),
      allIssues: (filter) => run(() => store.allIssues(filter)),
      assignIssue: (id, assignedToId) => run(() => store.assignIssue(id, assignedToId)),
    },
  };
}

export { MockStore } from './store';
export { mockConfig, setMockLatency } from './config';
export { buildScenario, SCENARIOS, type ScenarioName } from './scenarios';
export type { MockState, MockSession } from './store';
