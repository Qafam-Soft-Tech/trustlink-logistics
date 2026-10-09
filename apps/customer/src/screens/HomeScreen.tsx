import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Screen, TopBar, Text, Button, Card, Column, Row, Divider, StatusBadge, Skeleton, EmptyState, ErrorState, Banner, Avatar, Input } from '@trustlink/shared';
import { isOffline } from '@trustlink/shared';
import { useProfile, useDeliveries } from '../hooks';
import type { HomeStackParamList, RootStackParamList } from '../navigation/types';

type HomeNav = NativeStackNavigationProp<HomeStackParamList>;
const ACTIVE = ['requested', 'searching', 'assigned', 'picked_up', 'in_transit'];

export function HomeScreen() {
  const { theme } = useTheme();
  const homeNav = useNavigation<HomeNav>();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const profile = useProfile();
  const deliveries = useDeliveries();
  const [trackingInput, setTrackingInput] = useState('');

  const name = profile.data?.firstName ?? 'there';
  const all = deliveries.data ?? [];
  const active = all.filter((d) => ACTIVE.includes(d.status));
  const recents = all.filter((d) => !ACTIVE.includes(d.status)).slice(0, 3);
  const offline = isOffline(deliveries.error);
  const loading = deliveries.isLoading || profile.isLoading;

  const openDelivery = (id: string) => rootNav.navigate('Tracking', { screen: 'TrackingHome', params: { deliveryId: id } });

  return (
    <Screen>
      <TopBar
        title="Home"
        rightAction={<Ionicons name="notifications-outline" size={24} color={theme.roles.primaryAction} />}
        onRightPress={() => rootNav.navigate('Main', { screen: 'Alerts' })}
      />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Column gap="lg">
          <Row justify="space-between" align="center">
          <Column gap="xs">
            <Text variant="h3" color="inherit" style={{ color: theme.roles.text }}>Welcome back, {name}</Text>
            <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>Ready to send a package?</Text>
          </Column>
          <Avatar size="md" name={`${profile.data?.firstName ?? ''} ${profile.data?.lastName ?? ''}`.trim() || 'Customer'} />
        </Row>

        <Button variant="primary" size="lg" leftIcon={<Ionicons name="add-circle-outline" size={22} color={theme.roles.primaryActionText} />} onPress={() => rootNav.navigate('NewDelivery')}>
          Send a package
        </Button>

        <Card>
          <Column gap="md">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Track by number</Text>
            <Row gap="sm" align="end">
              <Column style={{ flex: 1 }}>
                <Input placeholder="TLK-2026-001" value={trackingInput} onChangeText={setTrackingInput} autoCapitalize="characters" />
              </Column>
              <Button variant="outline" size="md" onPress={() => homeNav.navigate('TrackByNumber', { trackingNumber: trackingInput.trim() })}>Track</Button>
            </Row>
          </Column>
        </Card>

        {offline ? <Banner variant="offline" message="You're offline. Showing saved data." /> : null}

        <Card>
          <Column gap="md">
            <Row justify="space-between" align="center">
              <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Active deliveries</Text>
              <Button variant="ghost" size="sm" onPress={() => rootNav.navigate('Main', { screen: 'Deliveries' })}>
                <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.primaryAction }}>View all</Text>
              </Button>
            </Row>
            {loading ? (
              <Column gap="sm"><Skeleton height={64} /><Skeleton height={64} /></Column>
            ) : deliveries.isError && !offline ? (
              <ErrorState message="Couldn't load your deliveries." onAction={() => deliveries.refetch()} />
            ) : active.length === 0 ? (
              <EmptyState icon="📦" title="No active deliveries" message="Send a package to get started." actionLabel="Send a package" onAction={() => rootNav.navigate('NewDelivery')} />
            ) : (
              <Column gap="sm">
                {active.map((d) => (
                  <Card key={d.id} elevation="none" onPress={() => openDelivery(d.id)}>
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
            )}
          </Column>
        </Card>

        {recents.length > 0 ? (
          <Card>
            <Column gap="md">
              <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Recent</Text>
              <Column gap="sm">
                {recents.map((d) => (
                  <Card key={d.id} elevation="none" onPress={() => openDelivery(d.id)}>
                    <Row justify="space-between" align="center">
                      <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textSecondary }}>{d.trackingNumber} · {d.dropoffArea}</Text>
                      <StatusBadge status={d.status} />
                    </Row>
                  </Card>
                ))}
              </Column>
            </Column>
          </Card>
        ) : null}

        <Card>
          <Column gap="md">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Quick actions</Text>
            <Row gap="md">
              <Button variant="outline" size="md" style={{ flex: 1 }} leftIcon={<Ionicons name="location-outline" size={20} color={theme.roles.primaryAction} />} onPress={() => homeNav.navigate('SavedAddresses')}>
                Addresses
              </Button>
              <Button variant="outline" size="md" style={{ flex: 1 }} leftIcon={<Ionicons name="time-outline" size={20} color={theme.roles.primaryAction} />} onPress={() => rootNav.navigate('Main', { screen: 'Deliveries' })}>
                Deliveries
              </Button>
            </Row>
          </Column>
        </Card>

        <Divider />
        <Row justify="center">
          <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Secure. Swift. Strategic.</Text>
        </Row>
        </Column>
      </ScrollView>
    </Screen>
  );
}
