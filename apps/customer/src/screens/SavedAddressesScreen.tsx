import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Column, ListItem, Badge, EmptyState, ErrorState, Skeleton } from '@trustlink/shared';
import { useAddresses } from '../hooks';
import type { HomeStackParamList } from '../navigation/types';

export function SavedAddressesScreen() {
  const { theme } = useTheme();
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { data, isLoading, isError, refetch } = useAddresses();

  return (
    <Screen>
      <TopBar title="Saved addresses" showBack onBack={() => nav.goBack()} />
      <Column style={{ flex: 1, padding: 16 }} gap="md">
        <Button variant="primary" size="lg" onPress={() => nav.navigate('AddressForm', {})}>Add address</Button>

        {isLoading ? (
          <Column gap="sm"><Skeleton height={64} /><Skeleton height={64} /></Column>
        ) : isError ? (
          <ErrorState message="Couldn't load your addresses." onAction={() => refetch()} />
        ) : (data ?? []).length === 0 ? (
          <EmptyState icon="📍" title="No saved addresses" message="Add a pickup or drop-off address to speed up checkout." actionLabel="Add address" onAction={() => nav.navigate('AddressForm', {})} />
        ) : (
          <Column gap="sm">
            {(data ?? []).map((a) => (
              <ListItem
                key={a.id}
                title={a.label}
                subtitle={`${a.street}${a.area ? `, ${a.area}` : ''}`}
                right={a.isDefault ? <Badge variant="success">Default</Badge> : undefined}
                onPress={() => nav.navigate('AddressForm', { id: a.id })}
              />
            ))}
          </Column>
        )}

        <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Tap an address to edit, set it as default, or delete it.</Text>
      </Column>
    </Screen>
  );
}
