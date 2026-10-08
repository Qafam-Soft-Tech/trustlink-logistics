import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, Card, Column, Input, PhoneInput, Text, useTheme, validateStep, type StepErrors } from '@trustlink/shared';
import type { NewDeliveryStackParamList } from '../../navigation/types';
import { useNewDeliveryDraft } from './DraftContext';
import { StepScreen } from './StepScreen';

type Props = NativeStackScreenProps<NewDeliveryStackParamList, 'Sender'>;

export function SenderScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { draft, dispatch } = useNewDeliveryDraft();
  const [errors, setErrors] = useState<StepErrors>({});

  const onContinue = () => {
    const next = validateStep('Sender', draft);
    setErrors(next);
    if (Object.keys(next).length === 0) navigation.navigate('Review');
  };

  return (
    <StepScreen
      title="Sender contact"
      step={3}
      navigation={navigation}
      footer={
        <Column style={{ padding: 16 }}>
          <Button variant="primary" size="lg" onPress={onContinue}>Continue</Button>
        </Column>
      }
    >
      <Card>
        <Column gap="lg">
          <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>
            We've filled this from your profile. Edit it if someone else is sending this package.
          </Text>
          <Input
            label="Sender name"
            value={draft.sender.name}
            onChangeText={(name) => dispatch({ type: 'patchSender', patch: { name } })}
            placeholder="Amina Bello"
            error={errors.senderName}
          />
          <PhoneInput
            label="Sender phone"
            value={draft.sender.phone}
            onChangeText={(phone) => dispatch({ type: 'patchSender', patch: { phone } })}
            error={errors.senderPhone}
          />
        </Column>
      </Card>
    </StepScreen>
  );
}
