import React, { useState } from 'react';
import { useTheme, Text, Button, Card, Column, ListItem, Badge, EmptyState, ErrorState, Skeleton, Banner, isValidAddress } from '@trustlink/shared';
import type { Address, DraftAddress } from '@trustlink/shared';
import { useAddresses, useCreateAddress } from '../hooks';
import { AddressFields } from './AddressFields';

function toDraft(a: Address): DraftAddress {
  return { label: a.label, street: a.street, landmark: a.landmark ?? '', area: a.area ?? '', city: a.city ?? 'Abuja' };
}

function isSelected(a: Address, value: DraftAddress): boolean {
  return a.street === value.street && (a.area ?? '') === value.area;
}

/**
 * Saved-address picker with an inline "new address" form. Shows the address label
 * (Home/Office/…) for each option. Used for the pickup and drop-off steps.
 */
export function AddressPicker({ title, value, onChange }: {
  title: string;
  value: DraftAddress;
  onChange: (value: DraftAddress) => void;
}) {
  const { theme } = useTheme();
  const { data, isLoading, isError, refetch } = useAddresses();
  const create = useCreateAddress();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<DraftAddress>({ label: 'Home', street: '', landmark: '', area: '', city: 'Abuja' });
  const [error, setError] = useState<string | undefined>();

  const save = () => {
    setError(undefined);
    if (!isValidAddress({ street: draft.street, area: draft.area, city: draft.city, state: 'FCT' })) {
      setError('Enter a street and choose an area.');
      return;
    }
    create.mutate(
      { ...draft, state: 'FCT', country: 'Nigeria' },
      {
        onSuccess: (created) => {
          onChange(toDraft(created));
          setAdding(false);
          setDraft({ label: 'Home', street: '', landmark: '', area: '', city: 'Abuja' });
        },
        onError: (e: unknown) => setError((e as Error).message),
      },
    );
  };

  return (
    <Column gap="md">
      <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>{title}</Text>

      {isLoading ? (
        <Column gap="sm"><Skeleton height={64} /><Skeleton height={64} /></Column>
      ) : isError ? (
        <ErrorState message="Couldn't load your saved addresses." onAction={() => refetch()} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon="📍" title="No saved addresses" message="Add one below to continue." />
      ) : (
        <Column gap="sm">
          {(data ?? []).map((a) => (
            <ListItem
              key={a.id}
              title={a.label}
              subtitle={`${a.street}${a.area ? `, ${a.area}` : ''}`}
              right={isSelected(a, value) ? <Badge variant="primary">Selected</Badge> : a.isDefault ? <Badge variant="success">Default</Badge> : undefined}
              onPress={() => onChange(toDraft(a))}
            />
          ))}
        </Column>
      )}

      {adding ? (
        <Card>
          <Column gap="lg">
            <AddressFields value={draft} onChange={setDraft} />
            {error ? <Banner variant="error" message={error} /> : null}
            <Column gap="sm">
              <Button variant="primary" size="md" loading={create.isPending} onPress={save}>Save & use this address</Button>
              <Button variant="ghost" size="md" onPress={() => { setAdding(false); setError(undefined); }}>Cancel</Button>
            </Column>
          </Column>
        </Card>
      ) : (
        <Button variant="outline" size="md" onPress={() => setAdding(true)}>Use a new address</Button>
      )}
    </Column>
  );
}
