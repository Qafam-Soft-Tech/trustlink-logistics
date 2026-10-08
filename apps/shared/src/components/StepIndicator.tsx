import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './primitives';

/** Horizontal progress indicator for the multi-step request flow. */
export function StepIndicator({ steps, current, style }: { steps: readonly string[]; current: number; style?: any }) {
  const { theme } = useTheme();
  const label = steps[current] ?? '';
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.track}>
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const fill = done || active ? theme.roles.primaryAction : theme.roles.surface;
          const border = done || active ? theme.roles.primaryAction : theme.roles.borderStrong;
          return (
            <React.Fragment key={step}>
              {i > 0 ? <View style={[styles.line, { backgroundColor: i <= current ? theme.roles.primaryAction : theme.roles.border }]} /> : null}
              <View style={[styles.dot, { backgroundColor: fill, borderColor: border }]}>
                <Text variant="caption" color="inherit" style={{ color: done || active ? theme.roles.primaryActionText : theme.roles.textMuted, fontWeight: '700' }}>
                  {done ? '✓' : i + 1}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
      <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted, textAlign: 'center' }}>
        Step {Math.min(current + 1, steps.length)} of {steps.length} · {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  track: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, height: 2, marginHorizontal: 4 },
});
