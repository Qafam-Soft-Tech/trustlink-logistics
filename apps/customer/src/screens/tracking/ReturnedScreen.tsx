import React from 'react';
import { Banner, Row, Text, StatusBadge, useTheme } from '@trustlink/shared';
import { DeliveryScreen } from '../../components/delivery/DeliveryScreen';
import { HeroStatus } from '../../components/delivery/HeroStatus';
import { DeliveryMetaCard } from '../../components/delivery/DeliveryMetaCard';
import { DeliveryReceiptCard } from '../../components/delivery/DeliveryReceiptCard';
import { TrackingProgressCard } from '../../components/delivery/TrackingProgressCard';
import { SendAgainButton } from '../../components/delivery/SendAgainButton';

export function ReturnedScreen({ route }: { route: { params: { deliveryId: string } } }) {
  const { theme } = useTheme();
  const deliveryId = route.params.deliveryId;

  return (
    <DeliveryScreen
      deliveryId={deliveryId}
      title="Returned"
      footer={(delivery) => <SendAgainButton delivery={delivery} />}
    >
      {(delivery) => (
        <>
          <Row justify="space-between" align="center">
            <StatusBadge status={delivery.status} />
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{delivery.trackingNumber}</Text>
          </Row>

          <HeroStatus
            glyph="↩"
            heading="Returned to sender"
            message="We couldn't complete this delivery, so the package is on its way back to you."
          />

          <Banner
            variant="info"
            title="What happens next"
            message="Support will follow up about the return. You can start a new request at any time."
          />

          <DeliveryMetaCard delivery={delivery} />
          <DeliveryReceiptCard delivery={delivery} />
          <TrackingProgressCard events={delivery.events} />
        </>
      )}
    </DeliveryScreen>
  );
}
