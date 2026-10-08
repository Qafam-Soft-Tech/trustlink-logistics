import type { NewDeliveryDraft } from '@trustlink/shared';

/**
 * Hands a pre-built draft ("Send again") to the request modal, which is mounted lazily.
 * The provider consumes it once on mount.
 */
let pending: NewDeliveryDraft | null = null;

export function setNewDeliveryPrefill(draft: NewDeliveryDraft): void {
  pending = draft;
}

export function takeNewDeliveryPrefill(): NewDeliveryDraft | null {
  const draft = pending;
  pending = null;
  return draft;
}
