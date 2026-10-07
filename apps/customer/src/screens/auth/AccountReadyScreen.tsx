import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, SuccessState } from '@trustlink/shared';
import { useSession } from '../../session/SessionContext';
import type { RootStackParamList } from '../../navigation/types';

export function AccountReadyScreen() {
  const { session } = useSession();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const name = `${session?.user.firstName ?? ''} ${session?.user.lastName ?? ''}`.trim();

  return (
    <Screen>
      <SuccessState
        title={`Welcome${name ? `, ${name}` : ''}`}
        message="Your TrustLink account is ready."
        actionLabel="Get started"
        onAction={() => rootNav.replace('Main')}
      />
    </Screen>
  );
}
