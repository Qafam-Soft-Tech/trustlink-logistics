import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Delivery } from '@trustlink/shared';
import { Button, draftFromDelivery } from '@trustlink/shared';
import { setNewDeliveryPrefill } from '../../screens/newdelivery/prefill';
import type { RootStackParamList } from '../../navigation/types';

/** "Send again" — prefill a new request from a past delivery. The customer never triggers redelivery. */
export function SendAgainButton({ delivery }: { delivery: Delivery }) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Button
      variant="primary"
      size="lg"
      onPress={() => {
        setNewDeliveryPrefill(draftFromDelivery(delivery));
        nav.navigate('NewDelivery');
      }}
    >
      Send again
    </Button>
  );
}
