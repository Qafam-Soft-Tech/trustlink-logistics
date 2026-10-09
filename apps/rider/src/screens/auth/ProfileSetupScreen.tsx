import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, Text, Button, Card, Column, Row, Chip, Banner, Input, Avatar, isEmail, type VehicleType } from '@trustlink/shared';
import { useSetupProfile } from '../../hooks/useAuth';
import { useSession } from '../../session/SessionContext';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ProfileSetup'>;

const VEHICLES: Array<{ value: VehicleType; label: string }> = [
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
];

export function ProfileSetupScreen({ route }: Props) {
  const { theme } = useTheme();
  const { phone } = route.params;
  const setup = useSetupProfile();
  const { signIn } = useSession();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [error, setError] = useState<string | undefined>();

  const submit = () => {
    setError(undefined);
    if (!firstName.trim() || !lastName.trim()) {
      setError('Enter your first and last name');
      return;
    }
    if (!vehiclePlate.trim()) {
      setError('Enter your vehicle plate number');
      return;
    }
    if (email.trim() && !isEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    setup.mutate(
      { phone, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() || undefined, vehicleType, vehiclePlate: vehiclePlate.trim().toUpperCase() },
      {
        onSuccess: async (result) => {
          await signIn({ user: result.user, token: result.token });
        },
        onError: (e: unknown) => setError((e as Error).message || 'Could not save your profile.'),
      },
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }} keyboardShouldPersistTaps="handled">
        <Column gap="sm" align="center">
          <Avatar size="xl" name={`${firstName} ${lastName}`.trim() || 'Rider'} />
          <Text variant="h3" color="inherit" style={{ color: theme.roles.text, textAlign: 'center' }}>Set up your rider profile</Text>
          <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted, textAlign: 'center' }}>
            You'll complete KYC verification next — approval is required before you can go online.
          </Text>
        </Column>

        <Card>
          <Column gap="lg">
            <Input label="First name" value={firstName} onChangeText={setFirstName} placeholder="Emeka" autoCapitalize="words" />
            <Input label="Last name" value={lastName} onChangeText={setLastName} placeholder="Nwosu" autoCapitalize="words" />
            <Input label="Email (optional)" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
            <Input label="Phone number" value={phone} editable={false} />
          </Column>
        </Card>

        <Card>
          <Column gap="lg">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Vehicle</Text>
            <Column gap="sm">
              <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Type</Text>
              <Row gap="sm" style={{ flexWrap: 'wrap' }} justify="start">
                {VEHICLES.map((vehicle) => (
                  <Chip key={vehicle.value} label={vehicle.label} selected={vehicleType === vehicle.value} onPress={() => setVehicleType(vehicle.value)} />
                ))}
              </Row>
            </Column>
            <Input label="Plate number" value={vehiclePlate} onChangeText={setVehiclePlate} placeholder="ABC 123 XY" autoCapitalize="characters" />
          </Column>
        </Card>

        {error ? <Banner variant="error" message={error} /> : null}

        <Button variant="primary" size="lg" loading={setup.isPending} onPress={submit}>Complete setup</Button>
      </ScrollView>
    </Screen>
  );
}
