import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Button, Banner, Card, Chip, Column, Row, Text, SegmentedControl, TextArea, WEIGHT_OPTIONS, validateStep, type PackageType, type WeightOption, type StepErrors } from '@trustlink/shared';
import type { NewDeliveryStackParamList } from '../../navigation/types';
import { useNewDeliveryDraft } from './DraftContext';
import { StepScreen } from './StepScreen';

type Props = NativeStackScreenProps<NewDeliveryStackParamList, 'Package'>;

export function PackageScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { draft, dispatch } = useNewDeliveryDraft();
  const [errors, setErrors] = useState<StepErrors>({});

  const onContinue = () => {
    const next = validateStep('Package', draft);
    setErrors(next);
    if (Object.keys(next).length === 0) navigation.navigate('Sender');
  };

  return (
    <StepScreen
      title="Package"
      step={2}
      navigation={navigation}
      footer={
        <Column style={{ padding: 16 }}>
          <Button variant="primary" size="lg" onPress={onContinue}>Continue</Button>
        </Column>
      }
    >
      <Card>
        <Column gap="lg">
          <Column gap="sm">
            <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>What are you sending?</Text>
            <SegmentedControl<PackageType>
              value={draft.packageType}
              onChange={(value) => dispatch({ type: 'setPackageType', value })}
              options={[{ label: 'Document', value: 'document' }, { label: 'Parcel', value: 'parcel' }]}
            />
          </Column>

          <Column gap="sm">
            <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Weight</Text>
            <Row gap="sm" style={{ flexWrap: 'wrap' }} justify="start">
              {WEIGHT_OPTIONS.map((w) => (
                <Chip key={w} label={`≤ ${w} kg`} selected={draft.packageWeight === w} onPress={() => dispatch({ type: 'setWeight', value: w as WeightOption })} />
              ))}
            </Row>
            {errors.packageWeight ? <Text variant="caption" color="inherit" style={{ color: theme.colors.error }}>{errors.packageWeight}</Text> : null}
          </Column>

          <TextArea
            label="Description (optional)"
            value={draft.packageDescription}
            onChangeText={(value) => dispatch({ type: 'setDescription', value })}
            placeholder={draft.packageType === 'document' ? 'e.g. Signed contracts' : 'e.g. Personal effects'}
          />
        </Column>
      </Card>

      <Banner variant="info" message="Charges are based on the weight band you pick. You'll see the exact fare before paying." />
    </StepScreen>
  );
}
