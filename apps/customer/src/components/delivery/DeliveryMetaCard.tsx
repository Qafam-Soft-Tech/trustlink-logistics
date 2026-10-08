import React from 'react';
import type { Delivery } from '@trustlink/shared';
import { Card, Column, Row, Text, RouteSummaryCard, useTheme, formatNaira, estimateDistanceKm, estimateEtaMinutes } from '@trustlink/shared';

export function MetaRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <Row justify="space-between" align="start" gap="md">
      <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{label}</Text>
      <Text variant="bodySmall" color="inherit" style={{ flex: 1, textAlign: 'right', color: theme.roles.text }}>{value}</Text>
    </Row>
  );
}

/** Route + package + people + fare for a delivery. Shared by the terminal and detail screens. */
export function DeliveryMetaCard({ delivery }: { delivery: Delivery }) {
  const distanceKm = estimateDistanceKm(delivery.pickupArea, delivery.dropoffArea);
  return (
    <Column gap="md">
      <RouteSummaryCard
        pickupArea={delivery.pickupArea ?? 'Pickup'}
        dropoffArea={delivery.dropoffArea ?? 'Drop-off'}
        distanceKm={distanceKm}
        etaMinutes={estimateEtaMinutes(distanceKm)}
      />
      <Card>
        <Column gap="md">
          <MetaRow label="Tracking number" value={delivery.trackingNumber} />
          <MetaRow label="Package" value={`${delivery.packageType === 'document' ? 'Document' : 'Parcel'} · ${delivery.packageWeight} kg`} />
          {delivery.packageDescription ? <MetaRow label="Description" value={delivery.packageDescription} /> : null}
          <MetaRow label="Recipient" value={`${delivery.recipientName} · ${delivery.recipientPhone}`} />
          <MetaRow label="Sender" value={delivery.senderName} />
          <MetaRow label="Fare" value={formatNaira(delivery.fare ?? 0)} />
        </Column>
      </Card>
    </Column>
  );
}
