import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Screen, TopBar, Banner, EmptyState } from '@trustlink/shared';

/**
 * Branded placeholder used for screens not yet implemented.
 * Registered in docs/frontend/SCAFFOLD_REGISTER.md.
 */
export function ScreenScaffold({ title, note, message, onBack }: { title: string; note?: string; message?: string; onBack?: () => void }) {
  return (
    <Screen>
      <TopBar title={title} showBack={Boolean(onBack)} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <Banner variant="info" title="Not built yet" message={note ?? 'This screen arrives in a later frontend phase.'} />
        <EmptyState title={title} message={message ?? 'Placeholder — no data wired yet.'} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
});
