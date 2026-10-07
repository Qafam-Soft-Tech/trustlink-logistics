import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './primitives';

export function SegmentedControl<T extends string>({ options, value, onChange, style }: {
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
  style?: any;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: theme.roles.bgSecondary, borderColor: theme.roles.border, borderRadius: theme.borderRadius.md }, style]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segmentItem, { backgroundColor: active ? theme.roles.primaryAction : 'transparent', borderRadius: theme.borderRadius.sm }]}
          >
            <Text variant="label" color="inherit" style={{ color: active ? theme.roles.primaryActionText : theme.roles.textSecondary }}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/** Phone input that displays the +234 country code and emits the canonical 11-digit local value. */
export function PhoneInput({ value, onChangeText, label = 'Phone number', error }: { value: string; onChangeText: (v: string) => void; label?: string; error?: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.phoneRow}>
      <View style={[styles.country, { borderColor: theme.roles.border, backgroundColor: theme.roles.surface, borderRadius: theme.borderRadius.md }]}>
        <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>🇳🇬 +234</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Field label={label} value={value} onChangeText={onChangeText} keyboardType="phone-pad" error={error} placeholder="803 123 4567" />
      </View>
    </View>
  );
}

export function OtpInput({ length = 6, value, onChange, autoFocus = false }: { length?: number; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const { theme } = useTheme();
  const digits = value.split('').slice(0, length);
  return (
    <View style={styles.otpRow}>
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={[styles.otpCell, { borderColor: digits[i] ? theme.roles.primaryAction : theme.roles.border, backgroundColor: theme.roles.surface, borderRadius: theme.borderRadius.md }]}
        >
          <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{digits[i] ?? ''}</Text>
        </View>
      ))}
      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        autoFocus={autoFocus}
        style={styles.hiddenInput}
        maxLength={length}
      />
    </View>
  );
}

export function TextArea({ label, value, onChangeText, error, ...props }: TextInputProps & { label?: string; error?: string; value: string; onChangeText: (v: string) => void }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary, marginLeft: 4 }}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={4}
        style={[styles.textarea, { color: theme.roles.text, backgroundColor: theme.roles.surface, borderColor: error ? theme.colors.error : theme.roles.border, borderRadius: theme.borderRadius.md }]}
        placeholderTextColor={theme.roles.textMuted}
        {...props}
      />
    </View>
  );
}

export function SelectTrigger({ label, value, placeholder = 'Select…', onPress }: { label?: string; value?: string; placeholder?: string; onPress?: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary, marginLeft: 4 }}>{label}</Text> : null}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        style={[styles.select, { backgroundColor: theme.roles.surface, borderColor: theme.roles.border, borderRadius: theme.borderRadius.md }]}
      >
        <Text variant="body" color="inherit" style={{ color: value ? theme.roles.text : theme.roles.textMuted }}>{value ?? placeholder}</Text>
        <Text variant="body" color="inherit" style={{ color: theme.roles.textMuted }}>▾</Text>
      </TouchableOpacity>
    </View>
  );
}

function Field({ label, error, ...props }: TextInputProps & { label?: string; error?: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary, marginLeft: 4 }}>{label}</Text> : null}
      <TextInput
        style={[styles.field, { color: theme.roles.text, backgroundColor: theme.roles.surface, borderColor: error ? theme.colors.error : theme.roles.border, borderRadius: theme.borderRadius.md }]}
        placeholderTextColor={theme.roles.textMuted}
        {...props}
      />
      {error ? <Text variant="caption" color="inherit" style={{ color: theme.colors.error, marginLeft: 4 }}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', padding: 4, borderWidth: 1 },
  segmentItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, minHeight: 36 },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  country: { borderWidth: 1, paddingHorizontal: 12, height: 44, justifyContent: 'center' },
  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', position: 'relative' },
  otpCell: { width: 48, height: 56, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  hiddenInput: { position: 'absolute', opacity: 0, width: '100%', height: '100%' },
  textarea: { borderWidth: 1, padding: 12, minHeight: 96, textAlignVertical: 'top', fontSize: 16 },
  select: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, paddingHorizontal: 12, minHeight: 44 },
  field: { borderWidth: 1, paddingHorizontal: 12, minHeight: 44, fontSize: 16 },
});
