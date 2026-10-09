/**
 * Central error → user-facing copy.
 * One voice for every failure state across the three apps (Phase 15).
 * Pure TS, unit-tested; no UI imports.
 */

export type ErrorContext =
  | 'generic'
  | 'deliveries'
  | 'tracking'
  | 'profile'
  | 'addresses'
  | 'issues'
  | 'notifications'
  | 'payment'
  | 'jobs'
  | 'auth';

export interface ErrorCopy {
  title: string;
  message: string;
  /** true when the device is offline — screens show the offline banner instead of an error block */
  offline: boolean;
}

const CONTEXT_SUBJECT: Record<ErrorContext, string> = {
  generic: 'this',
  deliveries: 'your deliveries',
  tracking: 'this delivery',
  profile: 'your profile',
  addresses: 'your addresses',
  issues: 'your issues',
  notifications: 'your alerts',
  payment: 'this payment',
  jobs: 'your jobs',
  auth: 'your account',
};

function errorName(error: unknown): string {
  return (error as { name?: string } | null)?.name ?? '';
}

function rawMessage(error: unknown): string | undefined {
  // Prefer the server-authored message (axios nests it under response.data.message).
  const fromResponse = (error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;
  if (typeof fromResponse === 'string' && fromResponse.trim()) return fromResponse.trim();
  const message = (error as { message?: string } | null)?.message;
  return typeof message === 'string' && message.trim() ? message.trim() : undefined;
}

/** Is this the mock/api offline error? (Replaces the repeated `name === 'OfflineError'` checks.) */
export function isOffline(error: unknown): boolean {
  return errorName(error) === 'OfflineError';
}

/**
 * Map any thrown value to consistent copy.
 * Server-authored messages (Conflict/Validation) are surfaced verbatim because they explain
 * a specific rule (for example “Recipient code does not match”).
 */
export function errorCopy(error: unknown, context: ErrorContext = 'generic'): ErrorCopy {
  const subject = CONTEXT_SUBJECT[context];
  const name = errorName(error);
  const message = rawMessage(error);

  switch (name) {
    case 'OfflineError':
      return {
        title: "You're offline",
        message: `We couldn't reach TrustLink. Check your connection and try again — ${subject} will still be here.`,
        offline: true,
      };
    case 'ServerError':
      return {
        title: 'TrustLink is having trouble',
        message: `Something went wrong on our side while loading ${subject}. Please try again in a moment.`,
        offline: false,
      };
    case 'NotFoundError':
      return {
        title: 'Not found',
        message: message ?? `We couldn't find ${subject}.`,
        offline: false,
      };
    case 'ValidationError':
      return {
        title: 'Check your details',
        message: message ?? 'Some of the details look wrong. Please review and try again.',
        offline: false,
      };
    case 'ConflictError':
      return {
        title: "We couldn't do that",
        message: message ?? `That action isn't possible for ${subject} right now.`,
        offline: false,
      };
    case 'NotSupportedByBackendError':
      return {
        title: 'Not available yet',
        message: `This action isn't supported yet for ${subject}. We\'re working on it.`,
        offline: false,
      };
    case 'TimeoutError':
      return {
        title: 'This is taking too long',
        message: `The request for ${subject} timed out. Please try again.`,
        offline: false,
      };
    default:
      return {
        title: 'Something went wrong',
        message: `We couldn't complete that for ${subject}. Please try again.`,
        offline: false,
      };
  }
}

/** Shorthand for the many `onError` handlers that just need a message string. */
export function errorMessage(error: unknown, context: ErrorContext = 'generic'): string {
  return errorCopy(error, context).message;
}

/** Copy for every empty list, in the same voice. */
export function emptyCopy(context: ErrorContext): { title: string; message: string } {
  switch (context) {
    case 'deliveries':
      return { title: 'No deliveries yet', message: 'Your deliveries will appear here once you send a package.' };
    case 'notifications':
      return { title: 'No alerts yet', message: 'Status updates for your deliveries will appear here.' };
    case 'issues':
      return { title: 'No issues yet', message: "Anything you report will show up here with its progress." };
    case 'addresses':
      return { title: 'No saved addresses', message: 'Add a pickup or drop-off address to speed up checkout.' };
    case 'jobs':
      return { title: 'No jobs yet', message: "Stay online — dispatch assigns jobs near you." };
    default:
      return { title: 'Nothing here yet', message: 'Check back after your next delivery.' };
  }
}
