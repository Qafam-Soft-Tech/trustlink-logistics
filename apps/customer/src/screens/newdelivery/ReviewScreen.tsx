import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Button, Banner, Card, Column, Row, Text, toCreateDeliveryInput } from '@trustlink/shared';
import { useDeliveries } from '../../hooks';
import type { NewDeliveryStackParamList } from '../../navigation/types';
import { useNewDeliveryDraft } from './DraftContext';
import { StepScreen } from './StepScreen';

type Props = NativeStackScreenProps<NewDeliveryStackParamList, 'Review'>;

function SummaryRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <Row justify="space-between" align="start" gap="md">
      <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{label}</Text>
      <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text, flex: 1, textAlign: 'right' }}>{value}</Text>
    </Row>
  );
}

export function ReviewScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { draft } = useNewDeliveryDraft();
  const deliveries = useDeliveries();
  const [showOffline, setShowOffline] = useState(false);

  const offline = (deliveries.error as Error | null)?.name === 'OfflineError';
  const payload = toCreateDeliveryInput(draft);

  const onContinue = () => {
    if (offline) {
      setShowOffline(true);
      return;
    }
    navigation.navigate('Fare');
  };

  return (
    <StepScreen
      title="Review"
      step={4}
      navigation={navigation}
      footer={
        <Column style={{ padding: 16, gap: 8 }}>
          <Button variant="primary" size="lg" onPress={onContinue}>Confirm & see fare</Button>
        </Column>
      }
    >
      {showOffline || offline ? (
        <Banner variant="offline" title="You're offline" message="Your request is saved on this device. Try again when you're back online." />
      ) : null}

      <Card>
        <Column gap="md">
          <Row justify="space-between" align="center">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Route</Text>
            <Button variant="ghost" size="sm" onPress={() => navigation.navigate('Pickup')}>Edit</Button>
          </Row>
          <SummaryRow label="Pickup" value={`${draft.pickup.label} · ${draft.pickup.street}, ${draft.pickup.area}`} />
          <SummaryRow label="Drop-off" value={`${draft.dropoff.label} · ${draft.dropoff.street}, ${draft.dropoff.area}`} />
          <SummaryRow label="Recipient" value={`${draft.recipient.name} · ${draft.recipient.phone}`} />
        </Column>
      </Card>

      <Card>
        <Column gap="md">
          <Row justify="space-between" align="center">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Package</Text>
            <Button variant="ghost" size="sm" onPress={() => navigation.navigate('Package')}>Edit</Button>
          </Row>
          <SummaryRow label="Type" value={draft.packageType === 'document' ? 'Document' : 'Parcel'} />
          <SummaryRow label="Weight" value={`up to ${draft.packageWeight} kg`} />
          <SummaryRow label="Description" value={draft.packageDescription.trim() || '—'} />
        </Column>
      </Card>

      <Card>
        <Column gap="md">
          <Row justify="space-between" align="center">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Sender</Text>
            <Button variant="ghost" size="sm" onPress={() => navigation.navigate('Sender')}>Edit</Button>
          </Row>
          <SummaryRow label="Name" value={draft.sender.name} />
          <SummaryRow label="Phone" value={draft.sender.phone} />
        </Column>
      </Card>

      {__DEV__ ? (
        <Card>
          <Column gap="xs">
            <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>CreateDeliveryDto (dev)</Text>
            <Text variant="caption" color="inherit" selectable style={{ color: theme.roles.textMuted }}>
              {JSON.stringify(payload, null, 2)}
            </Text>
          </Column>
        </Card>
      ) : null}
    </StepScreen>
  );
}
