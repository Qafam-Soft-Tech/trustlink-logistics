import React, { useState, useEffect } from 'react';
import { Screen, Text as TextComponent, Box, Button, Card, Column, Row, Center, Avatar, Badge, Divider } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  requested: { label: 'Requested', color: theme.colors.statusRequested, icon: 'time' },
  searching: { label: 'Searching', color: theme.colors.statusSearching, icon: 'search' },
  assigned: { label: 'Assigned', color: theme.colors.statusAssigned, icon: 'person' },
  picked_up: { label: 'Picked Up', color: theme.colors.statusPickedUp, icon: 'package' },
  in_transit: { label: 'In Transit', color: theme.colors.statusInTransit, icon: 'bicycle' },
  delivered: { label: 'Delivered', color: theme.colors.statusDelivered, icon: 'checkmark-circle' },
};

export function TrackingScreen() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const response = await api.get('/deliveries');
        setDeliveries(response.data);
        if (response.data.length > 0) {
          setSelectedDelivery(response.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch deliveries:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDeliveries();
  }, []);

  if (loading) {
    return (
      <Screen style={{ flex: 1 }}>
        <Center style={{ flex: 1 }}>
          <Ionicons name="sync" size={48} color={theme.colors.navy} />
        </Center>
      </Screen>
    );
  }

  return (
    <Screen style={{ flex: 1 }}>
      <Column style={{ flex: 1, padding: theme.spacing.md }} gap="lg">
        <TextComponent variant="h2" color="textPrimary">Track Deliveries</TextComponent>

        <Card>
          <Column gap="md">
            <TextComponent variant="h4" color="textPrimary">Active Deliveries</TextComponent>
            <Column gap="sm">
              {deliveries.map((delivery: any) => (
                <DeliverySummaryCard
                  key={delivery.id}
                  delivery={delivery}
                  selected={selectedDelivery?.id === delivery.id}
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
              {selectedDelivery?.timeline.map((item: any, index: number) => (
                <TimelineItem
                  key={item.status}
                  {...item}
                  isFirst={index === 0}
                  isLast={index === selectedDelivery.timeline.length - 1}
                  isCurrent={item.completed && (index === selectedDelivery.timeline.findIndex((t: any) => !t.completed) - 1)}
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