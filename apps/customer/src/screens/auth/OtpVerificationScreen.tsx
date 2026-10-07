import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, Text, Button, OtpInput, Card, Column, Center, Row, Chip, Banner, OTP_LENGTH, OTP_EXPIRY_SECONDS, MAX_OTP_ATTEMPTS, DEMO_OTP, formatPhone } from '@trustlink/shared';
import { useVerifyOtp, useResendOtp } from '../../hooks/useAuth';
import { useCountdown } from '../../hooks/useCountdown';
import { useData } from '../../data/DataContext';
import { useSession } from '../../session/SessionContext';
import type { AuthStackParamList, RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function OtpVerificationScreen({ navigation, route }: Props) {
  const { phone, purpose } = route.params;
  const { theme } = useTheme();
  const data = useData();
  const { signIn } = useSession();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const verify = useVerifyOtp();
  const resend = useResendOtp();

  const [code, setCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [round, setRound] = useState(0);
  const remaining = useCountdown(OTP_EXPIRY_SECONDS, true, round);
  const expired = remaining === 0;
  const locked = attempts >= MAX_OTP_ATTEMPTS;

  const submit = () => {
    if (locked) return;
    if (expired) {
      setError('This code has expired. Resend a new one.');
      return;
    }
    if (code.length !== OTP_LENGTH) {
      setError('Enter the 6-digit code');
      return;
    }
    setError(undefined);
    verify.mutate(
      { phone, code, purpose },
      {
        onSuccess: async (r) => {
          if (purpose === 'signup') {
            navigation.navigate('ProfileSetup', { phone, role: 'customer' });
          } else {
            await signIn({ user: r.user, token: r.token });
            rootNav.replace('Main');
          }
        },
        onError: () => {
          const left = MAX_OTP_ATTEMPTS - (attempts + 1);
          setAttempts((a) => a + 1);
          setCode('');
          setError(left > 0 ? `Incorrect code. ${left} attempt${left > 1 ? 's' : ''} left.` : 'Too many incorrect attempts. Resend a new code.');
        },
      },
    );
  };

  const handleResend = () => {
    resend.mutate(
      { phone, purpose },
      {
        onSuccess: () => {
          setAttempts(0);
          setError(undefined);
          setCode('');
          setRound((r) => r + 1);
        },
      },
    );
  };

  return (
    <Screen>
      <Column style={styles.container} gap="lg" justify="center">
        <Center>
          <Column gap="xs" align="center">
            <Text variant="h3" color="inherit" style={{ color: theme.roles.text }}>Verify your phone</Text>
            <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>We sent a 6-digit code to</Text>
            <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{formatPhone(phone)}</Text>
          </Column>
        </Center>

        <Card>
          <Column gap="lg">
            <OtpInput length={OTP_LENGTH} value={code} onChange={setCode} autoFocus />

            <Row justify="center" align="center" gap="sm">
              {expired || locked ? (
                <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>
                  {locked ? 'Too many attempts.' : 'Code expired.'}
                </Text>
              ) : (
                <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>Expires in {mmss(remaining)}</Text>
              )}
              <Button variant="ghost" size="sm" loading={resend.isPending} onPress={handleResend}>Resend code</Button>
            </Row>

            {data.source === 'mock' ? <Row justify="center"><Chip label={`Demo OTP: ${DEMO_OTP}`} /></Row> : null}

            {error ? <Banner variant="error" message={error} /> : null}

            <Button variant="primary" size="lg" loading={verify.isPending} disabled={locked || expired} onPress={submit}>
              Verify & continue
            </Button>
          </Column>
        </Card>
      </Column>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
});
