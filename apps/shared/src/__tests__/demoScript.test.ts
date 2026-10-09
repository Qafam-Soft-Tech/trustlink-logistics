import { describe, it, expect } from 'vitest';
import { createMockAdapters } from '../data/mock';
import { DEMO_OTP } from '../domain/constants';
import { RECIPIENT_CODE_FALLBACK } from './demoConstants';

/**
 * The scripted investor demo, executed against the mock data layer.
 *
 * NOTE: this runs in a **single process** against one mock store. It proves the business rules and
 * the app-level call order — it does NOT prove cross-app data sharing. The three apps each hold
 * their own independent in-memory mock and never share live data (see DEMO.md §8).
 */
const CUSTOMER_PHONE = '08031234567';
const RIDER_PHONE = '08050000001';
const RIDER_ID = 'rider-1';

type Ports = ReturnType<typeof createMockAdapters>;

async function login(ports: Ports, phone: string) {
  await ports.auth.requestOtp({ phone, purpose: 'login' });
  return ports.auth.verifyOtp({ phone, code: DEMO_OTP, purpose: 'login' });
}

function requestBody() {
  return {
    pickupStreet: '12 Aminu Kano Crescent',
    pickupLandmark: 'Near Sahad Stores',
    pickupArea: 'Wuse 2',
    dropoffStreet: 'Plot 447 Constitution Avenue',
    dropoffArea: 'CBD',
    packageType: 'parcel' as const,
    packageWeight: 5,
    packageDescription: 'Personal effects',
    senderName: 'Amina Bello',
    senderPhone: CUSTOMER_PHONE,
    recipientName: 'Chinedu Obi',
    recipientPhone: '08060000001',
  };
}

describe('scripted demo (automated half)', () => {
  it('happy path: request → pay → dispatch → deliver with the recipient code', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await login(ports, CUSTOMER_PHONE);

    // 1. Customer requests a delivery (before paying).
    const delivery = await ports.delivery.create(requestBody());
    expect(delivery.status).toBe('requested');
    expect(delivery.trackingNumber).toMatch(/^TLK-2026-\d{3}$/);

    // 2. Fare quote then checkout.
    const distanceKm = await ports.pricing.estimateDistance({ pickupArea: 'Wuse 2', dropoffArea: 'CBD' });
    const fare = await ports.pricing.calculate({ distanceKm, weightKg: 5, packageType: 'parcel' });
    expect(fare.totalFare).toBeGreaterThanOrEqual(fare.minimumFare);

    const payment = await ports.payment.initialize({
      deliveryId: delivery.id,
      amountNaira: delivery.fare ?? fare.totalFare,
      provider: 'paystack',
    });
    expect(payment.status).toBe('processing');
    const verified = await ports.payment.verify(payment.reference);
    expect(verified.status).toBe('success');

    // 3. Payment success moves the delivery to dispatch.
    const searching = await ports.delivery.get(delivery.id);
    expect(searching.status).toBe('searching');

    // 4. Dispatcher assigns the online, approved rider.
    const assigned = await ports.dispatch.assign(delivery.id, RIDER_ID);
    expect(assigned.status).toBe('assigned');
    expect(assigned.riderId).toBe(RIDER_ID);

    // 5. Rider picks the job up and runs the lifecycle.
    await login(ports, RIDER_PHONE);
    const queue = await ports.dispatch.myQueue();
    expect(queue.some((job) => job.id === delivery.id)).toBe(true);

    await ports.dispatch.acknowledge(delivery.id);
    await ports.execution.pickup(delivery.id);
    await ports.execution.inTransit(delivery.id);

    // Wrong code is rejected (the demo's "wrong OTP" beat).
    await expect(
      ports.execution.complete(delivery.id, {
        photoUrl: 'file://pod.jpg',
        recipientOtp: '000000',
        recipientName: 'Chinedu Obi',
        recipientPhone: '08060000001',
      }),
    ).rejects.toMatchObject({ name: 'ConflictError' });

    // Correct code completes the delivery.
    const delivered = await ports.execution.complete(delivery.id, {
      photoUrl: 'file://pod.jpg',
      recipientOtp: RECIPIENT_CODE_FALLBACK,
      recipientName: 'Chinedu Obi',
      recipientPhone: '08060000001',
    });
    expect(delivered.status).toBe('delivered');

    // 6. POD is readable and the receipt has the paid fare.
    const pod = await ports.delivery.proof(delivery.id);
    expect(pod?.recipientName).toBe('Chinedu Obi');
    expect(delivered.fare).toBeGreaterThan(0);
  });

  it('failure path: fail → admin schedules redelivery → delivered', async () => {
    // emptyAccount: the rider has no other active seeded jobs, so the release rule (SC-43) applies.
    const ports = createMockAdapters({ latencyMs: 0, scenario: 'emptyAccount' });
    await login(ports, CUSTOMER_PHONE);
    const delivery = await ports.delivery.create(requestBody());
    const payment = await ports.payment.initialize({ deliveryId: delivery.id, amountNaira: delivery.fare ?? 0, provider: 'flutterwave' });
    await ports.payment.verify(payment.reference);
    await ports.dispatch.assign(delivery.id, RIDER_ID);

    await login(ports, RIDER_PHONE);
    await ports.dispatch.acknowledge(delivery.id);
    await ports.execution.pickup(delivery.id);
    await ports.execution.inTransit(delivery.id);

    // First failure → FAILED with one attempt used (customer sees the redelivery notice).
    const failed = await ports.execution.reportFailure(delivery.id, 'recipient_unavailable');
    expect(failed.status).toBe('failed');
    expect(failed.redeliveryAttempts).toBe(1);

    // Dispatcher schedules the redelivery (admin-only — D15).
    const redelivered = await ports.execution.scheduleRedelivery(delivery.id);
    expect(redelivered.status).toBe('searching');
    expect(redelivered.riderId).toBeNull();

    // The rider is freed when the job ends (the mock's intended behaviour — SC-43), so the SAME
    // rider can be assigned again without any workaround.
    await ports.dispatch.assign(delivery.id, RIDER_ID);
    await ports.dispatch.acknowledge(delivery.id);
    await ports.execution.pickup(delivery.id);
    await ports.execution.inTransit(delivery.id);
    const delivered = await ports.execution.complete(delivery.id, {
      photoUrl: 'file://pod.jpg',
      recipientOtp: RECIPIENT_CODE_FALLBACK,
      recipientName: 'Chinedu Obi',
      recipientPhone: '08060000001',
    });
    expect(delivered.status).toBe('delivered');
  });

  it('two failures return the package to the sender', async () => {
    const ports = createMockAdapters({ latencyMs: 0, scenario: 'emptyAccount' });
    await login(ports, CUSTOMER_PHONE);
    const delivery = await ports.delivery.create(requestBody());
    // Payment first: the transition map only allows dispatch to assign a SEARCHING delivery (SC-42).
    const payment = await ports.payment.initialize({ deliveryId: delivery.id, amountNaira: delivery.fare ?? 0, provider: 'paystack' });
    await ports.payment.verify(payment.reference);
    await ports.dispatch.assign(delivery.id, RIDER_ID);

    await login(ports, RIDER_PHONE);
    await ports.execution.pickup(delivery.id);
    await ports.execution.inTransit(delivery.id);
    expect((await ports.execution.reportFailure(delivery.id, 'wrong_address')).status).toBe('failed');

    await ports.execution.scheduleRedelivery(delivery.id);
    await ports.dispatch.assign(delivery.id, RIDER_ID);
    await ports.execution.pickup(delivery.id);
    await ports.execution.inTransit(delivery.id);
    expect((await ports.execution.reportFailure(delivery.id, 'refused')).status).toBe('returned');
  });
});

/**
 * SC-43 (mock-side fix): the backend never returns a rider from ON_TRIP to ONLINE when a job ends,
 * which locks the rider out of setStatus/toggle and any future assignment. The mock implements the
 * intended behaviour; these tests pin it.
 */
describe('rider release when a job ends', () => {
  const RIDER_2_PHONE = '08050000002';

  async function readyDelivery(ports: Ports) {
    const delivery = await ports.delivery.create(requestBody());
    const payment = await ports.payment.initialize({ deliveryId: delivery.id, amountNaira: delivery.fare ?? 0, provider: 'paystack' });
    await ports.payment.verify(payment.reference);
    await ports.dispatch.assign(delivery.id, RIDER_ID);
    return delivery;
  }

  it('frees the rider when their delivery is completed (and they can be assigned again)', async () => {
    // emptyAccount: no other seeded jobs, so the rider is free the moment this one ends.
    const ports = createMockAdapters({ latencyMs: 0, scenario: 'emptyAccount' });
    await login(ports, CUSTOMER_PHONE);
    const delivery = await readyDelivery(ports);

    await login(ports, RIDER_PHONE);
    await ports.execution.pickup(delivery.id);
    await ports.execution.inTransit(delivery.id);
    await ports.execution.complete(delivery.id, {
      photoUrl: 'file://pod.jpg',
      recipientOtp: RECIPIENT_CODE_FALLBACK,
      recipientName: 'Chinedu Obi',
      recipientPhone: '08060000001',
    });
    expect((await ports.rider.getProfile()).status).toBe('online');

    // …and dispatch can hand them the next job immediately.
    await login(ports, CUSTOMER_PHONE);
    const next = await readyDelivery(ports);
    expect((await ports.delivery.get(next.id)).riderId).toBe(RIDER_ID);
  });

  it('frees the rider when a job fails', async () => {
    const ports = createMockAdapters({ latencyMs: 0, scenario: 'emptyAccount' });
    await login(ports, CUSTOMER_PHONE);
    const delivery = await readyDelivery(ports);

    await login(ports, RIDER_PHONE);
    await ports.execution.pickup(delivery.id);
    await ports.execution.inTransit(delivery.id);
    await ports.execution.reportFailure(delivery.id, 'recipient_unavailable');
    expect((await ports.rider.getProfile()).status).toBe('online');
  });

  it('keeps a rider on a trip while another of their jobs is still active', async () => {
    // rider-2 has several active seeded jobs; ending one must not free them.
    const ports = createMockAdapters({ latencyMs: 0 });
    await login(ports, RIDER_2_PHONE);

    const mine = await ports.delivery.list();
    const failed = mine.find((d) => d.status === 'failed');
    expect(failed).toBeTruthy();

    await ports.execution.scheduleRedelivery(failed!.id);
    expect((await ports.rider.getProfile()).status).toBe('on_trip');
  });
});
