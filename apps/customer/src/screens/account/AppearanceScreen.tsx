import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Card, Column, Badge, ListItem, type ThemeMode } from '@trustlink/shared';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Appearance'>;

const OPTIONS: Array<{ value: ThemeMode; title: string; subtitle: string }> = [
  { value: 'system', title: 'System', subtitle: 'Follow your device light or dark setting' },
  { value: 'light', title: 'Light', subtitle: 'Always use the light theme' },
  { value: 'dark', title: 'Dark', subtitle: 'Always use the dark theme' },
];

export function AppearanceScreen({ navigation }: Props) {
  const { theme, mode, resolvedMode, setMode } = useTheme();

  return (
    <Screen>
      <TopBar title="Appearance" showBack onBack={() => navigation.goBack()} />
      <Column style={{ padding: 16 }} gap="md">
        <Card>
          <Column gap="sm">
            {OPTIONS.map((option) => (
              <ListItem
                key={option.value}
                title={option.title}
                subtitle={option.subtitle}
                right={mode === option.value ? <Badge variant="primary">Selected</Badge> : undefined}
                onPress={() => setMode(option.value)}
              />
            ))}
          </Column>
        </Card>

        <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
          Your choice is saved on this device and applies immediately. Currently showing the {resolvedMode} theme.
        </Text>
      </Column>
    </Screen>
  );
}
