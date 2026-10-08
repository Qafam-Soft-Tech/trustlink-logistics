import React, { useEffect, useState } from 'react';
import type { NavigationAction } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Dialog } from '@trustlink/shared';
import type { NewDeliveryStackParamList } from '../../navigation/types';
import { useNewDeliveryDraft } from './DraftContext';

/** The slice of navigation chrome the flow's shared shell needs. */
export type NewDeliveryNavigation = Pick<NativeStackNavigationProp<NewDeliveryStackParamList>, 'goBack' | 'addListener' | 'dispatch'>;

/**
 * Intercepts leaving the request modal while a draft has data, and asks whether to discard it.
 * Renders the confirmation dialog; otherwise invisible.
 */
export function DraftExitGuard({ navigation }: { navigation: NewDeliveryNavigation }) {
  const { dirty, reset } = useNewDeliveryDraft();
  const [pending, setPending] = useState<NavigationAction | null>(null);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (!dirty) return;
        e.preventDefault();
        setPending(e.data.action);
      }),
    [navigation, dirty],
  );

  return (
    <Dialog
      visible={Boolean(pending)}
      title="Discard request?"
      message="Your unsaved package details will be lost."
      confirmLabel="Discard"
      cancelLabel="Keep editing"
      destructive
      onCancel={() => setPending(null)}
      onConfirm={() => {
        const action = pending;
        setPending(null);
        reset();
        if (action) navigation.dispatch(action);
      }}
    />
  );
}
