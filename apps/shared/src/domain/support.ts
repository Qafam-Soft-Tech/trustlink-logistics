/**
 * Support + notification helpers. Pure TS, unit-tested.
 * Issues and notifications are delivery-bound (FR-C09, FR-C14).
 */
import type { Issue, IssueStatus, IssueType, Notification } from './types';
import { deliveryStatusLabel } from './tracking';

export const ISSUE_TYPES: IssueType[] = ['delivery_issue', 'payment_issue', 'rider_issue', 'other'];

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  delivery_issue: 'Delivery',
  payment_issue: 'Payment',
  rider_issue: 'Rider',
  other: 'Other',
};

export const ISSUE_STATUSES: IssueStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export type IssueBadgeVariant = 'default' | 'info' | 'warning' | 'success';

export function issueTypeLabel(type: IssueType | string): string {
  return ISSUE_TYPE_LABELS[type as IssueType] ?? 'Other';
}

export function issueStatusLabel(status: IssueStatus | string): string {
  return ISSUE_STATUS_LABELS[status as IssueStatus] ?? String(status);
}

export function issueStatusVariant(status: IssueStatus | string): IssueBadgeVariant {
  switch (status) {
    case 'open':
      return 'warning';
    case 'in_progress':
      return 'info';
    case 'resolved':
      return 'success';
    default:
      return 'default';
  }
}

/** Terminal issue states need no further action from support. */
export function isIssueClosed(status: IssueStatus | string): boolean {
  return status === 'resolved' || status === 'closed';
}

/** Status carried by a delivery-bound notification (`data.status`). */
export function notificationStatus(notification: Notification): string {
  const data = notification.data as { status?: string } | null;
  return data?.status ?? '';
}

export function notificationStatusLabel(notification: Notification): string {
  const status = notificationStatus(notification);
  return status ? deliveryStatusLabel(status as never) : 'Update';
}

/** Push is deferred (SC-13): SMS notifications carry the fallback copy. */
export function notificationSmsFallback(notification: Notification): string | null {
  return notification.channel === 'sms' ? 'Also sent to your phone by SMS.' : null;
}

/** Group a notification list into Today / Earlier (local midnight boundary). */
export function groupNotificationsByDay(
  items: Notification[],
  nowMs: number = Date.now(),
): { today: Notification[]; earlier: Notification[] } {
  const startOfToday = new Date(nowMs);
  startOfToday.setHours(0, 0, 0, 0);
  const boundary = startOfToday.getTime();

  const today: Notification[] = [];
  const earlier: Notification[] = [];
  for (const item of items) {
    const at = Date.parse(item.createdAt);
    if (!Number.isNaN(at) && at >= boundary) today.push(item);
    else earlier.push(item);
  }
  return { today, earlier };
}

/** Issue types a customer can raise (rider issues are also customer-visible). */
export function issueSummary(issue: Issue): string {
  return `${issueTypeLabel(issue.type)} · ${issueStatusLabel(issue.status)}`;
}
