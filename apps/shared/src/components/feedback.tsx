import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text, Button, Card } from './primitives';

export function Skeleton({ width = '100%', height = 16, radius = 8, style }: { width?: number | string; height?: number; radius?: number; style?: any }) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ width: width as any, height, borderRadius: radius, backgroundColor: theme.colors.gray200, opacity }, style]} />;
}

export type BannerVariant = 'info' | 'success' | 'warning' | 'error' | 'offline';

export function Banner({ variant = 'info', title, message, style }: { variant?: BannerVariant; title?: string; message: string; style?: any }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const map: Record<BannerVariant, { accent: string; label: string }> = {
    info: { accent: c.info, label: 'Info' },
    success: { accent: c.success, label: 'Success' },
    warning: { accent: c.warning, label: 'Warning' },
    error: { accent: c.error, label: 'Error' },
    offline: { accent: c.gray500, label: 'Offline' },
  };
  const { accent, label } = map[variant];
  return (
    <View style={[styles.banner, { backgroundColor: accent + '18', borderColor: accent }, style]}>
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <View style={styles.bannerBody}>
        <Text variant="label" color="inherit" style={{ color: theme.roles.text }}>
          {title ?? label}
        </Text>
        <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textSecondary }}>
          {message}
        </Text>
      </View>
    </View>
  );
}

export function Toast({ visible, message, variant = 'info', onDismiss }: { visible: boolean; message: string; variant?: BannerVariant; onDismiss?: () => void }) {
  const { theme } = useTheme();
  if (!visible) return null;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onDismiss} style={[styles.toast, { backgroundColor: theme.roles.surfaceElevated, borderColor: theme.roles.border }]}>
      <View style={[styles.dot, { backgroundColor: theme.colors[variant === 'offline' ? 'gray500' : variant === 'error' ? 'error' : variant === 'success' ? 'success' : variant === 'warning' ? 'warning' : 'info'] }]} />
      <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text, flex: 1 }}>
        {message}
      </Text>
    </TouchableOpacity>
  );
}

export function Dialog({ visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, onConfirm, onCancel }: {
  visible: boolean; title: string; message?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; onConfirm?: () => void; onCancel?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: theme.roles.overlay }]}>
        <Card style={styles.dialog} elevation="lg">
          <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{title}</Text>
          {message ? <Text variant="body" color="inherit" style={{ color: theme.roles.textSecondary, marginTop: 8 }}>{message}</Text> : null}
          <View style={styles.dialogActions}>
            <Button variant="ghost" size="md" onPress={onCancel} style={{ flex: 1 }}>{cancelLabel}</Button>
            <Button variant={destructive ? 'destructive' : 'primary'} size="md" onPress={onConfirm} style={{ flex: 1 }}>{confirmLabel}</Button>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

export function BottomSheet({ visible, title, onClose, children }: { visible: boolean; title?: string; onClose?: () => void; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.roles.overlay, justifyContent: 'flex-end' }]}>
        <View style={[styles.sheet, { backgroundColor: theme.roles.surface, borderTopLeftRadius: theme.borderRadius.xl, borderTopRightRadius: theme.borderRadius.xl }]}>
          <View style={[styles.grabber, { backgroundColor: theme.roles.borderStrong }]} />
          {title ? <Text variant="h4" color="inherit" style={{ color: theme.roles.text, marginBottom: 12 }}>{title}</Text> : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function EmptyState({ title, message, actionLabel, onAction, icon = '◇' }: { title: string; message?: string; actionLabel?: string; onAction?: () => void; icon?: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.state}>
      <Text variant="h2" color="inherit" style={{ color: theme.roles.textMuted }}>{icon}</Text>
      <Text variant="h4" color="inherit" style={{ color: theme.roles.text, marginTop: 8 }}>{title}</Text>
      {message ? <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted, textAlign: 'center', marginTop: 4 }}>{message}</Text> : null}
      {actionLabel && onAction ? <Button variant="primary" size="md" onPress={onAction} style={{ marginTop: 16 }}>{actionLabel}</Button> : null}
    </View>
  );
}

export function ErrorState({ title = 'Something went wrong', message, actionLabel = 'Retry', onAction }: { title?: string; message?: string; actionLabel?: string; onAction?: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.state}>
      <Text variant="h2" color="inherit" style={{ color: theme.colors.error }}>!</Text>
      <Text variant="h4" color="inherit" style={{ color: theme.roles.text, marginTop: 8 }}>{title}</Text>
      {message ? <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted, textAlign: 'center', marginTop: 4 }}>{message}</Text> : null}
      <Button variant="primary" size="md" onPress={onAction} style={{ marginTop: 16 }}>{actionLabel}</Button>
    </View>
  );
}

export function SuccessState({ title, message, actionLabel, onAction }: { title: string; message?: string; actionLabel?: string; onAction?: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.state}>
      <Text variant="h2" color="inherit" style={{ color: theme.colors.success }}>✓</Text>
      <Text variant="h4" color="inherit" style={{ color: theme.roles.text, marginTop: 8 }}>{title}</Text>
      {message ? <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted, textAlign: 'center', marginTop: 4 }}>{message}</Text> : null}
      {actionLabel && onAction ? <Button variant="primary" size="md" onPress={onAction} style={{ marginTop: 16 }}>{actionLabel}</Button> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  bannerBody: { flex: 1, gap: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginHorizontal: 16, marginBottom: 12 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 420 },
  dialogActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  sheet: { width: '100%', padding: 20, paddingBottom: 32 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 16 },
  state: { alignItems: 'center', justifyContent: 'center', padding: 32 },
});
