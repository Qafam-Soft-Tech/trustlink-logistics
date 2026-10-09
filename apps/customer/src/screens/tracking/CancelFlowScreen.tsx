import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useTheme,
  Screen,
  TopBar,
  Center,
  Column,
  Row,
  Text,
  Button,
  Card,
  Banner,
  Dialog,
  Skeleton,
  TextArea,
  EmptyState,
  ErrorState,
  SuccessState,
  formatNaira,
  errorMessage,
} from '@trustlink/shared';
import { useCancelPreview, useCancelDelivery } from '../../hooks';
import type { RootStackParamList, TrackingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<TrackingStackParamList, 'CancelFlow'>;

function MoneyRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <Row justify="space-between" align="center">
      <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textSecondary }}>{label}</Text>
      <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{value}</Text>
    </Row>
  );
}

export function CancelFlowScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { deliveryId } = route.params;
  const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const preview = useCancelPreview(deliveryId);
  const cancel = useCancelDelivery();
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ fee: number; refundAmount: number } | null>(null);
  const [error, setError] = useState<string | undefined>();

  const done = () => root?.navigate('Main', { screen: 'Deliveries' });

  if (result) {
    return (
      <Screen>
        <Center style={{ flex: 1, padding: 24 }}>
          <SuccessState
            title="Cancellation confirmed"
            message={`Fee ${formatNaira(result.fee)} · Refund ${formatNaira(result.refundAmount)}`}
            actionLabel="Done"
            onAction={done}
          />
        </Center>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Cancel delivery" showBack onBack={() => navigation.goBack()} />

      {preview.isLoading ? (
        <Column gap="md" style={{ padding: 16 }}>
          <Skeleton height={96} />
          <Skeleton height={64} />
        </Column>
      ) : preview.isError || !preview.data ? (
        <Column style={{ padding: 16 }}>
          <ErrorState message="Couldn't check this delivery." onAction={() => preview.refetch()} />
        </Column>
      ) : !preview.data.canCancel ? (
        <Column style={{ padding: 16 }}>
          <EmptyState icon="🚫" title="Can't be cancelled" message={preview.data.reason} actionLabel="Back" onAction={() => navigation.goBack()} />
        </Column>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            <Banner variant="warning" title="Cancellation fee applies" message={preview.data.reason} />

            <Card>
              <Column gap="md">
                <MoneyRow label="Fare" value={formatNaira((preview.data.fee ?? 0) + (preview.data.refundAmount ?? 0))} />
                <MoneyRow label="Cancellation fee" value={formatNaira(preview.data.fee)} />
                <Row justify="space-between" align="center">
                  <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Refund</Text>
                  <Text variant="h4" color="inherit" style={{ color: theme.roles.primaryAction }}>{formatNaira(preview.data.refundAmount)}</Text>
                </Row>
              </Column>
            </Card>

            <TextArea
              label="Reason (optional)"
              value={reason}
              onChangeText={setReason}
              placeholder="Tell us why you're cancelling"
            />
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
              Fees follow the published cancellation table. The reason is kept for support follow-up.
            </Text>

            {error ? <Banner variant="error" message={error} /> : null}
          </ScrollView>

          <Column style={{ padding: 16 }}>
            <Button variant="destructive" size="lg" loading={cancel.isPending} onPress={() => setConfirming(true)}>
              Confirm cancellation
            </Button>
          </Column>
        </>
      )}

      <Dialog
        visible={confirming}
        title="Cancel this delivery?"
        message={`A fee of ${formatNaira(preview.data?.fee ?? 0)} applies. This can't be undone.`}
        confirmLabel="Cancel delivery"
        cancelLabel="Keep it"
        destructive
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          setError(undefined);
          cancel.mutate(deliveryId, {
            onSuccess: (r) => setResult({ fee: r.fee, refundAmount: r.refundAmount }),
            onError: (e: unknown) => setError(errorMessage(e, 'deliveries')),
          });
        }}
      />
    </Screen>
  );
}
