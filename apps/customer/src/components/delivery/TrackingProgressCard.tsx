import React from 'react';
import type { DeliveryEvent } from '@trustlink/shared';
import { Card, Column, Text, StatusTimeline, useTheme } from '@trustlink/shared';

/** Status history for a completed delivery. */
export function TrackingProgressCard({ events }: { events?: DeliveryEvent[] }) {
  const { theme } = useTheme();
  return (
    <Card>
      <Column gap="md">
        <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Progress</Text>
        {events && events.length > 0 ? (
          <StatusTimeline events={events} />
        ) : (
          <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>No status updates recorded.</Text>
        )}
      </Column>
    </Card>
  );
}
