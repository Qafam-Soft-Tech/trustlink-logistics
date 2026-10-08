import React, { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, Screen, Center, Column, Row, Text, Button, Card, Banner } from '@trustlink/shared';
import { copyToClipboard } from '../../utils/clipboard';
import type { NewDeliveryStackParamList, RootStackParamList } from '../../navigation/types';
import { useNewDeliveryDraft } from '../newdelivery/DraftContext';

type Props = NativeStackScreenProps<NewDeliveryStackParamList, 'Result'>;

export function ResultScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { reset } = useNewDeliveryDraft();
  const { status, deliveryId, reference, trackingNumber } = route.params;
  const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const [copied, setCopied] = useState(false);

  // Successful request → clear the draft so the next request starts clean.
  useEffect(() => {
    if (status === 'success') reset();
  }, [status, reset]);

  const home = () => root?.navigate('Main');
  const track = () => {
    if (deliveryId) root?.replace('Tracking', { screen: 'TrackingHome', params: { deliveryId } });
  };

  if (status === 'success') {
    return (
      <Screen>
        <Center style={{ flex: 1, padding: 24 }}>
          <Column gap="lg" align="center" style={{ width: '100%' }}>
            <Text variant="h2" color="inherit" style={{ color: theme.colors.success }}>✓</Text>
            <Text variant="h3" color="inherit" style={{ color: theme.roles.text, textAlign: 'center' }}>Request confirmed</Text>
            <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textSecondary, textAlign: 'center' }}>
              Payment received. We're finding a rider for your package.
            </Text>

            <Card style={{ width: '100%' }}>
              <Column gap="md" align="center">
                <Text variant="label" color="inherit" style={{ color: theme.roles.textMuted }}>Tracking number</Text>
                <Text variant="h3" color="inherit" selectable style={{ color: theme.roles.primaryAction }}>{trackingNumber ?? '—'}</Text>
                <Button variant="outline" size="md" onPress={() => { if (trackingNumber) { copyToClipboard(trackingNumber); setCopied(true); } }}>
                  {copied ? 'Copied' : 'Copy tracking number'}
                </Button>
              </Column>
            </Card>
          </Column>
        </Center>

        <Column style={{ padding: 16, gap: 8 }}>
          <Button variant="primary" size="lg" onPress={track}>Track this delivery</Button>
          <Button variant="ghost" size="md" onPress={home}>Done</Button>
        </Column>
      </Screen>
    );
  }

  const copy = {
    failed: { title: 'Payment failed', message: 'Your card was declined. No charge was made — you can try another method.', action: 'Try again' },
    timeout: { title: "We couldn't confirm your payment", message: 'Your provider is still processing. Check again in a moment.', action: 'Check again' },
    cancelled: { title: 'Payment cancelled', message: 'No charge was made for this request.', action: 'Try again' },
  }[status as 'failed' | 'timeout' | 'cancelled'];

  const onAction = () => {
    if (status === 'timeout' && reference && deliveryId) {
      navigation.replace('Processing', { deliveryId, reference });
      return;
    }
    navigation.replace('PaySummary');
  };

  return (
    <Screen>
      <Center style={{ flex: 1, padding: 24 }}>
        <Column gap="lg" align="center" style={{ width: '100%' }}>
          <Text variant="h2" color="inherit" style={{ color: theme.colors.error }}>!</Text>
          <Text variant="h3" color="inherit" style={{ color: theme.roles.text, textAlign: 'center' }}>{copy.title}</Text>
          <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textSecondary, textAlign: 'center' }}>{copy.message}</Text>
          {deliveryId ? <Banner variant="info" message={`Request saved for later payment (${trackingNumber ?? deliveryId}).`} /> : null}
        </Column>
      </Center>

      <Column style={{ padding: 16, gap: 8 }}>
        <Button variant="primary" size="lg" onPress={onAction}>{copy.action}</Button>
        <Button variant="ghost" size="md" onPress={home}>Back to home</Button>
      </Column>
    </Screen>
  );
}
