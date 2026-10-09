import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './primitives';

/**
 * Visible "this is sample data" indicator, rendered app-wide whenever the data source is mock.
 * Demo honesty: nobody should mistake a demo build for a live one (Phase 17B).
 */
export function DemoModeBanner({ source }: { source: string }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  if (source !== 'mock') return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel="Demo data. This build uses sample deliveries, riders and payments. Nothing is charged and no SMS or push is sent."
      style={[styles.wrap, { backgroundColor: theme.colors.gold, paddingTop: insets.top + 6 }]}
    >
      <Text variant="caption" color="inherit" style={[styles.label, { color: theme.roles.accentText }]}>
        Demo data · sample deliveries, no real charges or messages
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 6, paddingHorizontal: 12, alignItems: 'center' },
  label: { fontWeight: '700' },
});
