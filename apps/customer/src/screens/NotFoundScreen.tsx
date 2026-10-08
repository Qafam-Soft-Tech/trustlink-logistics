import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen, TopBar, EmptyState } from '@trustlink/shared';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'NotFound'>;

export function NotFoundScreen({ navigation, route }: Props) {
  return (
    <Screen>
      <TopBar title="Not found" showBack onBack={() => navigation.goBack()} />
      <EmptyState
        icon="🔎"
        title="We couldn't find that"
        message={route.params?.trackingNumber ? `No delivery matches ${route.params.trackingNumber}.` : 'That delivery could not be found.'}
        actionLabel="Back to home"
        onAction={() => navigation.navigate('HomeFeed')}
      />
    </Screen>
  );
}
