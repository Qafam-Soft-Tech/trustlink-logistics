import React, { useState } from 'react';
import { Screen, Text as TextComponent, Box, Button, Card, Column, Row, Center, Avatar, Badge, Divider } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';

const mockDeliveries = [
  {
    id: 'TLK-2024-001',
    status: 'in_transit',
    pickup: 'Wuse 2, Abuja',
    dropoff: 'Garki, Abuja',
    riderName: 'Mike Johnson',
    riderPhone: '080 1111 2222',
    riderRating: 4.9,
    estimatedTime: '15 min',
    distance: '3.2 km',
    timeline: [
      { status: 'requested', time: '10:00 AM', completed: true },
      { status: 'searching', time: '10:05 AM', completed: true },
      { status: 'assigned', time: '10:10 AM', completed: true },
      { status: 'picked_up', time: '10:25 AM', completed: true },
      { status: 'in_transit', time: '10:30 AM', completed: true },
      { status: 'delivered', time: '10:45 AM', completed: false },
    ],
  },
  {
    id: 'TLK-2024-002',
    status: 'assigned',
    pickup: 'Maitama, Abuja',
    dropoff: 'Asokoro, Abuja',
    riderName: 'Sarah Williams',
    riderPhone: '080 3333 4444',
    riderRating: 4.8,
    estimatedTime: '30 min',
    distance: '5.1 km',
    timeline: [
      { status: 'requested', time: '09:30 AM', completed: true },
      { status: 'searching', time: '09:35 AM', completed: true },
      { status: 'assigned', time: '09:40 AM', completed: true },
      { status: 'picked_up', time: '--', completed: false },
      { status: 'in_transit', time: '--', completed: false },
      { status: 'delivered', time: '--', completed: false },
    ],
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  requested: { label: 'Requested', color: theme.colors.statusRequested, icon: 'time' },
  searching: { label: 'Searching', color: theme.colors.statusSearching, icon: 'search' },
  assigned: { label: 'Assigned', color: theme.colors.statusAssigned, icon: 'person' },
  picked_up: { label: 'Picked Up', color: theme.colors.statusPickedUp, icon: 'package' },
  in_transit: { label: 'In Transit', color: theme.colors.statusInTransit, icon: 'bicycle' },
  delivered: { label: 'Delivered', color: theme.colors.statusDelivered, icon: 'checkmark-circle' },
};

export function TrackingScreen() {
  const [selectedDelivery, setSelectedDelivery] = useState(mockDeliveries[0]);

  return (
    <Screen style={{ flex: 1 }}>
      <Column style={{ flex: 1, padding: theme.spacing.md }} gap="lg">
        <TextComponent variant="h2" color="textPrimary">Track Deliveries</TextComponent>

        <Card>
          <Column gap="md">
            <TextComponent variant="h4" color="textPrimary">Active Deliveries</TextComponent>
            <Column gap="sm">
              {mockDeliveries.map(delivery => (
                <DeliverySummaryCard
                  key={delivery.id}
                  delivery={delivery}
                  selected={selectedDelivery.id === delivery.id}
                  onPress={() => setSelectedDelivery(delivery)}
                />
              ))}
            </Column>
          </Column>
        </Card>

        <Card>
          <Column gap="lg">
            <Row justify="space-between">
              <TextComponent variant="h4" color="textPrimary">{selectedDelivery.id}</TextComponent>
              <Badge variant={getStatusVariant(selectedDelivery.status)} size="md">
                {statusConfig[selectedDelivery.status]?.label || 'Unknown'}
              </Badge>
            </Row>

            <Divider />

            <Row gap="md">
              <Column gap="xs" style={{ flex: 1 }}>
                <Row gap="xs" align="center">
                  <Ionicons name="location" size={16} color={theme.colors.textTertiary} />
                  <TextComponent variant="bodySmall" color="textSecondary">Pickup</TextComponent>
                </Row>
                <TextComponent variant="body" color="textPrimary">{selectedDelivery.pickup}</TextComponent>
              </Column>
              <Column gap="xs" style={{ flex: 1 }}>
                <Row gap="xs" align="center">
                  <Ionicons name="location" size={16} color={theme.colors.textTertiary} />
                  <TextComponent variant="bodySmall" color="textSecondary">Drop-off</TextComponent>
                </Row>
                <TextComponent variant="body" color="textPrimary">{selectedDelivery.dropoff}</TextComponent>
              </Column>
            </Row>

            <Divider />

            {selectedDelivery.status !== 'delivered' && selectedDelivery.status !== 'requested' && selectedDelivery.status !== 'searching' && (
              <Column gap="md">
                <TextComponent variant="h4" color="textPrimary">Rider Details</TextComponent>
                <Row gap="md" align="center">
                  <Avatar size="lg" name={selectedDelivery.riderName} />
                  <Column gap="xs">
                    <TextComponent variant="h4" color="textPrimary">{selectedDelivery.riderName}</TextComponent>
                    <Row gap="md" align="center">
                      <Row gap="xs" align="center">
                        <Ionicons name="star" size={14} color={theme.colors.gold} />
                        <TextComponent variant="bodySmall" color="textSecondary">{selectedDelivery.riderRating}</TextComponent>
                      </Row>
                      <Button variant="outline" size="sm" onPress={() => {}}>
                        <Ionicons name="call" size={18} color={theme.colors.navy} />
                      </Button>
                      <Button variant="outline" size="sm" onPress={() => {}}>
                        <Ionicons name="chatbubbles" size={18} color={theme.colors.navy} />
                      </Button>
                    </Row>
                  </Column>
                </Row>
                <Row gap="md" style={{ paddingTop: theme.spacing.md }}>
                  <Column gap="xs" style={{ flex: 1, alignItems: 'center', paddingVertical: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md }}>
                    <Ionicons name="time" size={20} color={theme.colors.navy} />
                    <TextComponent variant="bodySmall" color="textSecondary">Est. Arrival</TextComponent>
                    <TextComponent variant="h4" color="navy" style={{ fontWeight: '700' }}>{selectedDelivery.estimatedTime}</TextComponent>
                  </Column>
                  <Column gap="xs" style={{ flex: 1, alignItems: 'center', paddingVertical: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md }}>
                    <Ionicons name="navigate" size={20} color={theme.colors.navy} />
                    <TextComponent variant="bodySmall" color="textSecondary">Distance</TextComponent>
                    <TextComponent variant="h4" color="navy" style={{ fontWeight: '700' }}>{selectedDelivery.distance}</TextComponent>
                  </Column>
                </Row>
              </Column>
            )}

            <Divider />

            <TextComponent variant="h4" color="textPrimary">Timeline</TextComponent>
            <Column gap={0}>
              {selectedDelivery.timeline.map((item, index) => (
                <TimelineItem
                  key={item.status}
                  {...item}
                  isFirst={index === 0}
                  isLast={index === selectedDelivery.timeline.length - 1}
                  isCurrent={item.completed && (index === selectedDelivery.timeline.findIndex(t => !t.completed) - 1) === index}
                />
              ))}
            </Column>
          </Column>
        </Card>
      </Column>
    </Screen>
  );
}

function DeliverySummaryCard({ delivery, selected, onPress }: any) {
  const config = statusConfig[delivery.status];

  return (
    <Button
      variant={selected ? 'primary' : 'outline'}
      size="md"
      onPress={onPress}
      style={{ padding: theme.spacing.md }}
    >
      <Row justify="space-between" align="center">
        <Column gap="xs">
          <Row gap="sm" align="center">
            <TextComponent variant="body" color={selected ? 'white' : 'textPrimary'} style={{ fontWeight: '600' }}>
              {delivery.id}
            </TextComponent>
            <Badge variant={getStatusVariant(delivery.status)} size="sm">
              {config?.label || 'Unknown'}
            </Badge>
          </Row>
          <Row gap="md">
            <TextComponent variant="caption" color={selected ? 'white' : 'textTertiary'}>
              {delivery.pickup} → {delivery.dropoff}
            </TextComponent>
          </Row>
        </Column>
        <Column gap="xs" align="end">
          <TextComponent variant="caption" color={selected ? 'white' : 'textSecondary'}>
            Est. {delivery.estimatedTime}
          </TextComponent>
          <TextComponent variant="caption" color={selected ? 'white' : 'textTertiary'}>
            {delivery.distance}
          </TextComponent>
        </Column>
      </Row>
    </Button>
  );
}

function TimelineItem({ status, time, completed, isFirst, isLast, isCurrent }: any) {
  const config = statusConfig[status];
  const isActive = completed || isCurrent;

  return (
    <Row gap="md" style={{ paddingVertical: theme.spacing.sm }}>
      <Column gap={0} style={{ alignItems: 'center' }}>
        <Box
          style={{
            width: isActive ? 20 : 12,
            height: isActive ? 20 : 12,
            borderRadius: theme.borderRadius.full,
            backgroundColor: isActive ? config?.color : theme.colors.gray300,
            borderWidth: isActive ? 0 : 2,
            borderColor: config?.color,
            zIndex: 1,
          }}
        />
        {!isLast && (
          <Box
            style={{
              width: 2,
              height: '100%',
              backgroundColor: completed ? config?.color : theme.colors.gray200,
              marginTop: theme.spacing.xs,
            }}
          />
        )}
      </Column>
      <Column gap="xs" style={{ flex: 1, paddingTop: theme.spacing.xs }}>
        <Row gap="sm" align="center">
          <TextComponent variant="bodySmall" color={isActive ? 'textPrimary' : 'textTertiary'} style={{ fontWeight: isActive ? '600' : '500' }}>
            {config?.label || status}
          </TextComponent>
          {isCurrent && <Badge variant="primary" size="sm">Current</Badge>}
        </Row>
        <TextComponent variant="caption" color={isActive ? 'textSecondary' : 'textTertiary'}>
          {time}
        </TextComponent>
      </Column>
    </Row>
  );
}

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' {
  switch (status) {
    case 'delivered': return 'success';
    case 'in_transit':
    case 'picked_up': return 'info';
    case 'assigned': return 'primary';
    case 'searching': return 'warning';
    case 'failed':
    case 'cancelled': return 'error';
    default: return 'default';
  }
}