import React, { useState } from 'react';
import { Linking, RefreshControl, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  Badge,
  Banner,
  Dialog,
  Skeleton,
  EmptyState,
  ErrorState,
  StatusBadge,
  formatNaira,
  type RiderStatus,
} from '@trustlink/shared';
import { isOffline } from '@trustlink/shared';
import { useMyProfile, useRiderProfile, useKycStatus, useMyQueue, useSetRiderStatus } from '../hooks';
import type { RootStackParamList } from '../navigation/types';

export function HomeScreen() {
  const { theme } = useTheme();
  const root = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const profile = useMyProfile();
  const riderProfile = useRiderProfile();
  const kyc = useKycStatus();
  const queue = useMyQueue();
  const setStatus = useSetRiderStatus();
  const [pendingStatus, setPendingStatus] = useState<RiderStatus | null>(null);
  const [gateInfo, setGateInfo] = useState(false);

  const approved = kyc.data?.status === 'approved';
  const status = riderProfile.data?.status ?? 'offline';
  const online = status === 'online' || status === 'on_trip';
  const jobs = queue.data ?? [];
  const active = jobs[0];
  const offline = isOffline(queue.error);
  const loading = riderProfile.isLoading || kyc.isLoading || profile.isLoading;
  const name = profile.data?.firstName ?? 'Rider';

  const openKyc = () => root.navigate('Main', { screen: 'Profile', params: { screen: 'KycOverview' } });

  const confirmToggle = () => {
    if (!pendingStatus) return;
    setStatus.mutate(pendingStatus, { onSettled: () => setPendingStatus(null) });
  };

  return (
    <Screen>
      <TopBar
        title="Home"
        rightAction={<Ionicons name="notifications-outline" size={22} color={theme.roles.primaryAction} />}
        onRightPress={() => root.navigate('Main', { screen: 'Alerts' })}
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={queue.isFetching || riderProfile.isFetching} onRefresh={() => { queue.refetch(); riderProfile.refetch(); kyc.refetch(); }} tintColor={theme.roles.primaryAction} />}
      >
        {loading ? (
          <Column gap="sm"><Skeleton height={88} /><Skeleton height={140} /></Column>
        ) : (
          <>
            <Column gap="xs">
              <Text variant="h3" color="inherit" style={{ color: theme.roles.text }}>Hello, {name}</Text>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>
                {online ? "You're online — jobs can be assigned to you." : "You're offline. Go online to receive jobs."}
              </Text>
            </Column>

            {offline ? <Banner variant="offline" message="You're offline. Showing the last known state." /> : null}

            {!approved ? (
              <Banner
                variant="warning"
                title="Verification required"
                message={`You can't go online until your KYC is approved${kyc.data?.status ? ` (currently ${kyc.data.status})` : ''}.`}
              />
            ) : null}

            <Card>
              <Column gap="md">
                <Row justify="space-between" align="center">
                  <Column gap="xs">
                    <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Availability</Text>
                    <Row gap="sm" align="center">
                      <Badge variant={status === 'on_trip' ? 'info' : online ? 'success' : 'default'}>
                        {status === 'on_trip' ? 'On a trip' : online ? 'Online' : 'Offline'}
                      </Badge>
                    </Row>
                  </Column>
                  <Ionicons
                    name={online ? 'toggle' : 'toggle-outline'}
                    size={40}
                    color={approved ? (online ? theme.roles.primaryAction : theme.roles.textMuted) : theme.roles.textMuted}
                  />
                </Row>

                {approved ? (
                  <Button
                    variant={online ? 'outline' : 'primary'}
                    size="lg"
                    loading={setStatus.isPending}
                    disabled={status === 'on_trip'}
                    onPress={() => (online ? setPendingStatus('offline') : setPendingStatus('online'))}
                  >
                    {status === 'on_trip' ? 'Finish your trip first' : online ? 'Go offline' : 'Go online'}
                  </Button>
                ) : (
                  <Button variant="primary" size="lg" onPress={openKyc}>Complete KYC verification</Button>
                )}
              </Column>
            </Card>

            <Card>
              <Column gap="md">
                <Row justify="space-between" align="center">
                  <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Queue</Text>
                  <Badge variant={jobs.length > 0 ? 'primary' : 'default'}>{jobs.length} job{jobs.length === 1 ? '' : 's'}</Badge>
                </Row>
                {queue.isError && !offline ? (
                  <ErrorState message="Couldn't load your queue." onAction={() => queue.refetch()} />
                ) : !active ? (
                  <EmptyState icon="📦" title="No jobs assigned" message={online ? 'Stay online — dispatch assigns jobs near you.' : 'Go online to start receiving jobs.'} />
                ) : (
                  <Column gap="sm">
                    <Row justify="space-between" align="center">
                      <Column gap="xs">
                        <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{active.trackingNumber}</Text>
                        <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                          {active.pickupArea ?? 'Pickup'} → {active.dropoffArea ?? 'Drop-off'} · {formatNaira(active.fare ?? 0)}
                        </Text>
                      </Column>
                      <StatusBadge status={active.status} />
                    </Row>
                    <Row justify="space-between" align="center">
                      <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                        Recipient: {active.recipientName}
                      </Text>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => Linking.openURL(`tel:${active.recipientPhone}`).catch(() => undefined)}
                      >
                        Call recipient
                      </Button>
                    </Row>
                    <Button variant="ghost" size="md" onPress={() => root.navigate('Main', { screen: 'Jobs' })}>View all jobs</Button>
                    <Button
                      variant="primary"
                      size="md"
                      onPress={() => root.navigate('Main', { screen: 'Jobs', params: { screen: 'JobDetails', params: { jobId: active.id } } })}
                    >
                      Open active job
                    </Button>
                  </Column>
                )}
              </Column>
            </Card>
          </>
        )}
      </ScrollView>

      <Dialog
        visible={Boolean(pendingStatus)}
        title={pendingStatus === 'online' ? 'Go online?' : 'Go offline?'}
        message={pendingStatus === 'online' ? 'You can be assigned deliveries while you are online.' : "You won't receive new jobs while offline."}
        confirmLabel={pendingStatus === 'online' ? 'Go online' : 'Go offline'}
        cancelLabel="Cancel"
        onCancel={() => setPendingStatus(null)}
        onConfirm={confirmToggle}
      />

      <Dialog
        visible={gateInfo}
        title="Verification required"
        message="Complete your KYC verification before going online."
        confirmLabel="Go to verification"
        cancelLabel="Close"
        onCancel={() => setGateInfo(false)}
        onConfirm={() => { setGateInfo(false); openKyc(); }}
      />
    </Screen>
  );
}
