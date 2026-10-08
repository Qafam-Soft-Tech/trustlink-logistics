import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Input, Column, Card, StatusBadge, Banner } from '@trustlink/shared';
import { useTrackDelivery } from '../hooks';
import type { HomeStackParamList, RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'TrackByNumber'>;

export function TrackByNumberScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [value, setValue] = useState(route.params?.trackingNumber ?? '');
  const track = useTrackDelivery();

  const submit = () => {
    if (!value.trim()) return;
    track.mutate(value.trim());
  };

  return (
    <Screen>
      <TopBar title="Track a package" showBack onBack={() => navigation.goBack()} />
      <Column style={{ flex: 1, padding: 16 }} gap="md">
        <Text variant="body" color="inherit" style={{ color: theme.roles.textSecondary }}>
          Enter a tracking number (e.g. TLK-2026-001). You must be signed in.
        </Text>
        <Input label="Tracking number" value={value} onChangeText={setValue} autoCapitalize="characters" placeholder="TLK-2026-001" />
        <Button variant="primary" size="lg" loading={track.isPending} onPress={submit}>Track</Button>

        {track.isError ? (
          <Column gap="md">
            <Banner variant="error" title="Not found" message="We couldn't find a delivery with that number." />
            <Button variant="outline" size="md" onPress={() => navigation.navigate('NotFound', { trackingNumber: value.trim() })}>See details</Button>
          </Column>
        ) : track.isSuccess && track.data ? (
          <Card onPress={() => rootNav.navigate('Tracking', { screen: 'TrackingHome', params: { deliveryId: track.data!.id } })}>
            <Column gap="sm">
              <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{track.data.trackingNumber}</Text>
              <StatusBadge status={track.data.status} />
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{track.data.pickupArea} → {track.data.dropoffArea}</Text>
              <Text variant="caption" color="inherit" style={{ color: theme.roles.primaryAction }}>Open tracking</Text>
            </Column>
          </Card>
        ) : (
          <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
            Enter a number above to see its status.
          </Text>
        )}
      </Column>
    </Screen>
  );
}
