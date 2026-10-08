import React from 'react';
import { Banner, Column, Row, Text, StatusBadge, PodCard, useTheme } from '@trustlink/shared';
import { useDeliveryProof } from '../../hooks';
import { DeliveryScreen } from '../../components/delivery/DeliveryScreen';
import { HeroStatus } from '../../components/delivery/HeroStatus';
import { DeliveryMetaCard } from '../../components/delivery/DeliveryMetaCard';
import { DeliveryReceiptCard } from '../../components/delivery/DeliveryReceiptCard';
import { TrackingProgressCard } from '../../components/delivery/TrackingProgressCard';
import { SendAgainButton } from '../../components/delivery/SendAgainButton';

export function PodScreen({ route }: { route: { params: { deliveryId: string } } }) {
  const { theme } = useTheme();
  const deliveryId = route.params.deliveryId;
  const proof = useDeliveryProof(deliveryId);

  return (
    <DeliveryScreen
      deliveryId={deliveryId}
      title="Delivered"
      footer={(delivery) => <SendAgainButton delivery={delivery} />}
    >
      {(delivery) => (
        <>
          <Row justify="space-between" align="center">
            <StatusBadge status={delivery.status} />
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{delivery.trackingNumber}</Text>
          </Row>

          <HeroStatus glyph="✓" tone="success" heading="Delivered" message="This package was delivered successfully." />

          {proof.isLoading ? (
            <Banner variant="info" title="Proof of delivery" message="Loading delivery proof…" />
          ) : proof.data ? (
            <PodCard pod={proof.data} />
          ) : (
            <Banner variant="info" title="Proof unavailable" message="Delivery proof hasn't been recorded for this delivery yet." />
          )}

          <DeliveryMetaCard delivery={delivery} />
          <DeliveryReceiptCard delivery={delivery} pod={proof.data} />
          <TrackingProgressCard events={delivery.events} />
        </>
      )}
    </DeliveryScreen>
  );
}
