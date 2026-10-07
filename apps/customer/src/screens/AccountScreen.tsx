import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Column, Card, Row, Divider, Avatar } from '@trustlink/shared';
import type { RootStackParamList } from '../navigation/types';
import { useSession } from '../session/SessionContext';
import { useDemoMenu } from '../demo/DemoMenuContext';

export function AccountScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, signOut } = useSession();
  const demoMenu = useDemoMenu();

  const name = `${session?.user.firstName ?? 'Guest'} ${session?.user.lastName ?? ''}`.trim();

  const handleSignOut = () => {
    signOut();
    navigation.navigate('Auth');
  };

  return (
    <Screen>
      <TopBar title="Account" />
      <Column style={{ flex: 1, padding: 16 }} gap="lg">
        <Card>
          <Row gap="md" align="center">
            <Avatar size="lg" name={name || 'Guest'} />
            <Column gap="xs">
              <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{name || 'Guest'}</Text>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>{session?.user.phone ?? 'Not signed in'}</Text>
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{session?.user.email ?? ''}</Text>
            </Column>
          </Row>
        </Card>

        <Card>
          <Column gap="sm">
            <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Demo</Text>
            <Button variant="outline" size="md" onPress={demoMenu.open}>Open demo menu</Button>
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Tip: long-press the version text below anywhere to open it.</Text>
          </Column>
        </Card>

        <Divider />

        <Button variant="destructive" size="lg" onPress={handleSignOut}>Sign out</Button>

        <Row justify="center">
          <Text variant="caption" color="inherit" onLongPress={demoMenu.open} style={{ color: theme.roles.textMuted, textAlign: 'center' }}>
            TrustLink Customer · Version 0.1.0
          </Text>
        </Row>
      </Column>
    </Screen>
  );
}
