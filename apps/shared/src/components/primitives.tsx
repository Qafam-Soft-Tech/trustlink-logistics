import React from 'react';
import Animated from 'react-native-reanimated';
import { usePressScale } from '../motion';
import { View, Text as RNText, StyleSheet, TouchableOpacity, TextInput, Image, ActivityIndicator, ViewProps, TextProps, TouchableOpacityProps, TextInputProps, ImageProps } from 'react-native';
import { colors } from '../theme';
import { useTheme } from '../theme/ThemeProvider';

type ColorKey = keyof typeof colors;

const HIT_TARGET = 44;

export const Box = React.forwardRef<View, ViewProps>(({ children, style, ...props }, ref) => (
  <View ref={ref} style={[styles.container, style]} {...props}>
    {children}
  </View>
));
Box.displayName = 'Box';

export type ThemedTextProps = TextProps & {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption' | 'button' | 'label';
  /** a semantic colour token key, or 'inherit' — literal colours are not allowed (use theme roles) */
  color?: ColorKey | 'inherit';
};

export const Text = React.forwardRef<RNText, ThemedTextProps>(
  ({ children, style, variant = 'body', color = 'textPrimary', maxFontSizeMultiplier = 1.3, ...props }, ref) => {
    const { theme } = useTheme();
    const { fontSize, fontWeight, lineHeight, fontFamily } = theme.typography;
    const variants = {
      h1: { fontSize: fontSize.xxxl, fontWeight: fontWeight.bold, fontFamily: fontFamily.bold, lineHeight: Math.round(fontSize.xxxl * lineHeight.tight) },
      h2: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, fontFamily: fontFamily.bold, lineHeight: Math.round(fontSize.xxl * lineHeight.tight) },
      h3: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, fontFamily: fontFamily.medium, lineHeight: Math.round(fontSize.xl * lineHeight.normal) },
      h4: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, fontFamily: fontFamily.medium, lineHeight: Math.round(fontSize.lg * lineHeight.normal) },
      body: { fontSize: fontSize.md, fontWeight: fontWeight.regular, fontFamily: fontFamily.regular, lineHeight: Math.round(fontSize.md * lineHeight.normal) },
      bodySmall: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, fontFamily: fontFamily.regular, lineHeight: Math.round(fontSize.sm * lineHeight.normal) },
      caption: { fontSize: fontSize.xs, fontWeight: fontWeight.regular, fontFamily: fontFamily.regular, lineHeight: Math.round(fontSize.xs * lineHeight.normal) },
      button: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, fontFamily: fontFamily.medium, lineHeight: Math.round(fontSize.md * lineHeight.normal) },
      label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, fontFamily: fontFamily.medium, lineHeight: Math.round(fontSize.sm * lineHeight.normal) },
    } as const;
    const resolved = color === 'inherit' ? undefined : theme.colors[color as ColorKey];
    return (
      <RNText ref={ref} maxFontSizeMultiplier={maxFontSizeMultiplier} style={[variants[variant] as any, resolved ? { color: resolved } : null, style]} {...props}>
        {children}
      </RNText>
    );
  },
);
Text.displayName = 'Text';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'destructive';

export const Button = React.forwardRef<View, TouchableOpacityProps & {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}>(
  ({ children, style, variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, disabled, onPress, ...props }, ref) => {
    const { theme } = useTheme();
    const { roles, spacing, borderRadius, typography } = theme;

    const variants: Record<ButtonVariant, { bg: string; text: string; border: string }> = {
      primary: { bg: roles.primaryAction, text: roles.primaryActionText, border: roles.primaryAction },
      accent: { bg: roles.accent, text: roles.accentText, border: roles.accent },
      secondary: { bg: theme.colors.navyLight, text: theme.colors.white, border: theme.colors.navyLight },
      outline: { bg: 'transparent', text: roles.primaryAction, border: roles.primaryAction },
      ghost: { bg: 'transparent', text: roles.primaryAction, border: 'transparent' },
      danger: { bg: roles.danger, text: roles.dangerText, border: roles.danger },
      destructive: { bg: roles.danger, text: roles.dangerText, border: roles.danger },
    };
    const sizes = {
      sm: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, fontSize: typography.fontSize.sm, minHeight: 36 },
      md: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, fontSize: typography.fontSize.md, minHeight: HIT_TARGET },
      lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, fontSize: typography.fontSize.lg, minHeight: 52 },
    };
    const v = variants[variant];
    const s = sizes[size];
    const isDisabled = disabled || loading;
    const press = usePressScale();

    return (
      <Animated.View style={press.animatedStyle}>
      <TouchableOpacity
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={typeof children === 'string' ? children : props.accessibilityLabel}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[
          styles.button,
          {
            backgroundColor: isDisabled ? theme.colors.gray300 : v.bg,
            borderColor: isDisabled ? theme.colors.gray300 : v.border,
            borderWidth: variant === 'outline' ? 2 : 0,
            borderRadius: borderRadius.md,
            paddingVertical: s.paddingVertical,
            paddingHorizontal: s.paddingHorizontal,
            minHeight: s.minHeight,
          },
          style,
        ]}
        onPress={isDisabled ? undefined : onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={v.text} />
        ) : (
          <>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text variant="button" color="inherit" style={{ color: isDisabled ? theme.colors.gray500 : v.text, fontSize: s.fontSize }}>
              {children}
            </Text>
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </>
        )}
      </TouchableOpacity>
      </Animated.View>
    );
  },
);
Button.displayName = 'Button';

export const Input = React.forwardRef<TextInput, TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}>(
  ({ label, error, helperText, leftIcon, rightIcon, style, ...props }, ref) => {
    const { theme } = useTheme();
    const { colors: c, roles, spacing, borderRadius } = theme;
    const hasError = !!error;
    const borderColor = hasError ? c.error : roles.border;

    return (
      <View style={styles.inputContainer}>
        {label && (
          <Text variant="label" color="textSecondary" style={styles.label}>
            {label}
          </Text>
        )}
        <View style={styles.inputWrapper}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            accessibilityLabel={label ?? props.accessibilityLabel}
            accessibilityState={{ disabled: props.editable === false }}
            maxFontSizeMultiplier={1.3}
            style={[
              styles.input,
              { color: roles.text, backgroundColor: roles.surface, borderColor, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: HIT_TARGET },
              style,
            ]}
            placeholderTextColor={roles.textMuted}
            selectionColor={roles.primaryAction}
            {...props}
          />
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
        {(error || helperText) && (
          <Text variant="caption" color="inherit" style={[styles.helperText, { color: hasError ? c.error : roles.textMuted }]}>
            {error || helperText}
          </Text>
        )}
      </View>
    );
  },
);
Input.displayName = 'Input';

export const Card = React.forwardRef<View, ViewProps & {
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  activeOpacity?: number;
}>(
  ({ children, style, elevation = 'md', onPress, activeOpacity = 0.9, ...props }, ref) => {
    const { theme } = useTheme();
    const { roles, borderRadius, shadows } = theme;
    const cardStyle = [
      styles.card,
      { backgroundColor: roles.surface, borderRadius: borderRadius.lg, borderColor: roles.border, borderWidth: 1 },
      elevation === 'none' ? undefined : shadows[elevation],
      style,
    ];
    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={activeOpacity}>
          <View ref={ref} style={cardStyle} {...props}>
            {children}
          </View>
        </TouchableOpacity>
      );
    }
    return (
      <View ref={ref} style={cardStyle} {...props}>
        {children}
      </View>
    );
  },
);
Card.displayName = 'Card';

export const Avatar = React.forwardRef<Image, ImageProps & {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
}>(
  ({ size = 'md', source, name, style, ...props }, ref) => {
    const { theme } = useTheme();
    const sizes = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 };
    const sizeValue = sizes[size];
    const getInitials = (n: string) => n.split(' ').map((x) => x[0]).join('').toUpperCase().slice(0, 2);
    const palette = [theme.colors.navy, theme.colors.gold, theme.colors.success, theme.colors.warning, theme.colors.error, theme.colors.info];
    const colorFor = (n: string) => {
      let hash = 0;
      for (let i = 0; i < n.length; i++) hash = n.charCodeAt(i) + ((hash << 5) - hash);
      return palette[Math.abs(hash) % palette.length];
    };
    if (source) {
      return <Image ref={ref} source={source} style={[styles.avatar, { width: sizeValue, height: sizeValue, borderRadius: theme.borderRadius.full }, style]} {...props} />;
    }
    return (
      <View
        ref={ref}
        style={[
          styles.avatar,
          { width: sizeValue, height: sizeValue, borderRadius: theme.borderRadius.full, backgroundColor: name ? colorFor(name) : theme.colors.gray300 },
          style,
        ]}
        {...props}
      >
        <Text variant="body" color="inherit" style={{ color: theme.colors.white, fontSize: sizeValue * 0.35, fontWeight: '600' }}>
          {name ? getInitials(name) : '?'}
        </Text>
      </View>
    );
  },
);
Avatar.displayName = 'Avatar';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';

export const Badge = React.forwardRef<View, ViewProps & {
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
}>(
  ({ children, style, variant = 'default', size = 'md', ...props }, ref) => {
    const { theme } = useTheme();
    const { roles, spacing, borderRadius, typography, colors: c } = theme;
    const variants: Record<BadgeVariant, { bg: string; text: string }> = {
      default: { bg: c.gray100, text: roles.badgeText.neutral },
      success: { bg: c.success + '22', text: roles.badgeText.success },
      warning: { bg: c.warning + '22', text: roles.badgeText.warning },
      error: { bg: c.error + '22', text: roles.badgeText.error },
      info: { bg: c.info + '22', text: roles.badgeText.info },
      primary: { bg: c.navy + '18', text: roles.text },
    };
    const sizes = {
      xs: { paddingHorizontal: spacing.xs, paddingVertical: 2, fontSize: typography.fontSize.xs },
      sm: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, fontSize: typography.fontSize.xs },
      md: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, fontSize: typography.fontSize.sm },
    };
    const v = variants[variant];
    const s = sizes[size];
    return (
      <View ref={ref} style={[styles.badge, { backgroundColor: v.bg, borderRadius: borderRadius.full, paddingHorizontal: s.paddingHorizontal, paddingVertical: s.paddingVertical }, style]} {...props}>
        <Text variant="caption" color="inherit" style={{ color: v.text, fontSize: s.fontSize, fontWeight: '600' }}>
          {children}
        </Text>
      </View>
    );
  },
);
Badge.displayName = 'Badge';

export const Chip = React.forwardRef<View, TouchableOpacityProps & {
  label: string;
  selected?: boolean;
  icon?: React.ReactNode;
}>(
  ({ label, selected = false, icon, style, onPress, ...props }, ref) => {
    const { theme } = useTheme();
    const { roles, spacing, borderRadius } = theme;
    return (
      <TouchableOpacity
        ref={ref}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        style={[
          styles.chip,
          {
            backgroundColor: selected ? roles.primaryAction : roles.surface,
            borderColor: selected ? roles.primaryAction : roles.borderStrong,
            borderRadius: borderRadius.full,
            paddingHorizontal: spacing.md,
            minHeight: 36,
          },
          style,
        ]}
        {...props}
      >
        {icon && <View style={styles.iconLeft}>{icon}</View>}
        <Text variant="label" color="inherit" style={{ color: selected ? roles.primaryActionText : roles.text }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  },
);
Chip.displayName = 'Chip';

const styles = StyleSheet.create({
  container: { flex: 1 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  iconLeft: { marginRight: 4 },
  iconRight: { marginLeft: 4 },
  inputContainer: { gap: 4 },
  label: { marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 16, borderWidth: 1 },
  helperText: { marginLeft: 4 },
  card: { padding: 16 },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  badge: { alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
