import React, { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Screen, TopBar, Text, Card, Column, Row, Chip, Badge, Banner, Skeleton, EmptyState, ErrorState, StatusBadge, formatNaira, type Delivery } from '@trustlink/shared';
import { isOffline } from '@trustlink/shared';
import { useMyJobs } from '../hooks';
import type { JobsStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<JobsStackParamList, 'JobsList'>;
type Filter = 'queue' | 'active' | 'completed';

const ACTIVE_STATUSES = ['picked_up', 'in_transit'];
const COMPLETED_STATUSES = ['delivered', 'failed', 'returned', 'cancelled'];

export function JobsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const jobs = useMyJobs();
  const [filter, setFilter] = useState<Filter>('queue');

  const all = jobs.data ?? [];
  const offline = isOffline(jobs.error);

  const grouped = {
    queue: all.filter((job) => job.status === 'assigned'),
    active: all.filter((job) => ACTIVE_STATUSES.includes(job.status)),
    completed: all.filter((job) => COMPLETED_STATUSES.includes(job.status)),
  };
  const items = grouped[filter];
  const pendingAcknowledgement = grouped.queue.filter((job) => !job.acknowledgedAt).length;

  return (
    <Screen>
      <TopBar title="Jobs" />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={jobs.isFetching} onRefresh={() => { void jobs.refetch(); }} tintColor={theme.roles.primaryAction} />}
      >
        {pendingAcknowledgement > 0 ? (
          <Banner variant="info" title="New job assigned" message={`${pendingAcknowledgement} job${pendingAcknowledgement === 1 ? '' : 's'} waiting for you to accept.`} />
        ) : null}
        {offline ? <Banner variant="offline" message="You're offline. Showing the last known jobs." /> : null}

        <Row gap="sm" style={{ flexWrap: 'wrap' }} justify="start">
          <Chip label={`Queue (${grouped.queue.length})`} selected={filter === 'queue'} onPress={() => setFilter('queue')} />
          <Chip label={`Active (${grouped.active.length})`} selected={filter === 'active'} onPress={() => setFilter('active')} />
          <Chip label={`Completed (${grouped.completed.length})`} selected={filter === 'completed'} onPress={() => setFilter('completed')} />
        </Row>

        {jobs.isLoading ? (
          <Column gap="sm"><Skeleton height={96} /><Skeleton height={96} /></Column>
        ) : jobs.isError && !offline ? (
          <ErrorState message="Couldn't load your jobs." onAction={() => jobs.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={filter === 'queue' ? '🧭' : '📦'}
            title={filter === 'queue' ? 'No jobs in your queue' : filter === 'active' ? 'Nothing in progress' : 'Nothing completed yet'}
            message={filter === 'queue' ? "Stay online — dispatch assigns jobs near you." : 'Completed jobs appear here for your records.'}
          />
        ) : (
          items.map((job) => <JobCard key={job.id} job={job} onOpen={() => navigation.navigate('JobDetails', { jobId: job.id })} />)
        )}
      </ScrollView>
    </Screen>
  );
}

function JobCard({ job, onOpen }: { job: Delivery; onOpen: () => void }) {
  const { theme } = useTheme();
  const isRedelivery = (job.redeliveryAttempts ?? 0) >= 1;

  return (
    <Card onPress={onOpen}>
      <Column gap="md">
        <Row justify="space-between" align="center">
          <Column gap="xs" style={{ flex: 1 }}>
            <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{job.trackingNumber}</Text>
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
              {job.pickupArea ?? 'Pickup'} → {job.dropoffArea ?? 'Drop-off'}
            </Text>
          </Column>
          <StatusBadge status={job.status} />
        </Row>

        <Row gap="sm" align="center" style={{ flexWrap: 'wrap' }}>
          {isRedelivery ? <Badge variant="warning">Attempt 2 of 2</Badge> : null}
          {!job.acknowledgedAt && job.status === 'assigned' ? <Badge variant="info">Needs acceptance</Badge> : null}
          <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
            {job.packageType === 'document' ? 'Document' : 'Parcel'} · {job.packageWeight} kg
          </Text>
          <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>· {formatNaira(job.fare ?? 0)}</Text>
        </Row>

        <Row align="center" gap="sm">
          <Ionicons name="chevron-forward" size={18} color={theme.roles.primaryAction} />
          <Text variant="caption" color="inherit" style={{ color: theme.roles.primaryAction }}>Open job</Text>
        </Row>
      </Column>
    </Card>
  );
}
