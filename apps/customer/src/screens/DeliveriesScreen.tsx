import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useTheme,
  Screen,
  TopBar,
  Text,
  Button,
  Column,
  Row,
  Card,
  Input,
  Banner,
  StatusBadge,
  EmptyState,
  ErrorState,
  Skeleton,
  formatNaira,
  terminalScreenFor,
  type Delivery,
  type DeliveryStatus,
} from '@trustlink/shared';
import { useDeliveries } from '../hooks';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackNavigationProp<RootStackParamList>;

const ACTIVE: DeliveryStatus[] = ['requested', 'searching', 'assigned', 'picked_up', 'in_transit'];
const COMPLETED: DeliveryStatus[] = ['delivered'];
const CLOSED: DeliveryStatus[] = ['failed', 'returned', 'cancelled'];
/** History grows unboundedly; render incrementally (a paginated history route is still a backend gap — SC-26). */
const PAGE_SIZE = 8;

export function DeliveriesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<Props>();
  const { data, isLoading, isError, error, refetch } = useDeliveries();
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  const offline = (error as Error | null)?.name === 'OfflineError';
  const all = data ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((d) =>
      [d.trackingNumber, d.pickupArea, d.dropoffArea, d.recipientName, d.recipientPhone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [all, query]);

  const shown = filtered.slice(0, visibleCount);
  const active = shown.filter((d) => ACTIVE.includes(d.status));
  const completed = shown.filter((d) => COMPLETED.includes(d.status));
  const closed = shown.filter((d) => CLOSED.includes(d.status));
  const remaining = filtered.length - shown.length;

  const open = (delivery: Delivery) => {
    if (ACTIVE.includes(delivery.status)) {
      navigation.navigate('Tracking', { screen: 'TrackingHome', params: { deliveryId: delivery.id } });
      return;
    }
    navigation.navigate('Tracking', { screen: terminalScreenFor(delivery.status), params: { deliveryId: delivery.id } });
  };

  return (
    <Screen>
      <TopBar title="Deliveries" />
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Column gap="md">
          <Input
            placeholder="Search by tracking number, area or recipient"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />

          {offline ? <Banner variant="offline" message="You're offline. Showing saved deliveries." /> : null}

          {isLoading ? (
            <Column gap="sm"><Skeleton height={72} /><Skeleton height={72} /><Skeleton height={72} /></Column>
          ) : isError && !offline ? (
            <ErrorState message="Couldn't load your deliveries." onAction={() => refetch()} />
          ) : all.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No deliveries yet"
              message="Your deliveries will appear here."
              actionLabel="Send a package"
              onAction={() => navigation.navigate('NewDelivery')}
            />
          ) : filtered.length === 0 ? (
            <EmptyState icon="🔎" title="No matches" message={`Nothing matches “${query.trim()}”.`} actionLabel="Clear search" onAction={() => setQuery('')} />
          ) : (
            <>
              <Section title="Active" items={active} onOpen={open} emptyText="No active deliveries." />
              <Section title="Completed" items={completed} onOpen={open} emptyText="No completed deliveries yet." />
              <Section title="Cancelled & failed" items={closed} onOpen={open} emptyText="Nothing cancelled or failed." />

              {remaining > 0 ? (
                <Button variant="outline" size="md" onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                  {`Show more (${remaining})`}
                </Button>
              ) : null}

              <Button variant="primary" size="lg" onPress={() => navigation.navigate('NewDelivery')}>Send a package</Button>
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                History is filtered from your deliveries — there's no separate history endpoint.
              </Text>
            </>
          )}
        </Column>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, items, onOpen, emptyText }: { title: string; items: Delivery[]; onOpen: (d: Delivery) => void; emptyText: string }) {
  const { theme } = useTheme();
  return (
    <Column gap="sm">
      <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{title}</Text>
      {items.length === 0 ? (
        <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>{emptyText}</Text>
      ) : (
        items.map((d) => (
          <Card key={d.id} onPress={() => onOpen(d)}>
            <Row justify="space-between" align="center">
              <Column gap="xs" style={{ flex: 1 }}>
                <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{d.trackingNumber}</Text>
                <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                  {d.pickupArea} → {d.dropoffArea} · {formatNaira(d.fare ?? 0)}
                </Text>
              </Column>
              <StatusBadge status={d.status} />
            </Row>
          </Card>
        ))
      )}
    </Column>
  );
}
