import { describe, it, expect } from 'vitest';
import { createMockAdapters } from '../data/mock';
import { DEMO_OTP } from '../domain/constants';
import { receiptText, receiptMailto, receiptHtml } from '../domain/receipt';
import { failureReasonCopy, isRedeliveryScheduled, terminalScreenFor, REDELIVERY_NOTICE } from '../domain/tracking';
import { draftFromDelivery, toCreateDeliveryInput, weightOptionFor } from '../domain/newDelivery';
import type { Delivery } from '../domain/types';

const CUSTOMER_PHONE = '08031234567';

function base(partial: Partial<Delivery>): Delivery {
  return {
    id: 'del-x',
    trackingNumber: 'TLK-2026-014',
    customerId: 'cust-amina',
    riderId: null,
    pickupStreet: '12 Aminu Kano Crescent',
    pickupArea: 'Wuse 2',
    dropoffStreet: 'Plot 447 Constitution Avenue',
    dropoffArea: 'CBD',
    packageType: 'parcel',
    packageWeight: 5,
    packageDescription: 'Personal effects',
    senderName: 'Amina Bello',
    senderPhone: CUSTOMER_PHONE,
    recipientName: 'Chinedu Obi',
    recipientPhone: '08060000001',
    status: 'delivered',
    redeliveryAttempts: 0,
    fare: 1400,
    paymentReference: 'TLK_PS_000014',
    createdAt: '2026-09-14T09:00:00.000Z',
    ...partial,
  };
}

describe('terminal-state copy', () => {
  it('maps failure reasons to calm copy with a fallback', () => {
    expect(failureReasonCopy('recipient_unavailable')).toMatch(/wasn\u2019t available/);
    expect(failureReasonCopy('wrong_address')).toMatch(/couldn\u2019t locate/);
    expect(failureReasonCopy('refused')).toMatch(/declined/);
    expect(failureReasonCopy('something_else')).toMatch(/couldn\u2019t be completed/);
    expect(failureReasonCopy(null)).toMatch(/couldn\u2019t be completed/);
    expect(REDELIVERY_NOTICE).toMatch(/one redelivery/i);
  });

  it('detects a redelivery-scheduled delivery (SEARCHING with a used attempt)', () => {
    expect(isRedeliveryScheduled(base({ status: 'searching', redeliveryAttempts: 1 }))).toBe(true);
    expect(isRedeliveryScheduled(base({ status: 'searching', redeliveryAttempts: 0 }))).toBe(false);
    expect(isRedeliveryScheduled(base({ status: 'assigned', redeliveryAttempts: 1 }))).toBe(false);
  });

  it('routes each terminal status to its screen', () => {
    expect(terminalScreenFor('delivered')).toBe('Pod');
    expect(terminalScreenFor('failed')).toBe('Failed');
    expect(terminalScreenFor('returned')).toBe('Returned');
    expect(terminalScreenFor('cancelled')).toBe('Cancelled');
  });
});

describe('receipt', () => {
  it('includes the paid fare, route and POD details', () => {
    const text = receiptText(base({}), {
      id: 'pod-1',
      deliveryId: 'del-x',
      photoUrl: 'file://pod.jpg',
      recipientOtp: '482913',
      recipientName: 'Chinedu Obi',
      recipientPhone: '08060000001',
      createdAt: '2026-09-14T11:30:00.000Z',
    });
    expect(text).toContain('TLK-2026-014');
    expect(text).toContain('\u20A61,400');
    expect(text).toContain('Wuse 2');
    expect(text).toContain('Chinedu Obi');
    expect(text).toContain('TLK_PS_000014');
  });

  it('omits the delivery line when there is no POD', () => {
    const text = receiptText(base({ status: 'cancelled' }), null);
    expect(text).not.toContain('Delivered to');
    expect(text).toContain('Cancelled');
  });

  it('builds a mailto: URL that carries the receipt (email handoff, no server)', () => {
    const url = receiptMailto(base({}), null, 'amina.bello@example.com');
    expect(url.startsWith('mailto:amina.bello%40example.com?')).toBe(true);
    expect(url).toContain('subject=TrustLink%20receipt');
    expect(decodeURIComponent(url)).toContain('\u20A61,400');

    const noTo = receiptMailto(base({}), null);
    expect(noTo.startsWith('mailto:?subject=')).toBe(true);
  });

  it('renders a themed HTML receipt for PDF export, escaping values', () => {
    const colors = { brand: 'navy', text: 'black', muted: 'grey' };
    const html = receiptHtml(base({}), null, colors);
    expect(html).toContain('TrustLink Logistics');
    expect(html).toContain('TLK-2026-014');
    expect(html).toContain('\u20A61,400');
    expect(html).not.toContain('<img');

    const withPhoto = receiptHtml(
      base({}),
      {
        id: 'pod-1',
        deliveryId: 'del-x',
        photoUrl: 'https://cdn.example.com/pod.jpg',
        recipientOtp: '482913',
        recipientName: 'Chinedu <Obi>',
        recipientPhone: '08060000001',
        createdAt: '2026-09-14T11:30:00.000Z',
      },
      colors,
    );
    expect(withPhoto).toContain('<img src="https://cdn.example.com/pod.jpg"');
    expect(withPhoto).toContain('Chinedu &lt;Obi&gt;');

    // local/demo file URIs are never embedded as images
    const filePod = receiptHtml(base({}), { photoUrl: 'file://pod.jpg', recipientName: 'Chinedu' } as never, colors);
    expect(filePod).not.toContain('<img');
  });
});

describe('send again', () => {
  it('builds a draft that round-trips through the DTO with a snapped weight chip', () => {
    expect(weightOptionFor(0.5)).toBe(1);
    expect(weightOptionFor(2)).toBe(5);
    expect(weightOptionFor(30)).toBe(25);

    const draft = draftFromDelivery(base({}));
    expect(draft.pickup.area).toBe('Wuse 2');
    expect(draft.dropoff.area).toBe('CBD');
    expect(draft.recipient.name).toBe('Chinedu Obi');
    expect(draft.packageWeight).toBe(5);
    expect(draft.packageDescription).toBe('Personal effects');

    const input = toCreateDeliveryInput(draft);
    expect(input.pickupStreet).toBe('12 Aminu Kano Crescent');
    expect(input.recipientPhone).toBe('08060000001');
  });
});

describe('mock terminal history', () => {
  it('seeds a POD for every delivered fixture and none for other statuses', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await ports.auth.requestOtp({ phone: CUSTOMER_PHONE, purpose: 'login' });
    await ports.auth.verifyOtp({ phone: CUSTOMER_PHONE, code: DEMO_OTP, purpose: 'login' });

    const all = await ports.delivery.list();
    const delivered = all.filter((d) => d.status === 'delivered');
    expect(delivered.length).toBeGreaterThan(0);

    for (const d of delivered) {
      const pod = await ports.delivery.proof(d.id);
      expect(pod?.recipientName).toBe(d.recipientName);
    }

    const notDelivered = all.find((d) => d.status === 'failed');
    expect(notDelivered).toBeTruthy();
    if (notDelivered) expect(await ports.delivery.proof(notDelivered.id)).toBeNull();
  });

  it('has history across every status', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await ports.auth.requestOtp({ phone: CUSTOMER_PHONE, purpose: 'login' });
    await ports.auth.verifyOtp({ phone: CUSTOMER_PHONE, code: DEMO_OTP, purpose: 'login' });
    const statuses = new Set((await ports.delivery.list()).map((d) => d.status));
    for (const s of ['requested', 'searching', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned', 'cancelled']) {
      expect(statuses.has(s as never)).toBe(true);
    }
  });
});
