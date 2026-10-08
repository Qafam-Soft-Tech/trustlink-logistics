import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { draftReducer, initialDraft, isDraftDirty, type DraftAction, type NewDeliveryDraft } from '@trustlink/shared';
import { useProfile } from '../../hooks';
import { takeNewDeliveryPrefill } from './prefill';

export interface CreatedDelivery {
  id: string;
  trackingNumber: string;
  fare: number;
}

interface DraftContextValue {
  draft: NewDeliveryDraft;
  dispatch: React.Dispatch<DraftAction>;
  dirty: boolean;
  /** delivery created at the fare step (REQUESTED) */
  created: CreatedDelivery | null;
  setCreated: (created: CreatedDelivery) => void;
  /** reference of the in-flight payment attempt */
  paymentReference: string | null;
  setPaymentReference: (reference: string | null) => void;
  reset: () => void;
}

const DraftContext = createContext<DraftContextValue | undefined>(undefined);

/**
 * Scoped reducer for the create-delivery request. Lives above the modal's stack so the
 * draft survives Back navigation between steps within the flow.
 */
export function NewDeliveryDraftProvider({ children }: { children: React.ReactNode }) {
  // A "Send again" prefill (if any) seeds the draft on mount.
  const [draft, dispatch] = useReducer(draftReducer, undefined, () => takeNewDeliveryPrefill() ?? initialDraft());
  const [created, setCreated] = useState<CreatedDelivery | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const profile = useProfile();
  const profileUser = profile.data;

  // Prefill the sender from the profile once, without clobbering later edits.
  useEffect(() => {
    if (!profileUser) return;
    if (draft.sender.name || draft.sender.phone) return;
    const name = `${profileUser.firstName ?? ''} ${profileUser.lastName ?? ''}`.trim();
    dispatch({ type: 'patchSender', patch: { name, phone: profileUser.phone } });
  }, [profileUser, draft.sender.name, draft.sender.phone]);

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
    setCreated(null);
    setPaymentReference(null);
  }, []);

  const value = useMemo<DraftContextValue>(
    () => ({ draft, dispatch, dirty: isDraftDirty(draft), created, setCreated, paymentReference, setPaymentReference, reset }),
    [draft, created, paymentReference, reset],
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useNewDeliveryDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useNewDeliveryDraft must be used within a NewDeliveryDraftProvider');
  return ctx;
}
