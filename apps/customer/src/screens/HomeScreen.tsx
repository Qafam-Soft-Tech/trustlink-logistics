import React from 'react';
import { Screen, Text as TextComponent, Box, Button, Card, Column, Row, Center, Avatar, Badge, Divider } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';

export function HomeScreen({ navigation }: any) {
  return (
    <Screen style={{ flex: 1 }}>
      <Column style={{ flex: 1, padding: theme.spacing.md }} gap="lg">
        <Row justify="space-between" align="center">
          <Column gap="xs">
            <TextComponent variant="h2" color="textPrimary">
              Welcome back, John
            </TextComponent>
            <TextComponent variant="bodySmall" color="textSecondary">
              Ready to send a package?
            </TextComponent>
          </Column>
          <Avatar size="md" name="John Doe" />
        </Row>

        <Card>
          <Column gap="md">
            <Row justify="space-between">
              <TextComponent variant="h4" color="textPrimary">Quick Actions</TextComponent>
            </Row>
            <Row gap="md">
              <QuickActionButton
                icon="add-circle"
                label="New Delivery"
                color={theme.colors.navy}
                onPress={() => navigation.navigate('NewDelivery')}
              />
              <QuickActionButton
                icon="location"
                label="Track Package"
                color={theme.colors.gold}
                onPress={() => navigation.navigate('Tracking')}
              />
              <QuickActionButton
                icon="time"
                label="History"
                color={theme.colors.info}
                onPress={() => navigation.navigate('Deliveries')}
              />
            </Row>
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <Row justify="space-between">
              <TextComponent variant="h4" color="textPrimary">Active Deliveries</TextComponent>
              <Button variant="ghost" size="sm" onPress={() => navigation.navigate('Tracking')}>
                View All
              </Button>
            </Row>
            <Column gap="sm">
              <DeliveryCard
                id="TLK-2024-001"
                status="in_transit"
                pickup="Wuse 2, Abuja"
                dropoff="Garki, Abuja"
                riderName="Mike Johnson"
                estimatedTime="15 min"
              />
              <DeliveryCard
                id="TLK-2024-002"
                status="assigned"
                pickup="Maitama, Abuja"
                dropoff="Asokoro, Abuja"
                riderName="Sarah Williams"
                estimatedTime="30 min"
              />
            </Column>
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <TextComponent variant="h4" color="textPrimary">Account Summary</TextComponent>
            <Row gap="md">
              <StatItem label="This Month" value="12" subtitle="Deliveries" />
              <StatItem label="Spent" value="₦45,000" subtitle="Total" />
              <StatItem label="Rating" value="4.9" subtitle="Stars" />
            </Row>
          </Column>
        </Card>
      </Column>
    </Screen>
  );
}

function QuickActionButton({ icon, label, color, onPress }: any) {
  return (
    <Button
      variant="outline"
      size="md"
      onPress={onPress}
      style={{ flex: 1, paddingVertical: theme.spacing.lg }}
      leftIcon={<Ionicons name={icon} size={24} color={color} />}
    >
      <TextComponent variant="bodySmall" color={color as any} style={{ textAlign: 'center' }}>
        {label}
      </TextComponent>
    </Button>
  );
}

function DeliveryCard({ id, status, pickup, dropoff, riderName, estimatedTime }: any) {
  const getStatusConfig = (status: string): { color: string; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] } => {
    switch (status) {
      case 'in_transit':
        return { color: theme.colors.statusInTransit, label: 'In Transit', icon: 'bicycle' };
      case 'assigned':
        return { color: theme.colors.statusAssigned, label: 'Assigned', icon: 'person' };
      case 'picked_up':
        return { color: theme.colors.statusPickedUp, label: 'Picked Up', icon: 'cube' };
      case 'delivered':
        return { color: theme.colors.statusDelivered, label: 'Delivered', icon: 'checkmark-circle' };
      default:
        return { color: theme.colors.statusRequested, label: 'Requested', icon: 'time' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Box style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md }}>
      <Row justify="space-between">
        <Column gap="xs">
          <Row gap="sm" align="center">
            <TextComponent variant="body" color="textPrimary" style={{ fontWeight: '600' }}>
              {id}
            </TextComponent>
            <Badge variant="info" size="sm">{config.label}</Badge>
          </Row>
          <Row gap="md">
            <Column gap="xs" style={{ flex: 1 }}>
              <Row gap="xs" align="center">
                <Ionicons name="location" size={14} color={theme.colors.textTertiary} />
                <TextComponent variant="caption" color="textSecondary">Pickup: {pickup}</TextComponent>
              </Row>
              <Row gap="xs" align="center">
                <Ionicons name="location" size={14} color={theme.colors.textTertiary} />
                <TextComponent variant="caption" color="textSecondary">Drop: {dropoff}</TextComponent>
              </Row>
            </Column>
            <Column gap="xs" align="end">
              <Row gap="xs" align="center">
                <Ionicons name={config.icon} size={14} color={config.color} />
                <TextComponent variant="caption" color={config.color} style={{ fontWeight: '600' }}>
                  {estimatedTime}
                </TextComponent>
              </Row>
              <TextComponent variant="caption" color="textTertiary">Rider: {riderName}</TextComponent>
            </Column>
          </Row>
        </Column>
      </Row>
    </Box>
  );
}

function StatItem({ label, value, subtitle }: any) {
  return (
    <Column gap="xs" style={{ flex: 1, alignItems: 'center', paddingVertical: theme.spacing.md }}>
      <TextComponent variant="h3" color="navy" style={{ fontWeight: '700' }}>
        {value}
      </TextComponent>
      <TextComponent variant="caption" color="textSecondary">{label}</TextComponent>
      <TextComponent variant="caption" color="textTertiary">{subtitle}</TextComponent>
    </Column>
  );
}