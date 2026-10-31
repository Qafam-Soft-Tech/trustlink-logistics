import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useTheme,
  Screen,
  TopBar,
  Text,
  Button,
  Card,
  Column,
  Row,
  Banner,
  ErrorState,
  FareBreakdownCard,
  CheckoutSheet,
  formatNaira,
  type PaymentProvider,
  errorMessage,
} from '@trustlink/shared';
import { useFareQuote, useInitializePayment, useProfile } from '../../hooks';
import { useData } from '../../data/DataContext';
import type { NewDeliveryStackParamList } from '../../navigation/types';
import { useNewDeliveryDraft } from '../newdelivery/DraftContext';

type Props = NativeStackScreenProps<NewDeliveryStackParamList, 'PaySummary'>;

function Row2({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <Row justify="space-between" align="start" gap="md">
      <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{label}</Text>
      <Text variant="bodySmall" color="inherit" style={{ flex: 1, textAlign: 'right', color: theme.roles.text }}>{value}</Text>
    </Row>
  );
}

export function PaySummaryScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { draft, created, setPaymentReference } = useNewDeliveryDraft();
  const data = useData();
  const quote = useFareQuote({
    pickupArea: draft.pickup.area,
    dropoffArea: draft.dropoff.area,
    weightKg: draft.packageWeight,
    packageType: draft.packageType,
  });
  const profile = useProfile();
  const initialize = useInitializePayment();
  const [provider, setProvider] = useState<PaymentProvider>('paystack');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (!created) {
    return (
      <Screen>
        <TopBar title="Payment" showBack onBack={() => navigation.goBack()} />
        <Column style={{ flex: 1, padding: 16 }}>
          <ErrorState title="Request not found" message="Start the request again to pay for it." actionLabel="Back to fare" onAction={() => navigation.replace('Fare')} />
        </Column>
      </Screen>
    );
  }

  const amount = created.fare || quote.data?.totalFare || 0;

  const pay = async () => {
    setError(undefined);
    try {
      const result = await initialize.mutateAsync({
        deliveryId: created.id,
        amountNaira: amount,
        provider,
        email: profile.data?.email ?? undefined,
        phone: profile.data?.phone,
      });

      setPaymentReference(result.reference);
      setSheetOpen(false);

      const isMockCheckout = !result.authorizationUrl || result.authorizationUrl.includes('/mock/');
      if (data.source === 'api' && result.authorizationUrl && !isMockCheckout) {
        await WebBrowser.openBrowserAsync(result.authorizationUrl, { showInRecents: true });
      }

      navigation.navigate('Processing', { deliveryId: created.id, reference: result.reference });
    } catch (e) {
      setError(errorMessage(e, 'payment'));
      setSheetOpen(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Payment" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Column gap="md">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{created.trackingNumber}</Text>
            <Row2 label="Pickup" value={`${draft.pickup.label} · ${draft.pickup.street}, ${draft.pickup.area}`} />
            <Row2 label="Drop-off" value={`${draft.dropoff.label} · ${draft.dropoff.street}, ${draft.dropoff.area}`} />
            <Row2 label="Package" value={`${draft.packageType === 'document' ? 'Document' : 'Parcel'} · up to ${draft.packageWeight} kg`} />
            <Row2 label="Recipient" value={`${draft.recipient.name} · ${draft.recipient.phone}`} />
          </Column>
        </Card>

        {quote.data ? <FareBreakdownCard breakdown={quote.data} /> : null}

        {data.source === 'mock' ? (
          <Banner variant="warning" title="Test mode" message="No real payment is taken. Card and Bank transfer are simulated." />
        ) : (
          <Banner variant="info" title="Secure checkout" message="You'll complete payment in Paystack, then return here for confirmation." />
        )}
        {error ? <Banner variant="error" message={error} /> : null}
      </ScrollView>

      <Column style={{ padding: 16 }}>
        <Button variant="primary" size="lg" disabled={initialize.isPending} onPress={() => setSheetOpen(true)}>
          {`Pay ${formatNaira(amount)}`}
        </Button>
      </Column>

      <CheckoutSheet
        visible={sheetOpen}
        amount={amount}
        provider={provider}
        onProviderChange={setProvider}
        onPay={pay}
        busy={initialize.isPending}
        onClose={() => {
          setSheetOpen(false);
          navigation.navigate('Result', { status: 'cancelled', deliveryId: created.id, trackingNumber: created.trackingNumber });
        }}
      />
    </Screen>
  );
}
