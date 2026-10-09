import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Dialog } from '@trustlink/shared';
import { DISPATCH_PHONE } from './dispatch';
import type { JobsStackParamList } from '../../navigation/types';

/**
 * Blocks accidental back-navigation while a job is mid-execution.
 * Confirming offers the dispatch line instead of silently abandoning the job.
 */
export function ExecutionExitGuard({ navigation, active }: {
  navigation: NativeStackNavigationProp<JobsStackParamList>;
  active: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (!active) return;
        e.preventDefault();
        setVisible(true);
      }),
    [navigation, active],
  );

  return (
    <Dialog
      visible={visible}
      title="Leave this job?"
      message="Your progress is saved — the job stays in progress and you can continue it from Jobs → Active."
      confirmLabel="Call dispatch"
      cancelLabel="Keep going"
      onCancel={() => setVisible(false)}
      onConfirm={() => {
        setVisible(false);
        Linking.openURL(`tel:${DISPATCH_PHONE}`).catch(() => undefined);
      }}
    />
  );
}
