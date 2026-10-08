import React, { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, Center, Column, Text, Banner } from '@trustlink/shared';
import { usePaymentConfirmation } from '../../hooks/usePaymentConfirmation';
import type { NewDeliveryStackParamList } from '../../navigation/types';
import { useNewDeliveryDraft } from '../newdelivery/DraftContext';

type Props = NativeStackScreenProps<NewDeliveryStackParamList, 'Processing'>;

export function ProcessingScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { created } = useNewDeliveryDraft();
  const { deliveryId, reference } = route.params;
  const { state } = usePaymentConfirmation(reference, true);

  // Back is blocked while we confirm the payment.
  useEffect(() => navigation.addListener('beforeRemove', (e) => e.preventDefault()), [navigation]);

  useEffect(() => {
    if (state === 'success' || state === 'failed' || state === 'timeout') {
      navigation.replace('Result', { status: state, deliveryId, reference, trackingNumber: created?.trackingNumber });
    }
  }, [state, navigation, deliveryId, reference, created]);

  const label = state === 'pending' ? 'Still confirming with your provider…' : 'Confirming your payment…';

  return (
    <Screen>
      <Center style={{ flex: 1, padding: 24 }}>
        <Column gap="lg" align="center">
          <ActivityIndicator size="large" color={theme.roles.primaryAction} />
          <Text variant="h4" color="inherit" style={{ color: theme.roles.text, textAlign: 'center' }}>{label}</Text>
          <Banner variant="info" message="Please don't close the app while we confirm your payment." />
        </Column>
      </Center>
    </Screen>
  );
}
