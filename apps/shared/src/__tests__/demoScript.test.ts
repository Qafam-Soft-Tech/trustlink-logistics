import { describe, it, expect } from 'vitest';
import { createMockAdapters } from '../data/mock';
import { DEMO_OTP } from '../domain/constants';
import { RECIPIENT_CODE_FALLBACK } from './demoConstants';

/**
 * The scripted investor demo, executed against the mock data layer.
 * This is the automated half of the Phase 17 script run: it proves the exact
 * customer → dispatch → rider sequence the presenter will perform by hand.
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
    const ports = createMockAdapters({ latencyMs: 0 });
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

    // Reassign to another online rider (the failed rider stays on_trip in the mock) and deliver.
    await ports.dispatch.assign(delivery.id, 'rider-3');
    await login(ports, '08050000003');
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
    const ports = createMockAdapters({ latencyMs: 0 });
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
    await ports.dispatch.assign(delivery.id, 'rider-3');
    await login(ports, '08050000003');
    await ports.execution.pickup(delivery.id);
    await ports.execution.inTransit(delivery.id);
    expect((await ports.execution.reportFailure(delivery.id, 'refused')).status).toBe('returned');
  });
});
