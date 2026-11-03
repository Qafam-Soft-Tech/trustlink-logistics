import React, { useState } from 'react';
import { Linking, RefreshControl, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Card, Column, Row, Badge, Banner, Dialog, Skeleton, ErrorState, StatusBadge, StatusTimeline, formatNaira } from '@trustlink/shared';
import { useDeliveryJob, useAcknowledgeJob } from '../../hooks';
import { DISPATCH_PHONE, DISPATCH_PHONE_NOTE } from './dispatch';
import type { JobsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<JobsStackParamList, 'JobDetails'>;

const ACTIVE_STATUSES = ['picked_up', 'in_transit'];

export function JobDetailsScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { jobId } = route.params;
  const job = useDeliveryJob(jobId);
  const acknowledge = useAcknowledgeJob();
  const [confirmAccept, setConfirmAccept] = useState(false);

  if (job.isLoading) {
    return (
      <Screen>
        <TopBar title="Job" showBack onBack={() => navigation.goBack()} />
        <Column gap="md" style={{ padding: 16 }}><Skeleton height={120} /><Skeleton height={160} /></Column>
      </Screen>
    );
  }

  if (job.isError || !job.data) {
    return (
      <Screen>
        <TopBar title="Job" showBack onBack={() => navigation.goBack()} />
        <Column style={{ padding: 16 }}>
          <ErrorState message="Couldn't load this job." onAction={() => job.refetch()} />
        </Column>
      </Screen>
    );
  }

  const delivery = job.data;
  const isRedelivery = (delivery.redeliveryAttempts ?? 0) >= 1;
  const acknowledged = Boolean(delivery.acknowledgedAt);

  const callRecipient = () => Linking.openURL(`tel:${delivery.recipientPhone}`).catch(() => undefined);
  const callDispatch = () => Linking.openURL(`tel:${DISPATCH_PHONE}`).catch(() => undefined);

  return (
    <Screen>
      <TopBar title="Job" showBack onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={job.isFetching} onRefresh={() => { void job.refetch(); }} tintColor={theme.roles.primaryAction} />}
      >
        <Column gap="sm">
          <Row justify="space-between" align="center">
            <Text variant="h3" color="inherit" style={{ color: theme.roles.text }}>{delivery.trackingNumber}</Text>
            <StatusBadge status={delivery.status} />
          </Row>
          <Row gap="sm" align="center" style={{ flexWrap: 'wrap' }}>
            {isRedelivery ? <Badge variant="warning">Attempt 2 of 2</Badge> : null}
            {!acknowledged && delivery.status === 'assigned' ? <Badge variant="info">Needs acceptance</Badge> : null}
            <Badge variant="default">{formatNaira(delivery.fare ?? 0)}</Badge>
          </Row>
        </Column>

        <Card>
          <Column gap="md">
            <Row justify="space-between" align="center">
              <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Pickup</Text>
              {delivery.status === 'assigned' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${delivery.pickupStreet}, ${delivery.pickupArea ?? ''}, Abuja`)}`).catch(() => undefined)}
                >
                  Navigate
                </Button>
              ) : null}
            </Row>
            <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{delivery.pickupStreet}</Text>
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
              {delivery.pickupLandmark ? `${delivery.pickupLandmark} · ` : ''}{delivery.pickupArea}
            </Text>
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Drop-off</Text>
            <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{delivery.dropoffStreet}</Text>
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
              {delivery.dropoffLandmark ? `${delivery.dropoffLandmark} · ` : ''}{delivery.dropoffArea}
            </Text>
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Package & recipient</Text>
            <Row justify="space-between" align="center">
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Package</Text>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>
                {delivery.packageType === 'document' ? 'Document' : 'Parcel'} · {delivery.packageWeight} kg
              </Text>
            </Row>
            {delivery.packageDescription ? (
              <Row justify="space-between" align="center">
                <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Description</Text>
                <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{delivery.packageDescription}</Text>
              </Row>
            ) : null}
            <Row justify="space-between" align="center">
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Recipient</Text>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{delivery.recipientName} · {delivery.recipientPhone}</Text>
            </Row>
            <Row gap="sm">
              <Button variant="outline" size="md" style={{ flex: 1 }} onPress={callRecipient}>Call recipient</Button>
              <Button variant="ghost" size="md" style={{ flex: 1 }} onPress={() => navigation.navigate('ReportIssue', { deliveryId: delivery.id })}>Report issue</Button>
            </Row>
          </Column>
        </Card>

        {(delivery.events ?? []).length > 0 ? (
          <Card>
            <Column gap="md">
              <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Progress</Text>
              <StatusTimeline events={delivery.events as NonNullable<typeof delivery.events>} />
            </Column>
          </Card>
        ) : null}

        {delivery.status === 'delivered' ? (
          <Banner variant="success" title="Delivered" message="This job is complete. Nice work." />
        ) : null}
        {delivery.status === 'failed' ? (
          <Banner variant="warning" title="Delivery unsuccessful" message="TrustLink will arrange one redelivery at no extra cost." />
        ) : null}
        {delivery.status === 'returned' ? (
          <Banner variant="info" title="Returned to sender" message="The package is heading back to the sender." />
        ) : null}
        {delivery.status === 'cancelled' ? (
          <Banner variant="info" title="Cancelled" message="The customer cancelled this job." />
        ) : null}
      </ScrollView>

      {delivery.status === 'assigned' && !acknowledged ? (
        <Column style={{ padding: 16, gap: 8 }}>
          <Button variant="primary" size="lg" loading={acknowledge.isPending} onPress={() => setConfirmAccept(true)}>Accept job</Button>
          <Button variant="ghost" size="md" onPress={callDispatch}>Can't take this? Call dispatch</Button>
          <Text variant="caption" color="inherit" style={{ textAlign: 'center', color: theme.roles.textMuted }}>{DISPATCH_PHONE_NOTE}</Text>
        </Column>
      ) : null}

      {delivery.status === 'assigned' && acknowledged ? (
        <Column style={{ padding: 16 }}>
          <Button variant="primary" size="lg" onPress={() => navigation.navigate('Execution', { jobId: delivery.id })}>Start delivery</Button>
        </Column>
      ) : null}

      {ACTIVE_STATUSES.includes(delivery.status) ? (
        <Column style={{ padding: 16 }}>
          <Button variant="primary" size="lg" onPress={() => navigation.navigate('Execution', { jobId: delivery.id })}>Continue delivery</Button>
        </Column>
      ) : null}

      <Dialog
        visible={confirmAccept}
        title="Accept this job?"
        message="Dispatch will expect you to collect and deliver this package. You can still call dispatch if something changes."
        confirmLabel="Accept job"
        cancelLabel="Not now"
        onCancel={() => setConfirmAccept(false)}
        onConfirm={() => {
          setConfirmAccept(false);
          acknowledge.mutate(jobId, {
            onSuccess: () => navigation.navigate('Execution', { jobId }),
          });
        }}
      />
    </Screen>
  );
}
