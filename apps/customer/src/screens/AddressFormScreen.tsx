import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Card, Column, Banner, Dialog, isValidAddress } from '@trustlink/shared';
import { errorMessage } from '@trustlink/shared';
import type { Address, DraftAddress } from '@trustlink/shared';
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from '../hooks';
import { AddressFields } from '../components/AddressFields';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AddressForm'>;

const EMPTY: DraftAddress = { label: 'Home', street: '', landmark: '', area: '', city: 'Abuja' };

export function AddressFormScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const id = route.params?.id;
  const { data } = useAddresses();
  const existing = (data ?? []).find((a) => a.id === id);
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const remove = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [draft, setDraft] = useState<DraftAddress>(EMPTY);
  const [error, setError] = useState<string | undefined>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (existing) {
      setDraft({ label: existing.label, street: existing.street, landmark: existing.landmark ?? '', area: existing.area ?? '', city: existing.city ?? 'Abuja' });
    }
  }, [existing]);

  const saving = create.isPending || update.isPending;

  const save = () => {
    setError(undefined);
    const payload: Partial<Address> = { ...draft, state: 'FCT', country: 'Nigeria' };
    if (!isValidAddress({ street: draft.street, area: draft.area, city: draft.city, state: 'FCT' })) {
      setError('Enter a street, area, city and state (state is fixed to FCT).');
      return;
    }
    if (id) {
      update.mutate({ id, patch: payload }, { onSuccess: () => navigation.goBack(), onError: (e: unknown) => setError(errorMessage(e, 'addresses')) });
    } else {
      create.mutate(payload, { onSuccess: () => navigation.goBack(), onError: (e: unknown) => setError(errorMessage(e, 'addresses')) });
    }
  };

  return (
    <Screen>
      <TopBar title={id ? 'Edit address' : 'Add address'} showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Column gap="lg">
            <AddressFields value={draft} onChange={setDraft} />
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

        <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
          State is fixed to FCT and city to Abuja for the R1 launch.
        </Text>
      </ScrollView>

      <Dialog
        visible={confirmDelete}
        title="Delete address"
        message="This address will be removed."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (id) remove.mutate(id, { onSuccess: () => navigation.goBack(), onError: (e: unknown) => setError(errorMessage(e, 'addresses')) });
        }}
      />
    </Screen>
  );
}
