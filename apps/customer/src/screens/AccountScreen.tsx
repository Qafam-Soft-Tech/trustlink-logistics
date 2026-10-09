import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Card, Column, Row, Divider, Avatar, ListItem, Dialog } from '@trustlink/shared';
import type { RootStackParamList } from '../navigation/types';
import { useProfile } from '../hooks';
import { useSession } from '../session/SessionContext';
import { useDemoMenu } from '../demo/DemoMenuContext';
import { BUILD_LABEL, APP_VERSION } from './account/appInfo';

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <Column gap="sm">
      <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>{label}</Text>
      <Card>
        <Column gap="sm">{children}</Column>
      </Card>
    </Column>
  );
}

export function AccountScreen() {
  const { theme, mode } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { session, signOut } = useSession();
  const demoMenu = useDemoMenu();
  const profile = useProfile();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState(false);

  const user = profile.data ?? session?.user;
  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const modeLabel = mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark';

  const doSignOut = () => {
    setConfirmSignOut(false);
    void signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  return (
    <Screen>
      <TopBar title="Account" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Column gap="md">
            <Row gap="md" align="center">
              <Avatar size="lg" name={name || 'Guest'} />
              <Column gap="xs" style={{ flex: 1 }}>
                <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{name || 'Guest'}</Text>
                <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>{user?.phone ?? 'Not signed in'}</Text>
                {user?.email ? (
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{user.email}</Text>
                ) : null}
              </Column>
            </Row>
            <Button variant="outline" size="md" onPress={() => navigation.navigate('EditProfile')}>Edit profile</Button>
          </Column>
        </Card>

        <Group label="Preferences">
          <ListItem title="Appearance" subtitle={modeLabel} onPress={() => navigation.navigate('Appearance')} />
        </Group>

        <Group label="Support">
          <ListItem title="My issues" onPress={() => navigation.navigate('MyIssues')} />
          <ListItem title="Report an issue" onPress={() => navigation.navigate('ReportIssue')} />
          <ListItem title="Help & support" onPress={() => navigation.navigate('Help')} />
        </Group>

        <Group label="Legal & about">
          <ListItem title="Terms of Service" onPress={() => navigation.navigate('Terms')} />
          <ListItem title="Privacy Policy" subtitle="Your data and your rights (NDPA)" onPress={() => navigation.navigate('Privacy')} />
          <ListItem title="About TrustLink" subtitle={`Version ${APP_VERSION}`} onPress={() => navigation.navigate('About')} />
        </Group>

        <Group label="Demo">
          <ListItem title="Open demo menu" subtitle="Long-press the version text anywhere" onPress={demoMenu.open} />
        </Group>

        <Divider />

        <Column gap="sm">
          <Button variant="destructive" size="lg" onPress={() => setConfirmSignOut(true)}>Sign out</Button>
          <Button variant="ghost" size="md" onPress={() => setDeleteInfo(true)}>Delete account</Button>
          <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
            Account deletion isn't available in the app yet — we handle requests through support.
          </Text>
        </Column>

        <Row justify="center">
          <Text variant="caption" color="inherit" onLongPress={demoMenu.open} style={{ color: theme.roles.textMuted, textAlign: 'center' }}>
            {BUILD_LABEL}
          </Text>
        </Row>
      </ScrollView>

      <Dialog
        visible={confirmSignOut}
        title="Sign out?"
        message="You'll need your phone number and a fresh code to sign back in."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        destructive
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={doSignOut}
      />

      <Dialog
        visible={deleteInfo}
        title="Delete account"
        message="Account deletion isn't available in the app yet. Contact support and we'll delete your data in line with the Nigeria Data Protection Act."
        confirmLabel="Contact support"
        cancelLabel="Close"
        onCancel={() => setDeleteInfo(false)}
        onConfirm={() => {
          setDeleteInfo(false);
          navigation.navigate('Help');
        }}
      />
    </Screen>
  );
}
