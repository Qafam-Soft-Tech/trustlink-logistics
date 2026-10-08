import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Banner, Column, isServiceableArea, validateStep, type StepErrors } from '@trustlink/shared';
import { AddressPicker } from '../../components/AddressPicker';
import type { NewDeliveryStackParamList } from '../../navigation/types';
import { useNewDeliveryDraft } from './DraftContext';
import { StepScreen } from './StepScreen';

type Props = NativeStackScreenProps<NewDeliveryStackParamList, 'Pickup'>;

export function PickupScreen({ navigation }: Props) {
  const { draft, dispatch } = useNewDeliveryDraft();
  const [errors, setErrors] = useState<StepErrors>({});

  const outOfArea = Boolean(draft.pickup.area) && !isServiceableArea(draft.pickup.area);

  const onContinue = () => {
    const next = validateStep('Pickup', draft);
    setErrors(next);
    if (Object.keys(next).length === 0) navigation.navigate('Dropoff');
  };

  return (
    <StepScreen
      title="Pickup"
      step={0}
      navigation={navigation}
      footer={
        <Column style={{ padding: 16 }}>
          <Button variant="primary" size="lg" disabled={outOfArea} onPress={onContinue}>Continue</Button>
        </Column>
      }
    >
      <AddressPicker title="Where should we pick up?" value={draft.pickup} onChange={(value) => dispatch({ type: 'setPickup', value })} />
      {outOfArea ? <Banner variant="warning" title="Out of area" message={`We don't deliver to ${draft.pickup.area} yet. Choose another address.`} /> : null}
      {errors.pickup ? <Banner variant="error" message={errors.pickup} /> : null}
    </StepScreen>
  );
}
