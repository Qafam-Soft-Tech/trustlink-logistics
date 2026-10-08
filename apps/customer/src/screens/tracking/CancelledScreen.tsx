import React from 'react';
import { Banner, Row, Text, StatusBadge, useTheme } from '@trustlink/shared';
import { DeliveryScreen } from '../../components/delivery/DeliveryScreen';
import { HeroStatus } from '../../components/delivery/HeroStatus';
import { DeliveryMetaCard } from '../../components/delivery/DeliveryMetaCard';
import { DeliveryReceiptCard } from '../../components/delivery/DeliveryReceiptCard';
import { TrackingProgressCard } from '../../components/delivery/TrackingProgressCard';
import { SendAgainButton } from '../../components/delivery/SendAgainButton';

export function CancelledScreen({ route }: { route: { params: { deliveryId: string } } }) {
  const { theme } = useTheme();
  const deliveryId = route.params.deliveryId;

  return (
    <DeliveryScreen
      deliveryId={deliveryId}
      title="Cancelled"
      footer={(delivery) => <SendAgainButton delivery={delivery} />}
    >
      {(delivery) => (
        <>
          <Row justify="space-between" align="center">
            <StatusBadge status={delivery.status} />
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{delivery.trackingNumber}</Text>
          </Row>

          <HeroStatus
            glyph="✕"
            tone="warning"
            heading="Cancelled"
            message="This delivery was cancelled and no rider was assigned."
          />

          <Banner
            variant="info"
            title="Refund"
            message="Any amount due back goes to your original payment method. Contact support if it hasn't arrived within 5 business days."
          />

          <DeliveryMetaCard delivery={delivery} />
          <DeliveryReceiptCard delivery={delivery} />
          <TrackingProgressCard events={delivery.events} />

          <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
            Cancelled deliveries keep their history here for your records.
          </Text>
        </>
      )}
    </DeliveryScreen>
  );
}
