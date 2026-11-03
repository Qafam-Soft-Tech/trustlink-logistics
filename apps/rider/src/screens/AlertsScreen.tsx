import React from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useTheme, Screen, TopBar, Text, Card, Column, Row, Banner, Skeleton, EmptyState, ErrorState, formatDate } from '@trustlink/shared';
import { errorCopy, isOffline } from '@trustlink/shared';
import { useMyNotifications } from '../hooks';

export function AlertsScreen() {
  const { theme } = useTheme();
  const notifications = useMyNotifications(30);
  const items = notifications.data ?? [];
  const offline = isOffline(notifications.error);

  return (
    <Screen>
      <TopBar title="Alerts" />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={notifications.isFetching} onRefresh={() => { void notifications.refetch(); }} tintColor={theme.roles.primaryAction} />}
      >
        <Banner
          variant="info"
          title="In-app alerts"
          message="Push is off in R1 — dispatch updates appear here, and important ones are also sent to your phone by SMS."
        />

        {notifications.isLoading ? (
          <Column gap="sm"><Skeleton height={72} /><Skeleton height={72} /></Column>
        ) : notifications.isError && !offline ? (
          <ErrorState message={errorCopy(notifications.error, 'notifications').message} onAction={() => notifications.refetch()} />
        ) : notifications.isError ? (
          <Banner variant="offline" message="You're offline. Your alerts will load when you're back online." />
        ) : items.length === 0 ? (
          <EmptyState icon="🔔" title="No alerts yet" message="Dispatch and delivery updates will appear here." />
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <Column gap="xs">
                <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{item.title}</Text>
                <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{item.body}</Text>
                <Row justify="space-between" align="center">
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                    {item.channel === 'sms' ? 'SMS' : item.channel === 'push' ? 'Push' : 'Email'}
                  </Text>
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{formatDate(item.createdAt)}</Text>
                </Row>
                {item.channel === 'sms' ? (
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.primaryAction }}>Also sent to your phone by SMS.</Text>
                ) : null}
              </Column>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
