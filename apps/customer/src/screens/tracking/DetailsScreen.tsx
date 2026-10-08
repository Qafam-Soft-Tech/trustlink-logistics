import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Row, Text, Button, Banner, StatusBadge, useTheme, trackingHeadline, isRedeliveryScheduled, REDELIVERY_NOTICE } from '@trustlink/shared';
import { useDeliveryProof } from '../../hooks';
import { DeliveryScreen } from '../../components/delivery/DeliveryScreen';
import { HeroStatus } from '../../components/delivery/HeroStatus';
import { DeliveryMetaCard } from '../../components/delivery/DeliveryMetaCard';
import { DeliveryReceiptCard } from '../../components/delivery/DeliveryReceiptCard';
import { TrackingProgressCard } from '../../components/delivery/TrackingProgressCard';
import { SendAgainButton } from '../../components/delivery/SendAgainButton';
import type { TrackingStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<TrackingStackParamList, 'Details'>;

/** Generic delivery details — the landing screen for cancelled deliveries and terminal notifications. */
export function DetailsScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { deliveryId } = route.params;
  const proof = useDeliveryProof(deliveryId);

  return (
    <DeliveryScreen
      deliveryId={deliveryId}
      title="Delivery details"
      footer={(delivery) => <SendAgainButton delivery={delivery} />}
    >
      {(delivery) => {
        const headline = trackingHeadline(delivery.status);
        return (
          <>
            <Row justify="space-between" align="center">
              <StatusBadge status={delivery.status} />
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{delivery.trackingNumber}</Text>
            </Row>

            <HeroStatus
              heading={headline.title}
              message={headline.message}
              tone={delivery.status === 'cancelled' ? 'warning' : 'default'}
            />

            {isRedeliveryScheduled(delivery) ? (
              <Banner variant="info" title="Redelivery scheduled" message={REDELIVERY_NOTICE} />
            ) : null}

            {delivery.status === 'delivered' ? (
              <Button variant="outline" size="md" onPress={() => navigation.navigate('Pod', { deliveryId })}>View proof of delivery</Button>
            ) : null}
            {delivery.status === 'failed' ? (
              <Button variant="outline" size="md" onPress={() => navigation.navigate('Failed', { deliveryId })}>See what happened</Button>
            ) : null}
            {delivery.status === 'returned' ? (
              <Button variant="outline" size="md" onPress={() => navigation.navigate('Returned', { deliveryId })}>Return details</Button>
            ) : null}
            {delivery.status === 'cancelled' ? (
              <Button variant="outline" size="md" onPress={() => navigation.navigate('Cancelled', { deliveryId })}>Cancellation details</Button>
            ) : null}

            <DeliveryMetaCard delivery={delivery} />
            <DeliveryReceiptCard delivery={delivery} pod={proof.data} />
            <TrackingProgressCard events={delivery.events} />
          </>
        );
      }}
    </DeliveryScreen>
  );
}
