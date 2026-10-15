import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeProvider';
import { motion, useEnterTransition, useReducedMotion, useSuccessPop } from '../motion';
import { Text, Button, Card } from './primitives';

/** Shimmering placeholder. Static when Reduce Motion is on. */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }: { width?: number | string; height?: number; radius?: number; style?: any }) {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const travel = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    travel.value = 0;
    travel.value = withRepeat(withTiming(1, { duration: motion.duration.shimmer, easing: motion.easing.standard }), -1, false);
  }, [reduced, travel]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -140 + travel.value * 420 }],
    opacity: 0.55,
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: width as any, height, borderRadius: radius, backgroundColor: theme.colors.gray200, overflow: 'hidden' }, style]}
    >
      {reduced ? null : <Animated.View style={[styles.shimmer, { backgroundColor: theme.colors.gray100 }, shimmerStyle]} />}
    </View>
  );
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
    <View
      accessibilityRole={variant === 'error' ? 'alert' : 'summary'}
      accessibilityLabel={`${title ?? label}: ${message}`}
      style={[styles.banner, { backgroundColor: accent + '18', borderColor: accent }, style]}
    >
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
  const accent = theme.colors[variant === 'offline' ? 'gray500' : variant === 'error' ? 'error' : variant === 'success' ? 'success' : variant === 'warning' ? 'warning' : 'info'];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${message}. Tap to dismiss.`}
      onPress={onDismiss}
      style={[styles.toast, { backgroundColor: theme.roles.surfaceElevated, borderColor: theme.roles.border }]}
    >
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text, flex: 1 }}>
        {message}
      </Text>
    </Pressable>
  );
}

export function Dialog({ visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive = false, onConfirm, onCancel }: {
  visible: boolean; title: string; message?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean; onConfirm?: () => void; onCancel?: () => void;
}) {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = reduced ? 1 : withTiming(1, { duration: motion.duration.fast, easing: motion.easing.decelerate });
      return;
    }
    if (!mounted) return;
    progress.value = reduced
      ? 0
      : withTiming(0, { duration: motion.duration.fast }, (finished) => {
          'worklet';
          if (finished) runOnJS(setMounted)(false);
        });
  }, [visible, reduced, mounted, progress]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.96 + progress.value * 0.04 }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Animated.View style={[styles.overlay, { backgroundColor: theme.roles.overlay }, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Dismiss dialog" />
        <Animated.View style={[styles.dialogWrap, cardStyle]} accessibilityViewIsModal accessibilityRole="alert" accessibilityLabel={title}>
          <Card style={styles.dialog} elevation="lg">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{title}</Text>
            {message ? <Text variant="body" color="inherit" style={{ color: theme.roles.textSecondary, marginTop: 8 }}>{message}</Text> : null}
            <View style={styles.dialogActions}>
              <Button variant="ghost" size="md" onPress={onCancel} style={{ flex: 1 }}>{cancelLabel}</Button>
              <Button variant={destructive ? 'destructive' : 'primary'} size="md" onPress={onConfirm} style={{ flex: 1 }}>{confirmLabel}</Button>
            </View>
          </Card>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/** Bottom sheet: slides in, drag down (or tap the backdrop) to dismiss. */
export function BottomSheet({ visible, title, onClose, children }: { visible: boolean; title?: string; onClose?: () => void; children: React.ReactNode }) {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(visible ? 0 : motion.offset.sheet);
  const backdropOpacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = reduced ? 0 : withTiming(0, { duration: motion.duration.normal, easing: motion.easing.decelerate });
      backdropOpacity.value = reduced ? 1 : withTiming(1, { duration: motion.duration.normal });
      return;
    }
    if (!mounted) return;
    backdropOpacity.value = reduced ? 0 : withTiming(0, { duration: motion.duration.fast });
    translateY.value = reduced
      ? motion.offset.sheet
      : withTiming(motion.offset.sheet, { duration: motion.duration.fast }, (finished) => {
          'worklet';
          if (finished) runOnJS(setMounted)(false);
        });
  }, [visible, reduced, mounted, translateY, backdropOpacity]);

  const close = () => {
    if (onClose) onClose();
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (reduced) return;
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      const dismiss = event.translationY > 120 || event.velocityY > 900;
      if (dismiss) {
        translateY.value = withTiming(motion.offset.sheet, { duration: motion.duration.fast });
        runOnJS(close)();
      } else {
        translateY.value = withTiming(0, { duration: motion.duration.fast, easing: motion.easing.decelerate });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* A React Native Modal renders in its own native root, so the app-level GestureHandlerRootView
          does not cover it: gestures inside the sheet need their own root (Android throws otherwise). */}
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[styles.overlay, { backgroundColor: theme.roles.overlay, justifyContent: 'flex-end' }, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss sheet" />
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[
                styles.sheet,
                { backgroundColor: theme.roles.surface, borderTopLeftRadius: theme.borderRadius.xl, borderTopRightRadius: theme.borderRadius.xl },
                sheetStyle,
              ]}
              accessibilityViewIsModal
              accessibilityLabel={title}
            >
              <View style={[styles.grabber, { backgroundColor: theme.roles.borderStrong }]} />
              {title ? <Text variant="h4" color="inherit" style={{ color: theme.roles.text, marginBottom: 12 }}>{title}</Text> : null}
              {children}
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

export function EmptyState({ title, message, actionLabel, onAction, icon = '◇' }: { title: string; message?: string; actionLabel?: string; onAction?: () => void; icon?: string }) {
  const { theme } = useTheme();
  const enter = useEnterTransition(8);
  return (
    <Animated.View
      style={[styles.state, enter.animatedStyle]}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${message ?? ''}`}
    >
      <Text variant="h2" color="inherit" style={{ color: theme.roles.textMuted }} accessibilityElementsHidden>{icon}</Text>
      <Text variant="h4" color="inherit" style={{ color: theme.roles.text, marginTop: 8 }}>{title}</Text>
      {message ? <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted, textAlign: 'center', marginTop: 4 }}>{message}</Text> : null}
      {actionLabel && onAction ? <Button variant="primary" size="md" onPress={onAction} style={{ marginTop: 16 }}>{actionLabel}</Button> : null}
    </Animated.View>
  );
}

export function ErrorState({ title = 'Something went wrong', message, actionLabel = 'Retry', onAction }: { title?: string; message?: string; actionLabel?: string; onAction?: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.state} accessibilityRole="alert" accessibilityLabel={`${title}. ${message ?? ''}`}>
      <Text variant="h2" color="inherit" style={{ color: theme.colors.error }} accessibilityElementsHidden>!</Text>
      <Text variant="h4" color="inherit" style={{ color: theme.roles.text, marginTop: 8 }}>{title}</Text>
      {message ? <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted, textAlign: 'center', marginTop: 4 }}>{message}</Text> : null}
      <Button variant="primary" size="md" onPress={onAction} style={{ marginTop: 16 }}>{actionLabel}</Button>
    </View>
  );
}

export function SuccessState({ title, message, actionLabel, onAction }: { title: string; message?: string; actionLabel?: string; onAction?: () => void }) {
  const { theme } = useTheme();
  const pop = useSuccessPop();
  return (
    <View style={styles.state} accessibilityRole="summary" accessibilityLabel={`${title}. ${message ?? ''}`}>
      <Animated.Text style={[pop, { fontSize: 32, color: theme.colors.success }]}>✓</Animated.Text>
      <Text variant="h4" color="inherit" style={{ color: theme.roles.text, marginTop: 8 }}>{title}</Text>
      {message ? <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted, textAlign: 'center', marginTop: 4 }}>{message}</Text> : null}
      {actionLabel && onAction ? <Button variant="primary" size="md" onPress={onAction} style={{ marginTop: 16 }}>{actionLabel}</Button> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shimmer: { position: 'absolute', top: 0, bottom: 0, width: 140 },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  bannerBody: { flex: 1, gap: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginHorizontal: 16, marginBottom: 12 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  root: { flex: 1 },
  dialogWrap: { width: '100%', maxWidth: 420 },
  dialog: { width: '100%', maxWidth: 420 },
  dialogActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  sheet: { width: '100%', padding: 20, paddingBottom: 32 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 16 },
  state: { alignItems: 'center', justifyContent: 'center', padding: 32 },
});
