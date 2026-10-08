import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Banner, Card, Column, Input, PhoneInput, isServiceableArea, validateStep, type StepErrors } from '@trustlink/shared';
import { AddressPicker } from '../../components/AddressPicker';
import type { NewDeliveryStackParamList } from '../../navigation/types';
import { useNewDeliveryDraft } from './DraftContext';
import { StepScreen } from './StepScreen';

type Props = NativeStackScreenProps<NewDeliveryStackParamList, 'Dropoff'>;

export function DropoffScreen({ navigation }: Props) {
  const { draft, dispatch } = useNewDeliveryDraft();
  const [errors, setErrors] = useState<StepErrors>({});

  const outOfArea = Boolean(draft.dropoff.area) && !isServiceableArea(draft.dropoff.area);

  const onContinue = () => {
    const next = validateStep('Drop-off', draft);
    setErrors(next);
    if (Object.keys(next).length === 0) navigation.navigate('Package');
  };

  return (
    <StepScreen
      title="Drop-off & recipient"
      step={1}
      navigation={navigation}
      footer={
        <Column style={{ padding: 16 }}>
          <Button variant="primary" size="lg" disabled={outOfArea} onPress={onContinue}>Continue</Button>
        </Column>
      }
    >
      <AddressPicker title="Where is it going?" value={draft.dropoff} onChange={(value) => dispatch({ type: 'setDropoff', value })} />
      {outOfArea ? <Banner variant="warning" title="Out of area" message={`We don't deliver to ${draft.dropoff.area} yet. Choose another address.`} /> : null}
      {errors.dropoff ? <Banner variant="error" message={errors.dropoff} /> : null}

      <Card>
        <Column gap="lg">
          <Input
            label="Recipient name"
            value={draft.recipient.name}
            onChangeText={(name) => dispatch({ type: 'patchRecipient', patch: { name } })}
            placeholder="Chinedu Obi"
            error={errors.recipientName}
          />
          <PhoneInput
            label="Recipient phone"
            value={draft.recipient.phone}
            onChangeText={(phone) => dispatch({ type: 'patchRecipient', patch: { phone } })}
            error={errors.recipientPhone}
          />
        </Column>
      </Card>
    </StepScreen>
  );
}
