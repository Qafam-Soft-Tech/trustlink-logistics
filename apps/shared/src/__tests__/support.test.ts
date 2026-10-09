import { describe, it, expect } from 'vitest';
import { createMockAdapters } from '../data/mock';
import { DEMO_OTP } from '../domain/constants';
import {
  ISSUE_STATUSES,
  groupNotificationsByDay,
  isIssueClosed,
  issueStatusLabel,
  issueStatusVariant,
  issueSummary,
  issueTypeLabel,
  notificationSmsFallback,
  notificationStatus,
  notificationStatusLabel,
} from '../domain/support';
import type { Notification } from '../domain/types';

const CUSTOMER_PHONE = '08031234567';

async function login(ports: ReturnType<typeof createMockAdapters>) {
  await ports.auth.requestOtp({ phone: CUSTOMER_PHONE, purpose: 'login' });
  return ports.auth.verifyOtp({ phone: CUSTOMER_PHONE, code: DEMO_OTP, purpose: 'login' });
}

function notification(partial: Partial<Notification>): Notification {
  return {
    id: 'n-1',
    deliveryId: 'del-001',
    userId: 'cust-amina',
    channel: 'push',
    title: 'Delivered',
    body: 'Your package has been delivered successfully.',
    data: { deliveryId: 'del-001', status: 'delivered' },
    status: 'sent',
    createdAt: '2026-10-07T09:00:00.000Z',
    ...partial,
  };
}

describe('support copy', () => {
  it('labels issue types, statuses and badge variants', () => {
    expect(issueTypeLabel('delivery_issue')).toBe('Delivery');
    expect(issueTypeLabel('payment_issue')).toBe('Payment');
    expect(issueTypeLabel('rider_issue')).toBe('Rider');
    expect(issueTypeLabel('other')).toBe('Other');
    expect(issueTypeLabel('mystery')).toBe('Other');

    expect(ISSUE_STATUSES).toEqual(['open', 'in_progress', 'resolved', 'closed']);
    expect(issueStatusLabel('in_progress')).toBe('In progress');
    expect(issueStatusVariant('open')).toBe('warning');
    expect(issueStatusVariant('in_progress')).toBe('info');
    expect(issueStatusVariant('resolved')).toBe('success');
    expect(issueStatusVariant('closed')).toBe('default');
    expect(isIssueClosed('resolved')).toBe(true);
    expect(isIssueClosed('open')).toBe(false);
  });

  it('reads the delivery status carried by a notification and the SMS fallback copy', () => {
    const n = notification({});
    expect(notificationStatus(n)).toBe('delivered');
    expect(notificationStatusLabel(n)).toBe('Delivered');
    expect(notificationSmsFallback(n)).toBeNull();
    expect(notificationSmsFallback(notification({ channel: 'sms' }))).toMatch(/SMS/);
    expect(notificationStatus(notification({ data: null }))).toBe('');
  });

  it('groups notifications into Today and Earlier around local midnight', () => {
    const now = Date.parse('2026-10-07T12:00:00.000Z');
    const today = notification({ id: 'n-today', createdAt: '2026-10-07T01:00:00.000Z' });
    const yesterday = notification({ id: 'n-old', createdAt: '2026-09-14T09:00:00.000Z' });
    const broken = notification({ id: 'n-bad', createdAt: 'not-a-date' });

    const grouped = groupNotificationsByDay([today, yesterday, broken], now);
    expect(grouped.today.map((n) => n.id)).toContain('n-today');
    expect(grouped.earlier.map((n) => n.id)).toEqual(['n-old', 'n-bad']);
  });

  it('summarises an issue for list rows', () => {
    expect(issueSummary({ type: 'payment_issue', status: 'resolved' } as never)).toBe('Payment · Resolved');
  });
});

describe('mock support data', () => {
  it('serves 6 issues spanning the whole lifecycle', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await login(ports);

    const issues = await ports.issue.listMine();
    expect(issues.length).toBe(6);
    const statuses = new Set(issues.map((i) => i.status));
    expect(statuses).toEqual(new Set(['open', 'in_progress', 'resolved', 'closed']));

    const resolved = issues.find((i) => i.status === 'resolved');
    expect(resolved?.resolution).toBeTruthy();

    const one = await ports.issue.get(issues[0].id);
    expect(one.id).toBe(issues[0].id);

    const filtered = await ports.issue.listMine('open');
    expect(filtered.every((i) => i.status === 'open')).toBe(true);
  });

  it('creates a new issue for one of the customer own deliveries', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await login(ports);
    const deliveries = await ports.delivery.list();

    const created = await ports.issue.create({
      deliveryId: deliveries[0].id,
      type: 'delivery_issue',
      priority: 'medium',
      title: 'Left at the gate',
      description: 'The rider left the package with the security post.',
    });
    expect(created.status).toBe('open');
    expect(created.reporterId).toBe('cust-amina');

    const mine = await ports.issue.listMine();
    expect(mine.length).toBe(7);
  });

  it('rejects an issue for a delivery the customer does not own', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await login(ports);
    await expect(
      ports.issue.create({ deliveryId: 'del-does-not-exist', type: 'other', priority: 'low', title: 'x', description: 'y' }),
    ).rejects.toMatchObject({ name: 'NotFoundError' });
  });

  it('serves the 12 notifications, three of them dated today', async () => {
    const ports = createMockAdapters({ latencyMs: 0 });
    await login(ports);
    const notifications = await ports.notification.list(30);
    expect(notifications.length).toBe(12);
    const { today, earlier } = groupNotificationsByDay(notifications);
    expect(today.length).toBe(3);
    expect(earlier.length).toBe(9);
  });
});
