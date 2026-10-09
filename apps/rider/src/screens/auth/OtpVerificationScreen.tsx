import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, Text, Button, Card, Column, Center, Banner, Row, OtpInput, OTP_EXPIRY_SECONDS, DEMO_OTP, isValidOtp } from '@trustlink/shared';
import { useVerifyOtp, useResendOtp } from '../../hooks/useAuth';
import { useCountdown } from '../../hooks/useCountdown';
import { useSession } from '../../session/SessionContext';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

export function OtpVerificationScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { phone, purpose } = route.params;
  const verify = useVerifyOtp();
  const resend = useResendOtp();
  const { signIn } = useSession();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [resendKey, setResendKey] = useState(0);
  const remaining = useCountdown(OTP_EXPIRY_SECONDS, true, resendKey);

  const submit = (value = code) => {
    setError(undefined);
    if (!isValidOtp(value)) {
      setError('Enter the 6-digit code');
      return;
    }
    verify.mutate(
      { phone, code: value, purpose },
      {
        onSuccess: async (result) => {
          if (purpose === 'signup') {
            navigation.navigate('ProfileSetup', { phone });
            return;
          }
          await signIn({ user: result.user, token: result.token });
        },
        onError: (e: unknown) => {
          setCode('');
          setError((e as Error).message || 'That code is incorrect or expired.');
        },
      },
    );
  };

  const doResend = () => {
    setError(undefined);
    resend.mutate(
      { phone, purpose },
      {
        onSuccess: () => {
          setCode('');
          setResendKey((k) => k + 1);
        },
        onError: (e: unknown) => setError((e as Error).message || 'Could not resend the code.'),
      },
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 24, flexGrow: 1, justifyContent: 'center' }}>
        <Center>
          <Column gap="sm" align="center">
            <Text variant="h2" color="inherit" style={{ color: theme.roles.text }}>Verify your phone</Text>
            <Text variant="body" color="inherit" style={{ color: theme.roles.textSecondary }}>We sent a 6-digit code to {phone}</Text>
          </Column>
        </Center>

        <Card>
          <Column gap="lg">
            <OtpInput value={code} onChange={setCode} autoFocus />

            {error ? <Banner variant="error" message={error} /> : null}

            <Button variant="primary" size="lg" loading={verify.isPending} disabled={code.length !== 6} onPress={() => submit()}>
              Verify & continue
            </Button>

            <Row justify="space-between" align="center">
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                {remaining > 0 ? `Code expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}` : 'Code expired'}
              </Text>
              <Button variant="ghost" size="sm" loading={resend.isPending} onPress={doResend}>Resend code</Button>
            </Row>
          </Column>
        </Card>

        <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted, textAlign: 'center' }}>
          Demo code: {DEMO_OTP} (mock data mode only)
        </Text>
      </ScrollView>
    </Screen>
  );
}
