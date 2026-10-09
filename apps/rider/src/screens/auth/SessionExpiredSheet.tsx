import React from 'react';
import { Button, BottomSheet, Column, Text, useTheme } from '@trustlink/shared';
import { useSession } from '../../session/SessionContext';

/** Global overlay shown when any request returns 401 (rider app). */
export function RiderSessionExpiredSheet() {
  const { theme } = useTheme();
  const { sessionExpired, clearSessionExpired, signOut } = useSession();

  return (
    <BottomSheet visible={sessionExpired} title="Session expired" onClose={clearSessionExpired}>
      <Column gap="lg">
        <Text variant="body" color="inherit" style={{ color: theme.roles.textSecondary }}>
          Your session has expired. Please sign in again to keep delivering.
        </Text>
        <Button
          variant="primary"
          size="lg"
          onPress={async () => {
            await signOut();
            clearSessionExpired();
          }}
        >
          Sign in again
        </Button>
      </Column>
    </BottomSheet>
  );
}
