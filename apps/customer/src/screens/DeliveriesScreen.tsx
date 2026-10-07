import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDeliveries } from '../hooks';
import { useTheme, Screen, TopBar, Text, Column, Row, Divider, Card, StatusBadge, EmptyState, ErrorState, Skeleton } from '@trustlink/shared';
import type { RootStackParamList } from '../navigation/types';

export function DeliveriesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data, isLoading, isError, refetch } = useDeliveries();

  const active = (data ?? []).filter((d) => !['delivered', 'cancelled', 'returned'].includes(d.status));
  const past = (data ?? []).filter((d) => ['delivered', 'cancelled', 'returned'].includes(d.status));

  return (
    <Screen>
      <TopBar title="Deliveries" />
      <Column style={{ flex: 1, padding: 16 }} gap="md">
        {isLoading ? (
          <Column gap="sm"><Skeleton height={72} /><Skeleton height={72} /><Skeleton height={72} /></Column>
        ) : isError ? (
          <ErrorState message="Couldn't load your deliveries." onAction={() => refetch()} />
        ) : (data ?? []).length === 0 ? (
          <EmptyState icon="📦" title="No deliveries yet" message="Your deliveries will appear here." actionLabel="Send a package" onAction={() => navigation.navigate('NewDelivery')} />
        ) : (
          <>
            <Section title="Active" items={active} onOpen={(id) => navigation.navigate('Tracking', { screen: 'TrackingHome', params: { deliveryId: id } })} />
            <Divider label="Completed" />
            <Section title="Completed" items={past} onOpen={(id) => navigation.navigate('Tracking', { screen: 'POD', params: { deliveryId: id } })} />
          </>
        )}
      </Column>
    </Screen>
  );
}

function Section({ title, items, onOpen }: { title: string; items: any[]; onOpen: (id: string) => void }) {
  const { theme } = useTheme();
  if (items.length === 0) {
    return <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>No {title.toLowerCase()} deliveries.</Text>;
  }
  return (
    <Column gap="sm">
      {items.map((d) => (
        <Card key={d.id} onPress={() => onOpen(d.id)}>
          <Row justify="space-between" align="center">
            <Column gap="xs">
              <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{d.trackingNumber}</Text>
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{d.pickupArea} → {d.dropoffArea}</Text>
            </Column>
            <StatusBadge status={d.status} />
          </Row>
        </Card>
      ))}
    </Column>
  );
}
