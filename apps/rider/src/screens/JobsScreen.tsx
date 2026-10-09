import React from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useTheme, Screen, TopBar, Text, Card, Column, Row, Badge, Banner, Skeleton, EmptyState, ErrorState, StatusBadge, formatNaira } from '@trustlink/shared';
import { useMyQueue } from '../hooks';

export function JobsScreen() {
  const { theme } = useTheme();
  const queue = useMyQueue();
  const jobs = queue.data ?? [];
  const offline = (queue.error as Error | null)?.name === 'OfflineError';

  return (
    <Screen>
      <TopBar title="Jobs" />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={queue.isFetching} onRefresh={() => queue.refetch()} tintColor={theme.roles.primaryAction} />}
      >
        <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>
          Jobs assigned to you by dispatch. Actions for a job arrive in the next rider phase.
        </Text>

        {offline ? <Banner variant="offline" message="You're offline. Showing the last known queue." /> : null}

        {queue.isLoading ? (
          <Column gap="sm"><Skeleton height={96} /><Skeleton height={96} /></Column>
        ) : queue.isError && !offline ? (
          <ErrorState message="Couldn't load your jobs." onAction={() => queue.refetch()} />
        ) : jobs.length === 0 ? (
          <EmptyState icon="🧭" title="No jobs yet" message="Dispatch will assign deliveries near you when you're online." />
        ) : (
          jobs.map((job) => (
            <Card key={job.id}>
              <Column gap="md">
                <Row justify="space-between" align="center">
                  <Column gap="xs">
                    <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{job.trackingNumber}</Text>
                    <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                      {job.pickupArea ?? 'Pickup'} → {job.dropoffArea ?? 'Drop-off'}
                    </Text>
                  </Column>
                  <StatusBadge status={job.status} />
                </Row>
                <Row justify="space-between" align="center">
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                    {job.packageType === 'document' ? 'Document' : 'Parcel'} · {job.packageWeight} kg
                  </Text>
                  <Badge variant="primary">{formatNaira(job.fare ?? 0)}</Badge>
                </Row>
                <Column gap="xs">
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Pickup: {job.pickupStreet}</Text>
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Drop-off: {job.dropoffStreet}</Text>
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Recipient: {job.recipientName} · {job.recipientPhone}</Text>
                </Column>
              </Column>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
