import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, Screen, Text, Button, Column, Center } from '@trustlink/shared';
import type { RootStackParamList } from '../../navigation/types';
import { useSession } from '../../session/SessionContext';
import { useDemoMenu } from '../../demo/DemoMenuContext';

export function WelcomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { completeOnboarding } = useSession();
  const demoMenu = useDemoMenu();

  const start = () => {
    void completeOnboarding();
    navigation.navigate('Auth');
  };

  return (
    <Screen>
      <Column style={styles.container} gap="xl" justify="space-between">
        <Center style={styles.body}>
          <Column gap="md" align="center">
            <View style={[styles.logo, { backgroundColor: theme.roles.primaryAction }]}>
              <Text variant="h2" color="inherit" style={{ color: theme.roles.primaryActionText }}>TL</Text>
            </View>
            <Text variant="h1" color="inherit" style={{ color: theme.roles.text }}>TrustLink</Text>
            <Text variant="body" color="inherit" style={{ color: theme.roles.textSecondary }}>Secure. Swift. Strategic.</Text>
          </Column>
        </Center>

        <Column gap="md" style={styles.bottom}>
          <Button variant="primary" size="lg" onPress={start}>Get started</Button>
          <Button variant="ghost" size="md" onPress={() => navigation.navigate('Auth')}>I already have an account</Button>
          <Text variant="caption" color="inherit" onLongPress={demoMenu.open} style={{ color: theme.roles.textMuted, textAlign: 'center' }}>
            Version 0.1.0 · demo build
          </Text>
        </Column>
      </Column>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  body: { flex: 1 },
  bottom: { paddingBottom: 8 },
  logo: { width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
