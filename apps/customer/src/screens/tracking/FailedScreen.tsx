import React from 'react';
import { Banner, Row, Text, StatusBadge, useTheme, failureReasonCopy, REDELIVERY_NOTICE } from '@trustlink/shared';
import { DeliveryScreen } from '../../components/delivery/DeliveryScreen';
import { HeroStatus } from '../../components/delivery/HeroStatus';
import { DeliveryMetaCard } from '../../components/delivery/DeliveryMetaCard';
import { DeliveryReceiptCard } from '../../components/delivery/DeliveryReceiptCard';
import { TrackingProgressCard } from '../../components/delivery/TrackingProgressCard';
import { SendAgainButton } from '../../components/delivery/SendAgainButton';

export function FailedScreen({ route }: { route: { params: { deliveryId: string } } }) {
  const { theme } = useTheme();
  const deliveryId = route.params.deliveryId;

  return (
    <DeliveryScreen
      deliveryId={deliveryId}
      title="Delivery unsuccessful"
      footer={(delivery) => <SendAgainButton delivery={delivery} />}
    >
      {(delivery) => (
        <>
          <Row justify="space-between" align="center">
            <StatusBadge status={delivery.status} />
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{delivery.trackingNumber}</Text>
          </Row>

          <HeroStatus
            glyph="!"
            tone="danger"
            heading="Delivery unsuccessful"
            message={failureReasonCopy(delivery.failureReason)}
          />

          <Banner variant="info" title="What happens next" message={REDELIVERY_NOTICE} />

          <DeliveryMetaCard delivery={delivery} />
          <DeliveryReceiptCard delivery={delivery} />
          <TrackingProgressCard events={delivery.events} />

          <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
            You don't need to do anything — redelivery is arranged by TrustLink.
          </Text>
        </>
      )}
    </DeliveryScreen>
  );
}
