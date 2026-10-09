import React, { useState } from 'react';
import { Image, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  useTheme,
  Screen,
  TopBar,
  Text,
  Button,
  Card,
  Column,
  Row,
  Chip,
  Banner,
  Input,
  StepIndicator,
  isValidNin,
  type VehicleType,
} from '@trustlink/shared';
import { useSubmitKyc } from '../../hooks';
import type { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'KycForm'>;

const STEPS = ['NIN', 'ID front', 'ID back', 'Selfie', 'Vehicle'] as const;
const VEHICLES: Array<{ value: VehicleType; label: string }> = [
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
];

export function KycFormScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const submit = useSubmitKyc();

  const [step, setStep] = useState(0);
  const [review, setReview] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const [nin, setNin] = useState('');
  const [idFront, setIdFront] = useState<string | undefined>();
  const [idBack, setIdBack] = useState<string | undefined>();
  const [selfie, setSelfie] = useState<string | undefined>();
  const [vehicleReg, setVehicleReg] = useState<string | undefined>();
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');
  const [plate, setPlate] = useState('');

  const pick = async (setter: (uri: string) => void, camera: boolean) => {
    setError(undefined);
    const permission = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(camera ? 'Camera permission is needed to take a photo.' : 'Photo access is needed to attach a document.');
      return;
    }
    const result = camera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets[0]) setter(result.assets[0].uri);
  };

  const validateStep = (): string | undefined => {
    if (step === 0 && !isValidNin(nin)) return 'Enter your 11-digit NIN';
    if (step === 1 && !idFront) return 'Attach the front of your government ID';
    if (step === 2 && !idBack) return 'Attach the back of your government ID';
    if (step === 3 && !selfie) return 'Attach a selfie holding your ID';
    if (step === 4) {
      if (!vehicleReg) return 'Attach your vehicle registration';
      if (!plate.trim()) return 'Enter your vehicle plate number';
    }
    return undefined;
  };

  const next = () => {
    const problem = validateStep();
    setError(problem);
    if (problem) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else setReview(true);
  };

  const doSubmit = () => {
    setError(undefined);
    submit.mutate(
      {
        nin,
        idType: 'nin',
        idFrontUrl: idFront as string,
        idBackUrl: idBack as string,
        selfieUrl: selfie as string,
        vehicleRegistrationUrl: vehicleReg as string,
        vehicleType,
        vehiclePlate: plate.trim().toUpperCase(),
      },
      {
        onSuccess: () => navigation.goBack(),
        onError: (e: unknown) => setError((e as Error).message || 'Could not submit your documents.'),
      },
    );
  };

  const renderPicker = (label: string, uri: string | undefined, setter: (value: string) => void) => (
    <Card>
      <Column gap="md">
        <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{label}</Text>
        {uri ? (
          <Image source={{ uri }} style={{ width: '100%', height: 180, borderRadius: theme.borderRadius.md }} resizeMode="cover" />
        ) : (
          <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>No photo attached yet.</Text>
        )}
        <Row gap="sm">
          <Button variant="outline" size="md" style={{ flex: 1 }} onPress={() => pick(setter, false)}>Gallery</Button>
          <Button variant="primary" size="md" style={{ flex: 1 }} onPress={() => pick(setter, true)}>Camera</Button>
        </Row>
      </Column>
    </Card>
  );

  return (
    <Screen>
      <TopBar title="KYC verification" showBack onBack={() => navigation.goBack()} />
      <StepIndicator steps={STEPS} current={review ? STEPS.length - 1 : step} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        {review ? (
          <>
            <Card>
              <Column gap="md">
                <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Review your submission</Text>
                <Row justify="space-between"><Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>NIN</Text><Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{nin}</Text></Row>
                <Row justify="space-between"><Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>ID front</Text><Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{idFront ? 'Attached' : '—'}</Text></Row>
                <Row justify="space-between"><Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>ID back</Text><Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{idBack ? 'Attached' : '—'}</Text></Row>
                <Row justify="space-between"><Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Selfie</Text><Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{selfie ? 'Attached' : '—'}</Text></Row>
                <Row justify="space-between"><Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Vehicle registration</Text><Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{vehicleReg ? 'Attached' : '—'}</Text></Row>
                <Row justify="space-between"><Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Vehicle</Text><Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{vehicleType} · {plate.toUpperCase()}</Text></Row>
              </Column>
            </Card>
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
              Submitting sends your documents for review. You'll be notified in the app once a decision is made.
            </Text>
          </>
        ) : (
          <>
            {step === 0 ? (
              <Card>
                <Column gap="lg">
                  <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>National Identification Number</Text>
                  <Input
                    label="NIN"
                    value={nin}
                    onChangeText={(value) => setNin(value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="12345678901"
                    keyboardType="number-pad"
                    error={error}
                  />
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>11 digits, as printed on your NIN slip or national ID card.</Text>
                </Column>
              </Card>
            ) : null}

            {step === 1 ? renderPicker('Government ID — front', idFront, setIdFront) : null}
            {step === 2 ? renderPicker('Government ID — back', idBack, setIdBack) : null}
            {step === 3 ? renderPicker('Selfie holding your ID', selfie, setSelfie) : null}

            {step === 4 ? (
              <>
                {renderPicker('Vehicle registration', vehicleReg, setVehicleReg)}
                <Card>
                  <Column gap="lg">
                    <Column gap="sm">
                      <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Vehicle type</Text>
                      <Row gap="sm" style={{ flexWrap: 'wrap' }} justify="start">
                        {VEHICLES.map((vehicle) => (
                          <Chip key={vehicle.value} label={vehicle.label} selected={vehicleType === vehicle.value} onPress={() => setVehicleType(vehicle.value)} />
                        ))}
                      </Row>
                    </Column>
                    <Input label="Plate number" value={plate} onChangeText={setPlate} placeholder="ABC 123 XY" autoCapitalize="characters" />
                  </Column>
                </Card>
              </>
            ) : null}

            {error ? <Banner variant="error" message={error} /> : null}
          </>
        )}
      </ScrollView>

      <Column style={{ padding: 16, gap: 8 }}>
        {review ? (
          <>
            <Button variant="primary" size="lg" loading={submit.isPending} onPress={doSubmit}>Submit for review</Button>
            <Button variant="ghost" size="md" onPress={() => setReview(false)}>Back to documents</Button>
          </>
        ) : (
          <Row gap="sm">
            <Button variant="outline" size="lg" style={{ flex: 1 }} disabled={step === 0} onPress={() => { setError(undefined); setStep(Math.max(0, step - 1)); }}>Back</Button>
            <Button variant="primary" size="lg" style={{ flex: 1 }} onPress={next}>{step === STEPS.length - 1 ? 'Review' : 'Continue'}</Button>
          </Row>
        )}
      </Column>
    </Screen>
  );
}
