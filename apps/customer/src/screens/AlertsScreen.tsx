import React from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNotifications } from '../hooks';
import { useTheme, Screen, TopBar, Text, Column, Card, Row, EmptyState, ErrorState, Skeleton, Divider } from '@trustlink/shared';
import type { RootStackParamList } from '../navigation/types';

export function AlertsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data, isLoading, isError, refetch } = useNotifications(30);

  const isTerminal = (status: string) => ['delivered', 'failed', 'returned', 'cancelled'].includes(status);

  return (
    <Screen>
      <TopBar title="Alerts" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Column gap="md">
        {isLoading ? (
          <Column gap="sm"><Skeleton height={64} /><Skeleton height={64} /><Skeleton height={64} /></Column>
        ) : isError ? (
          <ErrorState message="Couldn't load notifications." onAction={() => refetch()} />
        ) : (data ?? []).length === 0 ? (
          <EmptyState icon="🔔" title="No alerts yet" message="Status updates for your deliveries will appear here." />
        ) : (
          <Column gap="sm">
            {(data ?? []).map((n) => {
              const deliveryId = (n.data as { deliveryId?: string } | null)?.deliveryId;
              const status = (n.data as { status?: string } | null)?.status ?? '';
              const open = () => {
                if (!deliveryId) return;
                if (isTerminal(status)) navigation.navigate('Tracking', { screen: 'POD', params: { deliveryId } });
                else navigation.navigate('Tracking', { screen: 'TrackingHome', params: { deliveryId } });
              };
              return (
                <Card key={n.id} onPress={open}>
                  <Column gap="xs">
                    <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{n.title}</Text>
                    <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{n.body}</Text>
                    <Divider />
                    <Row justify="space-between">
                      <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{n.channel}</Text>
                      <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{n.createdAt ? new Date(n.createdAt).toDateString() : ''}</Text>
                    </Row>
                  </Column>
                </Card>
              );
            })}
          </Column>
        )}
      </Column>
      </ScrollView>
    </Screen>
  );
}
