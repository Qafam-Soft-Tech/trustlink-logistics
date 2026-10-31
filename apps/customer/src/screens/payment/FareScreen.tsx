import React from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useTheme,
  Screen,
  TopBar,
  Text,
  Button,
  Column,
  Banner,
  Skeleton,
  ErrorState,
  RouteSummaryCard,
  FareBreakdownCard,
  formatNaira,
  toCreateDeliveryInput,
  estimateEtaMinutes,
  QUOTE_TTL_SECONDS,
  errorMessage,
} from '@trustlink/shared';
import { useDistanceEstimate, useFareQuote, useCreateDelivery } from '../../hooks';
import { useCountdown } from '../../hooks/useCountdown';
import type { NewDeliveryStackParamList } from '../../navigation/types';
import { useNewDeliveryDraft } from '../newdelivery/DraftContext';

type Props = NativeStackScreenProps<NewDeliveryStackParamList, 'Fare'>;

export function FareScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { draft, created, setCreated } = useNewDeliveryDraft();
  const distance = useDistanceEstimate(draft.pickup.area, draft.dropoff.area);
  const quote = useFareQuote({
    pickupArea: draft.pickup.area,
    dropoffArea: draft.dropoff.area,
    weightKg: draft.packageWeight,
    packageType: draft.packageType,
  });
  const create = useCreateDelivery();

  const total = quote.data?.totalFare ?? 0;
  const remaining = useCountdown(QUOTE_TTL_SECONDS, Boolean(quote.data), quote.dataUpdatedAt);
  const expired = Boolean(quote.data) && remaining === 0;
  const loading = distance.isLoading || quote.isLoading;
  const failed = distance.isError || quote.isError;

  const refresh = () => {
    if (distance.isError) distance.refetch();
    quote.refetch();
  };

  const accept = () => {
    create.mutate(toCreateDeliveryInput(draft), {
      onSuccess: (delivery) => {
        const serverFare = Number(delivery.fare);
        setCreated({
          id: delivery.id,
          trackingNumber: delivery.trackingNumber,
          fare: Number.isFinite(serverFare) && serverFare > 0 ? serverFare : total,
        });
        navigation.navigate('PaySummary');
      },
    });
  };

  return (
    <Screen>
      <TopBar title="Fare" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {loading ? (
          <Column gap="sm"><Skeleton height={96} /><Skeleton height={160} /></Column>
        ) : failed ? (
          <ErrorState message="Couldn't get a fare right now." onAction={refresh} />
        ) : (
          <>
            {expired ? (
              <Banner variant="warning" title="Quote expired" message="Fares change with distance and demand. Refresh to get the current price." />
            ) : (
              <Banner variant="info" title="How it works" message="No rider is assigned until your payment is confirmed." />
            )}

            <RouteSummaryCard
              pickupArea={`${draft.pickup.label} · ${draft.pickup.area}`}
              dropoffArea={`${draft.dropoff.label} · ${draft.dropoff.area}`}
              distanceKm={distance.data}
              etaMinutes={distance.data ? estimateEtaMinutes(distance.data) : undefined}
            />

            {quote.data ? <FareBreakdownCard breakdown={quote.data} /> : null}

            {!expired ? (
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted, textAlign: 'center' }}>
                Quote valid for {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
              </Text>
            ) : null}
          </>
        )}

        {create.isError ? <Banner variant="error" message={errorMessage(create.error, 'payment')} /> : null}
      </ScrollView>

      {created ? (
        <Column style={{ padding: 16 }}>
          <Button variant="primary" size="lg" onPress={() => navigation.navigate('PaySummary')}>
            Continue to payment ({created.trackingNumber})
          </Button>
        </Column>
      ) : (
        <Column style={{ padding: 16 }}>
          <Button
            variant="primary"
            size="lg"
            loading={create.isPending}
            disabled={loading || failed || expired}
            onPress={accept}
          >
            {`Accept fare · ${formatNaira(total)}`}
          </Button>
        </Column>
      )}
    </Screen>
  );
}
