import React, { useState } from 'react';
import { Linking, RefreshControl, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Card, Column, Row, Badge, Banner, Skeleton, ErrorState, StepIndicator, formatNaira } from '@trustlink/shared';
import { useDeliveryJob, useConfirmPickup, useMarkInTransit } from '../../hooks';
import { ExecutionExitGuard } from './ExecutionExitGuard';
import type { JobsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<JobsStackParamList, 'Execution'>;

const STEPS = ['Navigate', 'Confirm pickup', 'In transit', 'Arrived'];

export function ExecutionScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { jobId } = route.params;
  const job = useDeliveryJob(jobId);
  const pickup = useConfirmPickup();
  const inTransit = useMarkInTransit();
  const [arrived, setArrived] = useState(false);

  if (job.isLoading) {
    return (
      <Screen>
        <TopBar title="Delivery in progress" showBack onBack={() => navigation.goBack()} />
        <Column gap="md" style={{ padding: 16 }}><Skeleton height={120} /><Skeleton height={160} /></Column>
      </Screen>
    );
  }

  if (job.isError || !job.data) {
    return (
      <Screen>
        <TopBar title="Delivery in progress" showBack onBack={() => navigation.goBack()} />
        <Column style={{ padding: 16 }}>
          <ErrorState message="Couldn't load this job." onAction={() => job.refetch()} />
        </Column>
      </Screen>
    );
  }

  const delivery = job.data;
  const step = arrived ? 3 : delivery.status === 'picked_up' ? 2 : delivery.status === 'in_transit' ? 2 : 1;
  const midExecution = !arrived && ['assigned', 'picked_up', 'in_transit'].includes(delivery.status);

  const openDropoffInMaps = () =>
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${delivery.dropoffStreet}, ${delivery.dropoffArea ?? ''}, Abuja`)}`,
    ).catch(() => undefined);

  const callRecipient = () => Linking.openURL(`tel:${delivery.recipientPhone}`).catch(() => undefined);

  return (
    <Screen>
      <TopBar title="Delivery in progress" showBack onBack={() => navigation.goBack()} />
      <StepIndicator steps={STEPS} current={step} />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={job.isFetching} onRefresh={() => { void job.refetch(); }} tintColor={theme.roles.primaryAction} />}
      >
        <Column gap="sm">
          <Row justify="space-between" align="center">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{delivery.trackingNumber}</Text>
            {(delivery.redeliveryAttempts ?? 0) >= 1 ? <Badge variant="warning">Attempt 2 of 2</Badge> : null}
          </Row>
          <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
            {delivery.pickupArea ?? 'Pickup'} → {delivery.dropoffArea ?? 'Drop-off'} · {formatNaira(delivery.fare ?? 0)}
          </Text>
        </Column>

        <Card>
          <Column gap="sm">
            <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Next stop</Text>
            <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>
              {delivery.status === 'in_transit' || delivery.status === 'picked_up' ? delivery.dropoffStreet : delivery.pickupStreet}
            </Text>
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
              {(delivery.status === 'in_transit' || delivery.status === 'picked_up' ? delivery.dropoffArea : delivery.pickupArea) ?? ''}
            </Text>
            <Button variant="outline" size="md" onPress={delivery.status === 'assigned' && !arrived ? () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${delivery.pickupStreet}, ${delivery.pickupArea ?? ''}, Abuja`)}`).catch(() => undefined) : openDropoffInMaps}>
              Navigate with maps
            </Button>
            <Button variant="ghost" size="md" onPress={callRecipient}>Call recipient</Button>
          </Column>
        </Card>

        {delivery.status === 'assigned' ? (
          <Column gap="sm">
            <Button variant="primary" size="lg" loading={pickup.isPending} onPress={() => pickup.mutate(jobId)}>Confirm pickup</Button>
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
              Only confirm pickup once the package is in your hands.
            </Text>
          </Column>
        ) : null}

        {delivery.status === 'picked_up' && !arrived ? (
          <Button variant="primary" size="lg" loading={inTransit.isPending} onPress={() => inTransit.mutate(jobId)}>Start trip (in transit)</Button>
        ) : null}

        {delivery.status === 'in_transit' && !arrived ? (
          <Button variant="primary" size="lg" onPress={() => setArrived(true)}>Arrived at drop-off</Button>
        ) : null}

        {arrived ? (
          <Column gap="md">
            <Banner variant="info" title="You've arrived" message="Complete the delivery with proof, or report a problem if you can't hand it over." />
            <Button variant="primary" size="lg" onPress={() => navigation.navigate('Pod', { jobId })}>Complete delivery</Button>
            <Button variant="outline" size="lg" onPress={() => navigation.navigate('Failure', { jobId })}>Report a problem</Button>
          </Column>
        ) : null}
      </ScrollView>

      <ExecutionExitGuard navigation={navigation} active={midExecution} />
    </Screen>
  );
}
