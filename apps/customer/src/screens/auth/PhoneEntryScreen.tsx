import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, Screen, Text, Button, PhoneInput, Card, Column, Center, Row, Chip, Banner, toCanonicalPhone, isValidNigerianPhone, DEMO_OTP } from '@trustlink/shared';
import { errorMessage } from '@trustlink/shared';
import { useRequestOtp } from '../../hooks/useAuth';
import { useData } from '../../data/DataContext';
import type { AuthStackParamList, RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneEntry'>;

export function PhoneEntryScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const data = useData();
  const requestOtp = useRequestOtp();
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [error, setError] = useState<string | undefined>();

  const submit = () => {
    setError(undefined);
    const canonical = toCanonicalPhone(phone);
    if (!isValidNigerianPhone(canonical)) {
      setError('Enter a valid 11-digit Nigerian phone number');
      return;
    }
    requestOtp.mutate(
      { phone: canonical, purpose: mode },
      {
        onSuccess: () => navigation.navigate('OtpVerification', { phone: canonical, role: 'customer', purpose: mode }),
        onError: (e: unknown) =>
          setError(errorMessage(e, 'auth')),
      },
    );
  };

  return (
    <Screen>
      <Column style={styles.container} gap="lg" justify="center">
        <Center>
          <Column gap="xs" align="center">
            <Text variant="h1" color="inherit" style={{ color: theme.roles.text }}>TrustLink</Text>
            <Text variant="body" color="inherit" style={{ color: theme.roles.textMuted }}>Secure. Swift. Strategic.</Text>
          </Column>
        </Center>

        <Card>
          <Column gap="lg">
            <Column gap="xs">
              <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>
                {mode === 'login' ? "We'll send a verification code to log you in." : "We'll send a verification code via SMS."}
              </Text>
            </Column>

            <PhoneInput value={phone} onChangeText={setPhone} error={error} />

            {data.source === 'mock' ? <Row><Chip label={`Demo OTP: ${DEMO_OTP}`} /></Row> : null}

            <Button variant="primary" size="lg" loading={requestOtp.isPending} onPress={submit}>
              {mode === 'login' ? 'Log in' : 'Continue'}
            </Button>

            <Button variant="ghost" size="md" onPress={() => { setError(undefined); setMode(mode === 'login' ? 'signup' : 'login'); }}>
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </Button>
          </Column>
        </Card>

        <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted, textAlign: 'center' }}>
          By continuing you agree to our{' '}
          <Text variant="caption" color="inherit" onPress={() => rootNav.navigate('Terms')} style={{ color: theme.roles.primaryAction, textDecorationLine: 'underline' }}>Terms of Service</Text>
          {' '}and{' '}
          <Text variant="caption" color="inherit" onPress={() => rootNav.navigate('Privacy')} style={{ color: theme.roles.primaryAction, textDecorationLine: 'underline' }}>Privacy Policy</Text>.
        </Text>

        {error ? <Banner variant="error" message={error} /> : null}
      </Column>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
});
