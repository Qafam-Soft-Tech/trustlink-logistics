import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, Text, Button, Input, Card, Column, Center, Avatar, Banner, isEmail } from '@trustlink/shared';
import { useSetupProfile } from '../../hooks/useAuth';
import { useSession } from '../../session/SessionContext';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ProfileSetup'>;

export function ProfileSetupScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const { theme } = useTheme();
  const { signIn } = useSession();
  const setup = useSetupProfile();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();

  const submit = () => {
    setError(undefined);
    if (!firstName.trim() || !lastName.trim()) {
      setError('Enter your first and last name');
      return;
    }
    if (email.trim() && !isEmail(email)) {
      setError('Enter a valid email or leave it blank');
      return;
    }
    setup.mutate(
      { phone, firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() || undefined },
      {
        onSuccess: async (r) => {
          await signIn({ user: r.user, token: r.token });
          navigation.replace('AccountReady');
        },
        onError: (e: unknown) =>
          setError((e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? 'Failed to complete profile. Please try again.'),
      },
    );
  };

  return (
    <Screen>
      <Column style={styles.container} gap="lg" justify="center">
        <Center><Avatar size="xl" name={`${firstName} ${lastName}`.trim() || 'New user'} /></Center>
        <Column gap="xs" align="center">
          <Text variant="h3" color="inherit" style={{ color: theme.roles.text }}>Complete your profile</Text>
          <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>This helps us personalise your experience.</Text>
        </Column>

        <Card>
          <Column gap="lg">
            <Input label="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" placeholder="Amina" />
            <Input label="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" placeholder="Bello" />
            <Input label="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="amina@example.com" />
            {error ? <Banner variant="error" message={error} /> : null}
            <Button variant="primary" size="lg" loading={setup.isPending} onPress={submit}>Complete setup</Button>
          </Column>
        </Card>
      </Column>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
});
