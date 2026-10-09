import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useTheme,
  Screen,
  TopBar,
  Text,
  Button,
  Card,
  Column,
  Row,
  Input,
  Avatar,
  Banner,
  Skeleton,
  ErrorState,
  isEmail,
  errorMessage,
} from '@trustlink/shared';
import { useProfile } from '../../hooks';
import { useUpdateProfile } from '../../hooks/useAuth';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const profile = useProfile();
  const update = useUpdateProfile();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    setFirstName(profile.data.firstName ?? '');
    setLastName(profile.data.lastName ?? '');
    setEmail(profile.data.email ?? '');
  }, [profile.data]);

  const phone = profile.data?.phone ?? '';
  const name = `${firstName} ${lastName}`.trim();

  const save = () => {
    setError(undefined);
    setSaved(false);
    if (!firstName.trim()) {
      setError('Enter your first name');
      return;
    }
    if (email.trim() && !isEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    update.mutate(
      { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() || undefined },
      {
        onSuccess: () => setSaved(true),
        onError: (e: unknown) => setError(errorMessage(e, 'profile')),
      },
    );
  };

  if (profile.isLoading) {
    return (
      <Screen>
        <TopBar title="Edit profile" showBack onBack={() => navigation.goBack()} />
        <Column gap="md" style={{ padding: 16 }}>
          <Skeleton height={96} />
          <Skeleton height={140} />
        </Column>
      </Screen>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <Screen>
        <TopBar title="Edit profile" showBack onBack={() => navigation.goBack()} />
        <Column style={{ padding: 16 }}>
          <ErrorState message="Couldn't load your profile." onAction={() => profile.refetch()} />
        </Column>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Edit profile" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Card>
          <Row gap="md" align="center">
            <Avatar size="lg" name={name || 'Customer'} />
            <Column gap="xs" style={{ flex: 1 }}>
              <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{name || 'Your name'}</Text>
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{phone}</Text>
            </Column>
          </Row>
        </Card>

        {saved ? <Banner variant="success" message="Profile updated." /> : null}

        <Card>
          <Column gap="lg">
            <Input label="First name" value={firstName} onChangeText={setFirstName} placeholder="Amina" />
            <Input label="Last name" value={lastName} onChangeText={setLastName} placeholder="Bello" />
            <Input
              label="Email (optional)"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Column gap="xs">
              <Input label="Phone number" value={phone} editable={false} />
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                Your phone number identifies your account and can't be changed here. Contact support if it changes.
              </Text>
            </Column>
          </Column>
        </Card>

        {error ? <Banner variant="error" message={error} /> : null}
      </ScrollView>

      <Column style={{ padding: 16, gap: 8 }}>
        <Button variant="primary" size="lg" loading={update.isPending} onPress={save}>Save changes</Button>
        <Button variant="ghost" size="md" onPress={() => navigation.goBack()}>Cancel</Button>
      </Column>
    </Screen>
  );
}
