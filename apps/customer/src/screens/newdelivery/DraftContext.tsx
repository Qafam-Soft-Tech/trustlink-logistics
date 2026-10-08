import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { draftReducer, initialDraft, isDraftDirty, type DraftAction, type NewDeliveryDraft } from '@trustlink/shared';
import { useProfile } from '../../hooks';

interface DraftContextValue {
  draft: NewDeliveryDraft;
  dispatch: React.Dispatch<DraftAction>;
  dirty: boolean;
  reset: () => void;
}

const DraftContext = createContext<DraftContextValue | undefined>(undefined);

/**
 * Scoped reducer for the create-delivery request. Lives above the modal's stack so the
 * draft survives Back navigation between steps within the flow.
 */
export function NewDeliveryDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, dispatch] = useReducer(draftReducer, undefined, initialDraft);
  const profile = useProfile();
  const profileUser = profile.data;

  // Prefill the sender from the profile once, without clobbering later edits.
  useEffect(() => {
    if (!profileUser) return;
    if (draft.sender.name || draft.sender.phone) return;
    const name = `${profileUser.firstName ?? ''} ${profileUser.lastName ?? ''}`.trim();
    dispatch({ type: 'patchSender', patch: { name, phone: profileUser.phone } });
  }, [profileUser, draft.sender.name, draft.sender.phone]);

  const value = useMemo<DraftContextValue>(
    () => ({ draft, dispatch, dirty: isDraftDirty(draft), reset: () => dispatch({ type: 'reset' }) }),
    [draft],
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useNewDeliveryDraft(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useNewDeliveryDraft must be used within a NewDeliveryDraftProvider');
  return ctx;
}
