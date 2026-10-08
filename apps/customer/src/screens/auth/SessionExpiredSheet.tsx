import React from 'react';
import { BottomSheet, Button, Column, Text, useTheme } from '@trustlink/shared';
import { useSession } from '../../session/SessionContext';
import { navigate } from '../../navigation/navigationRef';

/** Global overlay shown when any request returns 401. */
export function SessionExpiredSheet() {
  const { theme } = useTheme();
  const { sessionExpired, clearSessionExpired, signOut } = useSession();

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
            navigate('Auth');
          }}
        >
          Sign in again
        </Button>
      </Column>
    </BottomSheet>
  );
}
