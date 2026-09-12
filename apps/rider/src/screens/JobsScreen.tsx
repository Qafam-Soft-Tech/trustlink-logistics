import React, { useState } from 'react';
import { Screen, Text as TextComponent, Box, Button, Card, Column, Row, Center, Badge, Divider } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';

const mockJobs = [
  {
    id: 'TLK-2024-003',
    status: 'available',
    pickup: 'Wuse 2, Abuja',
    dropoff: 'Garki, Abuja',
    distance: '3.2 km',
    fare: 2500,
    packageType: 'Document',
    timeLeft: '2 min',
    pickupTime: 'Now',
  },
  {
    id: 'TLK-2024-004',
    status: 'available',
    pickup: 'Maitama, Abuja',
    dropoff: 'Asokoro, Abuja',
    distance: '5.1 km',
    fare: 3200,
    packageType: 'Parcel',
    timeLeft: '5 min',
    pickupTime: 'Now',
  },
  {
    id: 'TLK-2024-005',
    status: 'assigned',
    pickup: 'Jabi, Abuja',
    dropoff: 'Utako, Abuja',
    distance: '4.5 km',
    fare: 2800,
    packageType: 'Parcel',
    timeLeft: 'Accepted',
    pickupTime: '10 min ago',
  },
  {
    id: 'TLK-2024-006',
    status: 'completed',
    pickup: 'Garki, Abuja',
    dropoff: 'Wuse 2, Abuja',
    distance: '3.2 km',
    fare: 2500,
    packageType: 'Document',
    timeLeft: 'Delivered',
    pickupTime: '2 hours ago',
  },
];

export function JobsScreen({ navigation }: any) {
  const [filter, setFilter] = useState<'all' | 'available' | 'active' | 'completed'>('all');

  const filteredJobs = filter === 'all' 
    ? mockJobs 
    : mockJobs.filter(j => j.status === filter || (filter === 'active' && ['assigned', 'picked_up', 'in_transit'].includes(j.status)));

  return (
    <Screen style={{ flex: 1 }}>
      <Column style={{ flex: 1, padding: theme.spacing.md }} gap="lg">
        <TextComponent variant="h2" color="textPrimary">Jobs</TextComponent>

        <Row gap="sm" style={{ flexWrap: 'wrap' }}>
          {(['all', 'available', 'active', 'completed'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setFilter(f)}
            >
              <TextComponent variant="bodySmall" color={filter === f ? 'white' : 'textPrimary'} style={{ textTransform: 'capitalize' }}>
                {f}
              </TextComponent>
            </Button>
          ))}
        </Row>

        {filteredJobs.length === 0 ? (
          <Center style={{ flex: 1, padding: theme.spacing.xxl }}>
            <Column gap="md" align="center">
              <Ionicons name="briefcase-outline" size={64} color={theme.colors.textTertiary} />
              <TextComponent variant="h4" color="textSecondary">No jobs found</TextComponent>
              <TextComponent variant="body" color="textTertiary" style={{ textAlign: 'center' }}>
                {filter === 'available' ? 'No available jobs at the moment. Stay online!' : `No ${filter} jobs`}
              </TextComponent>
            </Column>
          </Center>
        ) : (
          <Column gap="md">
            {filteredJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </Column>
        )}
      </Column>
    </Screen>
  );
}

function JobCard({ job }: any) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available': return { color: theme.colors.success, label: 'Available', variant: 'success' as const };
      case 'assigned': return { color: theme.colors.statusAssigned, label: 'Assigned', variant: 'primary' as const };
      case 'picked_up': return { color: theme.colors.statusPickedUp, label: 'Picked Up', variant: 'info' as const };
      case 'in_transit': return { color: theme.colors.statusInTransit, label: 'In Transit', variant: 'info' as const };
      case 'completed': return { color: theme.colors.statusDelivered, label: 'Delivered', variant: 'success' as const };
      default: return { color: theme.colors.textTertiary, label: status, variant: 'default' as const };
    }
  };

  const config = getStatusConfig(job.status);

  return (
    <Card onPress={() => {}}>
      <Column gap="md">
        <Row justify="space-between">
          <Row gap="sm" align="center">
            <TextComponent variant="h4" color="textPrimary" style={{ fontWeight: '600' }}>
              {job.id}
            </TextComponent>
            <Badge variant={config.variant} size="sm">{config.label}</Badge>
          </Row>
          <Column gap="xs" align="end">
            <TextComponent variant="h4" color="navy" style={{ fontWeight: '700' }}>₦{job.fare.toLocaleString()}</TextComponent>
            <TextComponent variant="caption" color="textTertiary">{job.distance}</TextComponent>
          </Column>
        </Row>

        <Divider />

        <Row gap="md">
          <Column gap="xs" style={{ flex: 1 }}>
            <Row gap="xs" align="center">
              <Ionicons name="location" size={14} color={theme.colors.textTertiary} />
              <TextComponent variant="bodySmall" color="textSecondary">Pickup</TextComponent>
            </Row>
            <TextComponent variant="body" color="textPrimary">{job.pickup}</TextComponent>
          </Column>
          <Column gap="xs" style={{ flex: 1 }}>
            <Row gap="xs" align="center">
              <Ionicons name="location" size={14} color={theme.colors.textTertiary} />
              <TextComponent variant="bodySmall" color="textSecondary">Drop-off</TextComponent>
            </Row>
            <TextComponent variant="body" color="textPrimary">{job.dropoff}</TextComponent>
          </Column>
        </Row>

        <Divider />

        <Row gap="md" align="center">
          <Column gap="xs" style={{ flex: 1 }}>
            <Row gap="xs" align="center">
              <Ionicons name="cube" size={16} color={theme.colors.textTertiary} />
              <TextComponent variant="bodySmall" color="textSecondary">Package</TextComponent>
            </Row>
            <TextComponent variant="body" color="textPrimary">{job.packageType}</TextComponent>
          </Column>
          <Column gap="xs" style={{ flex: 1 }}>
            <Row gap="xs" align="center">
              <Ionicons name="time" size={16} color={theme.colors.textTertiary} />
              <TextComponent variant="bodySmall" color="textSecondary">Status</TextComponent>
            </Row>
            <TextComponent variant="body" color={config.color} style={{ fontWeight: '600' }}>{job.timeLeft}</TextComponent>
          </Column>
        </Row>

        {job.status === 'available' && (
          <Divider />
        )}

        {job.status === 'available' && (
          <Button variant="primary" size="md" onPress={() => Alert.alert('Accept Job', `Accept ${job.id}?`)}>
            Accept Job
          </Button>
        )}

        {job.status === 'assigned' && (
          <Divider />
        )}

        {job.status === 'assigned' && (
          <Row gap="md">
            <Button variant="outline" size="md" onPress={() => {}} style={{ flex: 1 }}>
              Navigate
            </Button>
            <Button variant="secondary" size="md" onPress={() => {}} style={{ flex: 1 }}>
              Start Pickup
            </Button>
          </Row>
        )}

        {job.status === 'completed' && (
          <Divider />
        )}

        {job.status === 'completed' && (
          <Button variant="ghost" size="sm" onPress={() => {}}>
            <Row gap="sm" align="center">
              <Ionicons name="document-text" size={18} color={theme.colors.navy} />
              <TextComponent variant="bodySmall" color="navy">View Receipt</TextComponent>
            </Row>
          </Button>
        )}
      </Column>
    </Card>
  );
}