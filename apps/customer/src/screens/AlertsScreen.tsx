import React from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  useTheme,
  Screen,
  TopBar,
  Text,
  Column,
  Row,
  Card,
  Badge,
  Banner,
  EmptyState,
  ErrorState,
  Skeleton,
  formatDate,
  groupNotificationsByDay,
  notificationStatus,
  notificationStatusLabel,
  notificationSmsFallback,
  type Notification,
} from '@trustlink/shared';
import { isOffline } from '@trustlink/shared';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks';
import { alertIconFor } from './support/helpContent';
import type { RootStackParamList } from '../navigation/types';

const TERMINAL = ['delivered', 'failed', 'returned', 'cancelled'];

export function AlertsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const notifications = useNotifications(30);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const all = notifications.data ?? [];
  const offline = isOffline(notifications.error);
  const unreadCount = all.filter((n) => !n.readAt).length;
  const { today, earlier } = groupNotificationsByDay(all);

  const open = (notification: Notification) => {
    markRead.mutate(notification.id);
    const deliveryId = (notification.data as { deliveryId?: string } | null)?.deliveryId;
    if (!deliveryId) return;
    const status = notificationStatus(notification);
    // Terminal states open the details screen; active deliveries open live tracking.
    navigation.navigate('Tracking', { screen: TERMINAL.includes(status) ? 'Details' : 'TrackingHome', params: { deliveryId } });
  };

  const renderSection = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;
    return (
      <Column gap="sm">
        <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>{title}</Text>
        {items.map((notification) => {
          const unread = !notification.readAt;
          const status = notificationStatus(notification);
          const fallback = notificationSmsFallback(notification);
          return (
            <Card key={notification.id} onPress={() => open(notification)}>
              <Row gap="md" align="start">
                <Ionicons
                  name={alertIconFor(status) as never}
                  size={22}
                  color={unread ? theme.roles.primaryAction : theme.roles.textMuted}
                />
                <Column gap="xs" style={{ flex: 1 }}>
                  <Row justify="space-between" align="center" gap="sm">
                    <Text
                      variant="body"
                      color="inherit"
                      style={{ flex: 1, color: theme.roles.text, fontWeight: unread ? '600' : '400' }}
                    >
                      {notification.title}
                    </Text>
                    {unread ? <Badge variant="primary">New</Badge> : null}
                  </Row>
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{notification.body}</Text>
                  <Row gap="sm" align="center" style={{ flexWrap: 'wrap' }}>
                    <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{notificationStatusLabel(notification)}</Text>
                    <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>·</Text>
                    <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                      {notification.channel === 'sms' ? 'SMS' : notification.channel === 'push' ? 'Push' : 'Email'}
                    </Text>
                    <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>·</Text>
                    <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{formatDate(notification.createdAt)}</Text>
                  </Row>
                  {fallback ? (
                    <Text variant="caption" color="inherit" style={{ color: theme.roles.primaryAction }}>{fallback}</Text>
                  ) : null}
                </Column>
              </Row>
            </Card>
          );
        })}
      </Column>
    );
  };

  return (
    <Screen>
      <TopBar
        title="Alerts"
        rightAction={unreadCount > 0 ? <Ionicons name="checkmark-done-outline" size={22} color={theme.roles.primaryAction} /> : undefined}
        onRightPress={() => markAll.mutate()}
      />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={
          <RefreshControl refreshing={notifications.isFetching} onRefresh={() => { void notifications.refetch(); }} tintColor={theme.roles.primaryAction} />
        }
      >
        <Banner
          variant="info"
          title="In-app alerts"
          message="Push is off in R1 — status updates appear here, and important ones are also sent to your phone by SMS."
        />
        {offline ? <Banner variant="offline" message="You're offline. Showing the alerts we last loaded." /> : null}

        {notifications.isLoading ? (
          <Column gap="sm"><Skeleton height={72} /><Skeleton height={72} /><Skeleton height={72} /></Column>
        ) : notifications.isError && !offline ? (
          <ErrorState message="Couldn't load notifications." onAction={() => notifications.refetch()} />
        ) : all.length === 0 ? (
          <EmptyState icon="🔔" title="No alerts yet" message="Status updates for your deliveries will appear here." />
        ) : (
          <>
            {unreadCount > 0 ? (
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                {unreadCount} unread · tap the check to mark everything as read
              </Text>
            ) : null}
            {renderSection('Today', today)}
            {renderSection('Earlier', earlier)}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
