import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomSheet, Button, Column, Text, useTheme } from '@trustlink/shared';
import { useSession } from '../../session/SessionContext';
import type { RootStackParamList } from '../../navigation/types';

/** Global overlay shown when any request returns 401. */
export function SessionExpiredSheet() {
  const { theme } = useTheme();
  const { sessionExpired, clearSessionExpired, signOut } = useSession();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <BottomSheet visible={sessionExpired} title="Session expired" onClose={clearSessionExpired}>
      <Column gap="lg">
        <Text variant="body" color="inherit" style={{ color: theme.roles.textSecondary }}>
          Your session has expired. Please sign in again to continue.
        </Text>
        <Button
          variant="primary"
          size="lg"
          onPress={async () => {
            await signOut();
            clearSessionExpired();
            nav.navigate('Auth');
          }}
        >
          Sign in again
        </Button>
      </Column>
    </BottomSheet>
  );
}
