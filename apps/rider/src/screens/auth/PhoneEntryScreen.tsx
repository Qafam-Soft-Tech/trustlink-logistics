import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Screen, Text, Button, Chip, Card, Column, Row, Center, Banner, PhoneInput, toCanonicalPhone, isValidNigerianPhone, DEMO_OTP } from '@trustlink/shared';
import { useRequestOtp } from '../../hooks/useAuth';
import { useData } from '../../data/DataContext';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneEntry'>;

export function PhoneEntryScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const data = useData();
  const requestOtp = useRequestOtp();
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState<'signup' | 'login'>('login');
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
        onSuccess: () => navigation.navigate('OtpVerification', { phone: canonical, purpose: mode }),
        onError: (e: unknown) => setError((e as Error).message || 'Failed to send the code. Please try again.'),
      },
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24, flexGrow: 1, justifyContent: 'center' }}>
        <Center>
          <Column gap="sm" align="center">
            <Ionicons name="bicycle" size={56} color={theme.roles.primaryAction} />
            <Text variant="h1" color="inherit" style={{ color: theme.roles.text }}>TrustLink Rider</Text>
            <Text variant="body" color="inherit" style={{ color: theme.roles.textMuted }}>Earn on every delivery in Abuja</Text>
          </Column>
        </Center>

        <Card>
          <Column gap="lg">
            <Column gap="xs">
              <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>
                {mode === 'login' ? 'Welcome back' : 'Join as a rider'}
              </Text>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>
                {mode === 'login' ? "We'll send a code to log you in." : "We'll send a code to verify your number."}
              </Text>
            </Column>

            <PhoneInput value={phone} onChangeText={setPhone} error={error} />

            {data.source === 'mock' ? (
              <Row><Chip label={`Demo OTP: ${DEMO_OTP}`} /></Row>
            ) : null}

            <Button variant="primary" size="lg" loading={requestOtp.isPending} onPress={submit}>
              {mode === 'login' ? 'Log in' : 'Continue'}
            </Button>

            <Button variant="ghost" size="md" onPress={() => { setError(undefined); setMode(mode === 'login' ? 'signup' : 'login'); }}>
              {mode === 'login' ? 'New rider? Sign up' : 'Already a rider? Log in'}
            </Button>
          </Column>
        </Card>

        {error ? <Banner variant="error" message={error} /> : null}

        <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted, textAlign: 'center' }}>
          Verification codes are sent by SMS. Never share your code with anyone.
        </Text>
      </ScrollView>
    </Screen>
  );
}
