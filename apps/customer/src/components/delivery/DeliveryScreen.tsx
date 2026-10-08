import React from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Delivery } from '@trustlink/shared';
import { Screen, TopBar, Column, Skeleton, EmptyState, ErrorState } from '@trustlink/shared';
import { useDelivery } from '../../hooks';
import type { RootStackParamList, TrackingStackParamList } from '../../navigation/types';

/**
 * Chrome + loading/empty/error handling shared by the terminal and detail screens.
 * Children receive the loaded delivery (never undefined).
 */
export function DeliveryScreen({ deliveryId, title, children, footer }: {
  deliveryId: string;
  title: string;
  children: (delivery: Delivery) => React.ReactNode;
  footer?: (delivery: Delivery) => React.ReactNode;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<TrackingStackParamList>>();
  const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const { data, isLoading, isError, error, refetch } = useDelivery(deliveryId);
  const back = () => navigation.goBack();
  const toDeliveries = () => root?.navigate('Main', { screen: 'Deliveries' });

  if (isLoading) {
    return (
      <Screen>
        <TopBar title={title} showBack onBack={back} />
        <Column gap="md" style={{ padding: 16 }}>
          <Skeleton height={96} />
          <Skeleton height={140} />
          <Skeleton height={120} />
        </Column>
      </Screen>
    );
  }

  const notFound = (error as Error | null)?.name === 'NotFoundError';
  if (isError || !data) {
    return (
      <Screen>
        <TopBar title={title} showBack onBack={back} />
        <Column style={{ padding: 16 }}>
          {notFound ? (
            <EmptyState icon="🔎" title="Delivery not found" message="We couldn't find that delivery." actionLabel="Go to deliveries" onAction={toDeliveries} />
          ) : (
            <ErrorState message="Couldn't load this delivery." onAction={() => refetch()} />
          )}
        </Column>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title={title} showBack onBack={back} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Column gap="lg">{children(data)}</Column>
      </ScrollView>
      {footer ? <Column style={{ padding: 16, gap: 8 }}>{footer(data)}</Column> : null}
    </Screen>
  );
}
