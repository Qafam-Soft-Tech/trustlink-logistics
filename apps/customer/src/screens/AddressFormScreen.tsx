import React, { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Input, Card, Column, Row, Chip, Banner, Dialog, isValidAddress, ABUJA_AREAS } from '@trustlink/shared';
import type { Address } from '@trustlink/shared';
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from '../hooks';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AddressForm'>;

export function AddressFormScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const id = route.params?.id;
  const { data } = useAddresses();
  const existing = (data ?? []).find((a) => a.id === id);
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const remove = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [label, setLabel] = useState('Home');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Abuja');
  const [error, setError] = useState<string | undefined>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (existing) {
      setLabel(existing.label);
      setStreet(existing.street);
      setLandmark(existing.landmark ?? '');
      setArea(existing.area ?? '');
      setCity(existing.city ?? 'Abuja');
    }
  }, [existing]);

  const saving = create.isPending || update.isPending;

  const save = () => {
    setError(undefined);
    const payload: Partial<Address> = { label: label.trim() || 'Home', street: street.trim(), landmark: landmark.trim(), area, city, state: 'FCT', country: 'Nigeria' };
    if (!isValidAddress({ street: payload.street ?? '', area: payload.area ?? '', city: payload.city ?? '', state: payload.state ?? '' })) {
      setError('Enter a street, area, city and state (state is fixed to FCT).');
      return;
    }
    if (id) {
      update.mutate({ id, patch: payload }, { onSuccess: () => navigation.goBack(), onError: (e: unknown) => setError((e as Error).message) });
    } else {
      create.mutate(payload, { onSuccess: () => navigation.goBack(), onError: (e: unknown) => setError((e as Error).message) });
    }
  };

  return (
    <Screen>
      <TopBar title={id ? 'Edit address' : 'Add address'} showBack onBack={() => navigation.goBack()} />
      <Column style={{ flex: 1, padding: 16 }} gap="md">
        <Card>
          <Column gap="lg">
            <Input label="Label" value={label} onChangeText={setLabel} placeholder="Home / Office" />
            <Input label="Street" value={street} onChangeText={setStreet} placeholder="12 Aminu Kano Crescent" />
            <Input label="Landmark (optional)" value={landmark} onChangeText={setLandmark} placeholder="Nearest bus stop / building" />
            <Column gap="sm">
              <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Area</Text>
              <Row gap="sm" style={{ flexWrap: 'wrap' }} justify="start">
                {ABUJA_AREAS.map((a) => (
                  <Chip key={a} label={a} selected={area === a} onPress={() => setArea(a)} />
                ))}
              </Row>
            </Column>
            <Input label="City" value={city} onChangeText={setCity} placeholder="Abuja" />
            <Input label="State" value="FCT" editable={false} />
            {error ? <Banner variant="error" message={error} /> : null}
            <Button variant="primary" size="lg" loading={saving} onPress={save}>{id ? 'Save changes' : 'Save address'}</Button>
          </Column>
        </Card>

        {id ? (
          <Column gap="md">
            <Button variant="outline" size="md" loading={setDefault.isPending} onPress={() => setDefault.mutate(id, { onSuccess: () => navigation.goBack() })}>Set as default</Button>
            <Button variant="destructive" size="md" onPress={() => setConfirmDelete(true)}>Delete address</Button>
          </Column>
        ) : null}
      </Column>

      <Dialog
        visible={confirmDelete}
        title="Delete address"
        message="This address will be removed."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (id) remove.mutate(id, { onSuccess: () => navigation.goBack(), onError: (e: unknown) => setError((e as Error).message) });
        }}
      />
    </Screen>
  );
}
