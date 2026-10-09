import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Card, Column, Row, Chip, Banner, Input, Skeleton, type VehicleType } from '@trustlink/shared';
import { errorMessage } from '@trustlink/shared';
import { useRiderProfile, useUpdateRiderProfile } from '../../hooks';
import type { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'EditVehicle'>;

const VEHICLES: Array<{ value: VehicleType; label: string }> = [
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
];

export function EditVehicleScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const profile = useRiderProfile();
  const update = useUpdateRiderProfile();

  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [zone, setZone] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    setVehicleType(profile.data.vehicleType);
    setPlate(profile.data.vehiclePlate ?? '');
    setModel(profile.data.vehicleModel ?? '');
    setColor(profile.data.vehicleColor ?? '');
    setZone(profile.data.zone ?? '');
  }, [profile.data]);

  const save = () => {
    setError(undefined);
    setSaved(false);
    if (!plate.trim()) {
      setError('Enter your vehicle plate number');
      return;
    }
    update.mutate(
      {
        vehicleType,
        vehiclePlate: plate.trim().toUpperCase(),
        vehicleModel: model.trim() || undefined,
        vehicleColor: color.trim() || undefined,
        zone: zone.trim() || undefined,
      },
      {
        onSuccess: () => setSaved(true),
        onError: (e: unknown) => setError(errorMessage(e, 'profile')),
      },
    );
  };

  if (profile.isLoading) {
    return (
      <Screen>
        <TopBar title="Vehicle" showBack onBack={() => navigation.goBack()} />
        <Column gap="md" style={{ padding: 16 }}><Skeleton height={200} /></Column>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Vehicle details" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        {saved ? <Banner variant="success" message="Vehicle details updated." /> : null}

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
            <Input label="Model (optional)" value={model} onChangeText={setModel} placeholder="Honda CG 125" />
            <Input label="Colour (optional)" value={color} onChangeText={setColor} placeholder="Blue" />
            <Input label="Service zone (optional)" value={zone} onChangeText={setZone} placeholder="Wuse 2" />
          </Column>
        </Card>

        {error ? <Banner variant="error" message={error} /> : null}
      </ScrollView>

      <Column style={{ padding: 16, gap: 8 }}>
        <Button variant="primary" size="lg" loading={update.isPending} onPress={save}>Save changes</Button>
        <Button variant="ghost" size="md" onPress={() => navigation.goBack()}>Cancel</Button>
      </Column>
    </Screen>
  );
}
