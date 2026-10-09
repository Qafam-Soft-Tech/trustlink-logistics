import React from 'react';
import { Linking, ScrollView, Share } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  useTheme,
  Screen,
  TopBar,
  Text,
  Button,
  Card,
  Column,
  Row,
  Divider,
  Banner,
  Badge,
  Avatar,
  Skeleton,
  EmptyState,
  ErrorState,
  StatusBadge,
  StatusTimeline,
  RouteSummaryCard,
  formatNaira,
  estimateDistanceKm,
  estimateEtaMinutes,
  isAssigningDelayed,
  isRedeliveryScheduled,
  trackingHeadline,
  trackingShareText,
  wasReassigned,
  RECIPIENT_CODE_NOTE,
  REDELIVERY_NOTICE,
  type VehicleType,
} from '@trustlink/shared';
import { isOffline } from '@trustlink/shared';
import { useDelivery, useCancelPreview } from '../../hooks';
import { useLastUpdated } from '../../hooks/useLastUpdated';
import type { RootStackParamList, TrackingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<TrackingStackParamList, 'TrackingHome'>;

const RIDER_STATUSES = ['assigned', 'picked_up', 'in_transit'];
const STALE_SECONDS = 30;

const VEHICLE_LABEL: Record<VehicleType, string> = { motorcycle: 'Motorcycle', van: 'Van', truck: 'Truck' };

export function TrackingHomeScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const deliveryId = route.params?.deliveryId;
  const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useDelivery(deliveryId);
  const preview = useCancelPreview(deliveryId);
  const secondsAgo = useLastUpdated(dataUpdatedAt);

  const back = () => root?.navigate('Main', { screen: 'Deliveries' });

  if (!deliveryId) {
    return (
      <Screen>
        <TopBar title="Tracking" showBack onBack={() => navigation.goBack()} />
        <EmptyState title="Nothing to track" message="Open a delivery from your list to see its status." actionLabel="Go to deliveries" onAction={back} />
      </Screen>
    );
  }

  if (isLoading) {
    return (
      <Screen>
        <TopBar title="Tracking" showBack onBack={() => navigation.goBack()} />
        <Column gap="md" style={{ padding: 16 }}>
          <Skeleton height={84} />
          <Skeleton height={96} />
          <Skeleton height={140} />
        </Column>
      </Screen>
    );
  }

  if (isError || !data) {
    const notFound = (error as Error | null)?.name === 'NotFoundError';
    return (
      <Screen>
        <TopBar title="Tracking" showBack onBack={() => navigation.goBack()} />
        <Column style={{ padding: 16 }}>
          {notFound ? (
            <EmptyState icon="🔎" title="Delivery not found" message="We couldn't find that delivery." actionLabel="Go to deliveries" onAction={back} />
          ) : (
            <ErrorState message="Couldn't load this delivery." onAction={() => refetch()} />
          )}
        </Column>
      </Screen>
    );
  }

  const headline = trackingHeadline(data.status);
  const offline = isOffline(error);
  const stale = secondsAgo > STALE_SECONDS;
  const delayed = isAssigningDelayed(data);
  const reassigned = wasReassigned(data);
  const redelivery = isRedeliveryScheduled(data);
  const distanceKm = estimateDistanceKm(data.pickupArea, data.dropoffArea);
  const showRider = Boolean(data.rider) && RIDER_STATUSES.includes(data.status);
  const canCancel = Boolean(preview.data?.canCancel);

  const share = () => {
    Share.share({ message: trackingShareText(data) }).catch(() => undefined);
  };

  const callRider = () => {
    const phone = data.rider?.phone;
    if (phone) Linking.openURL(`tel:${phone}`).catch(() => undefined);
  };

  return (
    <Screen>
      <TopBar
        title="Tracking"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={<Ionicons name="share-social-outline" size={22} color={theme.roles.primaryAction} />}
        onRightPress={share}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Row justify="space-between" align="center">
          <Text variant="caption" color="inherit" style={{ color: stale ? theme.colors.warning : theme.roles.textMuted }}>
            {secondsAgo <= 2 ? 'Updated just now' : stale ? `Last updated ${secondsAgo}s ago — reconnecting…` : `Updated ${secondsAgo}s ago`}
          </Text>
          <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{data.trackingNumber}</Text>
        </Row>

        <Column gap="sm">
          <Text variant="h1" color="inherit" style={{ color: theme.roles.text }}>{headline.title}</Text>
          <Text variant="body" color="inherit" style={{ color: theme.roles.textSecondary }}>{headline.message}</Text>
          <Row gap="sm" align="center">
            <StatusBadge status={data.status} />
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Fare {formatNaira(data.fare ?? 0)}</Text>
          </Row>
        </Column>

        {offline ? <Banner variant="offline" message="You're offline. Showing the last known status." /> : null}

        {delayed ? (
          <Banner
            variant="warning"
            title="Still assigning"
            message="Dispatch is taking longer than usual. You can keep waiting or cancel free of charge."
          />
        ) : null}

        {reassigned ? <Banner variant="info" title="Rider reassigned" message="Dispatch assigned a different rider to your delivery." /> : null}

        {redelivery ? <Banner variant="info" title="Redelivery scheduled" message={REDELIVERY_NOTICE} /> : null}

        {showRider && data.rider ? (
          <Card>
            <Column gap="md">
              <Row gap="md" align="center">
                <Avatar size="lg" name={`${data.rider.firstName ?? ''} ${data.rider.lastName ?? ''}`.trim() || 'Rider'} />
                <Column gap="xs" style={{ flex: 1 }}>
                  <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>
                    {`${data.rider.firstName ?? ''} ${data.rider.lastName ?? ''}`.trim() || 'Your rider'}
                  </Text>
                  {data.riderVehicleType ? (
                    <Badge variant="primary">{VEHICLE_LABEL[data.riderVehicleType]}</Badge>
                  ) : (
                    <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Vehicle details unavailable</Text>
                  )}
                </Column>
              </Row>
              <Button variant="outline" size="md" onPress={callRider} disabled={!data.rider.phone}>Call rider</Button>
            </Column>
          </Card>
        ) : null}

        {data.recipientCode && RIDER_STATUSES.includes(data.status) ? (
          <Card>
            <Column gap="sm" align="center">
              <Text variant="label" color="inherit" style={{ color: theme.roles.textMuted }}>Recipient code</Text>
              <Text variant="h2" color="inherit" selectable style={{ color: theme.roles.primaryAction }}>{data.recipientCode}</Text>
              <Text variant="caption" color="inherit" style={{ textAlign: 'center', color: theme.roles.textSecondary }}>{RECIPIENT_CODE_NOTE}</Text>
            </Column>
          </Card>
        ) : null}

        <RouteSummaryCard
          pickupArea={data.pickupArea ?? 'Pickup'}
          dropoffArea={data.dropoffArea ?? 'Drop-off'}
          distanceKm={distanceKm}
          etaMinutes={estimateEtaMinutes(distanceKm)}
        />

        <Card>
          <Column gap="md">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Progress</Text>
            {(data.events ?? []).length > 0 ? (
              <StatusTimeline events={data.events as NonNullable<typeof data.events>} />
            ) : (
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>No status updates yet.</Text>
            )}
            <Divider />
            <Row justify="space-between">
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Recipient</Text>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{data.recipientName}</Text>
            </Row>
            <Row justify="space-between">
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Package</Text>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>
                {data.packageType === 'document' ? 'Document' : 'Parcel'} · {data.packageWeight} kg
              </Text>
            </Row>
          </Column>
        </Card>
      </ScrollView>

      {canCancel ? (
        <Column style={{ padding: 16 }}>
          <Button variant="destructive" size="lg" onPress={() => navigation.navigate('CancelFlow', { deliveryId })}>
            Cancel delivery
          </Button>
        </Column>
      ) : null}
    </Screen>
  );
}
