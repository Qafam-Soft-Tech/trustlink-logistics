import { describe, it, expect } from 'vitest';
import { createMockAdapters } from '../data/mock';
import { SCENARIOS, type ScenarioName } from '../data/mock/scenarios';
import { ConflictError } from '../data/http';
import { DEMO_OTP } from '../domain/constants';

const CUSTOMER_PHONE = '08031234567';
const RIDER_PHONE = '08050000001';
const RECIPIENT_CODE = '482913';

async function loginCustomer(ports: ReturnType<typeof createMockAdapters>) {
  await ports.auth.requestOtp({ phone: CUSTOMER_PHONE, purpose: 'login' });
  return ports.auth.verifyOtp({ phone: CUSTOMER_PHONE, code: DEMO_OTP, purpose: 'login' });
}
async function loginRider(ports: ReturnType<typeof createMockAdapters>) {
  await ports.auth.requestOtp({ phone: RIDER_PHONE, purpose: 'login' });
  return ports.auth.verifyOtp({ phone: RIDER_PHONE, code: DEMO_OTP, purpose: 'login' });
}

describe('mock scenarios', () => {
  it.each(SCENARIOS)('scenario "%s" loads and runs', async (name: ScenarioName) => {
    const ports = createMockAdapters({ latencyMs: 0, scenario: name });
    if (name === 'offline') {
      await expect(loginCustomer(ports)).rejects.toMatchObject({ name: 'OfflineError' });
      return;
    }
    if (name === 'serverError') {
      await expect(loginCustomer(ports)).rejects.toMatchObject({ name: 'ServerError' });
      return;
    }
    await loginCustomer(ports);
    const deliveries = await ports.delivery.list();
    if (name === 'emptyAccount') {
      expect(deliveries.length).toBe(0);
    } else {
      expect(deliveries.length).toBeGreaterThan(0);
    }
  });
});

describe('mock lifecycle engine', () => {
  it('full happy-path walk: assign → acknowledge → pickup → in transit → delivered', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await loginRider(ports);
    const queue = await ports.dispatch.myQueue();
    expect(queue.length).toBeGreaterThan(0);
    const d = queue[0];
    await ports.dispatch.acknowledge(d.id);
    await ports.execution.pickup(d.id);
    await ports.execution.inTransit(d.id);
    const delivered = await ports.execution.complete(d.id, {
      photoUrl: 'file://proof.jpg',
      recipientOtp: RECIPIENT_CODE,
      recipientName: 'Chinedu Obi',
      recipientPhone: '08060000001',
    });
    expect(delivered.status).toBe('delivered');
  });

  it('rejects an illegal transition (pickup from REQUESTED) with Conflict', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await loginRider(ports);
    const board = await ports.dispatch.board();
    const requested = board.find((x) => x.status === 'requested')!;
    await expect(ports.execution.pickup(requested.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects a wrong recipient code on completion', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await loginRider(ports);
    const queue = await ports.dispatch.myQueue();
    const d = queue[0];
    await ports.execution.pickup(d.id);
    await ports.execution.inTransit(d.id);
    await expect(
      ports.execution.complete(d.id, { photoUrl: 'file://x.jpg', recipientOtp: '000000', recipientName: 'X', recipientPhone: '08060000002' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('requires a session for track-by-number', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await expect(ports.delivery.track('TLK-2026-001')).rejects.toBeInstanceOf(ConflictError);
  });

  it('cancels a REQUESTED delivery for free', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await loginCustomer(ports);
    const list = await ports.delivery.list('requested');
    const preview = await ports.delivery.cancelPreview(list[0].id);
    expect(preview).toMatchObject({ canCancel: true, fee: 0 });
    const result = await ports.delivery.cancel(list[0].id);
    expect(result.cancelled).toBe(true);
  });

  it('payment success moves delivery REQUESTED → SEARCHING', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await loginCustomer(ports);
    const list = await ports.delivery.list('requested');
    const d = list[0];
    const init = await ports.payment.initialize({ deliveryId: d.id, amountNaira: d.fare ?? 1400, provider: 'paystack' });
    await ports.payment.verify(init.reference);
    const updated = await ports.delivery.get(d.id);
    expect(updated.status).toBe('searching');
  });

  it('paymentFails scenario leaves delivery in REQUESTED', async () => {
    const ports = createMockAdapters({ latencyMs: 0, scenario: 'paymentFails' });
    await loginCustomer(ports);
    const d = (await ports.delivery.list('requested'))[0];
    const init = await ports.payment.initialize({ deliveryId: d.id, amountNaira: 1400, provider: 'paystack' });
    const verify = await ports.payment.verify(init.reference);
    expect(verify.status).toBe('failed');
    expect((await ports.delivery.get(d.id)).status).toBe('requested');
  });

  it('admin scheduleRedelivery moves FAILED → SEARCHING', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await loginCustomer(ports);
    const failed = (await ports.delivery.list('failed'))[0];
    const updated = await ports.execution.scheduleRedelivery(failed.id);
    expect(updated.status).toBe('searching');
  });

  it('reportFailure increments counter and sets FAILED', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await loginRider(ports);
    const board = await ports.dispatch.board();
    const active = board.find((x) => x.riderId === 'rider-1' && (x.status === 'in_transit' || x.status === 'picked_up'));
    if (active) {
      const updated = await ports.execution.reportFailure(active.id, 'recipient_unavailable');
      expect(updated.redeliveryAttempts).toBeGreaterThanOrEqual(1);
      expect(['failed', 'returned']).toContain(updated.status);
    }
  });
});
