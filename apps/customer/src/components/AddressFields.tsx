import React from 'react';
import { useTheme, Text, Input, Chip, Column, Row, ABUJA_AREAS } from '@trustlink/shared';
import type { DraftAddress } from '@trustlink/shared';

export interface AddressFieldErrors {
  label?: string;
  street?: string;
  area?: string;
  city?: string;
}

/** Shared address field set — used by both the saved-address form and the request flow. */
export function AddressFields({ value, onChange, errors }: {
  value: DraftAddress;
  onChange: (value: DraftAddress) => void;
  errors?: AddressFieldErrors;
}) {
  const { theme } = useTheme();
  const patch = (p: Partial<DraftAddress>) => onChange({ ...value, ...p });

  return (
    <Column gap="lg">
      <Input label="Label" value={value.label} onChangeText={(label) => patch({ label })} placeholder="Home / Office" error={errors?.label} />
      <Input label="Street" value={value.street} onChangeText={(street) => patch({ street })} placeholder="12 Aminu Kano Crescent" error={errors?.street} />
      <Input label="Landmark (optional)" value={value.landmark} onChangeText={(landmark) => patch({ landmark })} placeholder="Nearest bus stop / building" />
      <Column gap="sm">
        <Text variant="label" color="inherit" style={{ color: errors?.area ? theme.colors.error : theme.roles.textSecondary }}>Area</Text>
        <Row gap="sm" style={{ flexWrap: 'wrap' }} justify="start">
          {ABUJA_AREAS.map((a) => (
            <Chip key={a} label={a} selected={value.area === a} onPress={() => patch({ area: a })} />
          ))}
        </Row>
        <Text variant="caption" color="inherit" style={{ color: errors?.area ? theme.colors.error : theme.roles.textMuted }}>
          {errors?.area ?? 'Only these areas are served at launch.'}
        </Text>
      </Column>
      <Input label="City" value={value.city} onChangeText={(city) => patch({ city })} placeholder="Abuja" error={errors?.city} />
      <Input label="State" value="FCT" editable={false} />
    </Column>
  );
}
