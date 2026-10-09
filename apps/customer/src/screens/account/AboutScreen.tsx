import React from 'react';
import { Linking } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Card, Column, Row, Badge, Banner, ListItem, Avatar } from '@trustlink/shared';
import { APP_NAME, APP_VERSION, BUILD_LABEL, DEMO_DATA_NOTICE, TAGLINE } from './appInfo';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

export function AboutScreen({ navigation }: Props) {
  const { theme } = useTheme();

  return (
    <Screen>
      <TopBar title="About" showBack onBack={() => navigation.goBack()} />
      <Column style={{ padding: 16 }} gap="md">
        <Card>
          <Column gap="sm" align="center">
            <Avatar size="xl" name="TrustLink" />
            <Text variant="h3" color="inherit" style={{ color: theme.roles.text }}>TrustLink Logistics</Text>
            <Text variant="body" color="inherit" style={{ color: theme.roles.textMuted }}>{TAGLINE}</Text>
            <Row gap="sm" align="center">
              <Badge variant="primary">{BUILD_LABEL}</Badge>
            </Row>
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <Row justify="space-between" align="center">
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>App</Text>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{APP_NAME}</Text>
            </Row>
            <Row justify="space-between" align="center">
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Version</Text>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{APP_VERSION}</Text>
            </Row>
            <Row justify="space-between" align="center">
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Service area</Text>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>Abuja (FCT), Nigeria</Text>
            </Row>
            <Row justify="space-between" align="center">
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Support</Text>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>Placeholder</Text>
            </Row>
          </Column>
        </Card>

        <Banner variant="info" title="Demo data" message={DEMO_DATA_NOTICE} />

        <Card>
          <Column gap="sm">
            <ListItem title="Terms of Service" onPress={() => navigation.navigate('Terms')} />
            <ListItem title="Privacy Policy" onPress={() => navigation.navigate('Privacy')} />
            <ListItem title="Help & support" onPress={() => navigation.navigate('Help')} />
            <ListItem title="Send feedback" subtitle="Opens your email app" onPress={() => Linking.openURL('mailto:support@trustlink.ng?subject=TrustLink%20feedback').catch(() => undefined)} />
          </Column>
        </Card>
      </Column>
    </Screen>
  );
}
