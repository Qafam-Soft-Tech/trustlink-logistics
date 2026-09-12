import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { theme, Theme } from '../theme';

type ThemedProps = {
  theme?: Theme;
};

export const Box = React.forwardRef<View, View['props'] & ThemedProps>(
  ({ theme: customTheme = theme, children, style, ...props }, ref) => {
    return <View ref={ref} style={[styles.container, style]} {...props}>{children}</View>;
  },
);
Box.displayName = 'Box';

export const Text = React.forwardRef<Text, Text['props'] & ThemedProps>(
  ({ theme: customTheme = theme, children, style, variant = 'body', color = 'textPrimary', ...props }, ref) => {
    const themeColors = customTheme.colors;
    const themeTypography = customTheme.typography;

    const variants = {
      h1: { fontSize: themeTypography.fontSize.xxxl, fontWeight: themeTypography.fontWeight.bold, lineHeight: themeTypography.lineHeight.tight },
      h2: { fontSize: themeTypography.fontSize.xxl, fontWeight: themeTypography.fontWeight.bold, lineHeight: themeTypography.lineHeight.tight },
      h3: { fontSize: themeTypography.fontSize.xl, fontWeight: themeTypography.fontWeight.semibold, lineHeight: themeTypography.lineHeight.normal },
      h4: { fontSize: themeTypography.fontSize.lg, fontWeight: themeTypography.fontWeight.semibold, lineHeight: themeTypography.lineHeight.normal },
      body: { fontSize: themeTypography.fontSize.md, fontWeight: themeTypography.fontWeight.regular, lineHeight: themeTypography.lineHeight.normal },
      bodySmall: { fontSize: themeTypography.fontSize.sm, fontWeight: themeTypography.fontWeight.regular, lineHeight: themeTypography.lineHeight.normal },
      caption: { fontSize: themeTypography.fontSize.xs, fontWeight: themeTypography.fontWeight.regular, lineHeight: themeTypography.lineHeight.normal },
      button: { fontSize: themeTypography.fontSize.md, fontWeight: themeTypography.fontWeight.semibold, lineHeight: themeTypography.lineHeight.normal },
    };

    return (
      <Text
        ref={ref}
        style={[
          styles.text,
          variants[variant],
          { color: themeColors[color as keyof typeof themeColors] },
          style,
        ]}
        {...props}
      >
        {children}
      </Text>
    );
  },
);
Text.displayName = 'Text';

export const Button = React.forwardRef<TouchableOpacity, TouchableOpacity['props'] & ThemedProps & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}>(
  ({
    theme: customTheme = theme,
    children,
    style,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    onPress,
    ...props
  }, ref) => {
    const themeColors = customTheme.colors;
    const themeSpacing = customTheme.spacing;
    const themeBorderRadius = customTheme.borderRadius;
    const themeTypography = customTheme.typography;

    const variants = {
      primary: {
        backgroundColor: themeColors.navy,
        textColor: themeColors.textOnPrimary,
        borderColor: themeColors.navy,
      },
      secondary: {
        backgroundColor: themeColors.gold,
        textColor: themeColors.textOnPrimary,
        borderColor: themeColors.gold,
      },
      outline: {
        backgroundColor: 'transparent',
        textColor: themeColors.navy,
        borderColor: themeColors.navy,
      },
      ghost: {
        backgroundColor: 'transparent',
        textColor: themeColors.navy,
        borderColor: 'transparent',
      },
      danger: {
        backgroundColor: themeColors.error,
        textColor: themeColors.white,
        borderColor: themeColors.error,
      },
    };

    const sizes = {
      sm: { paddingVertical: themeSpacing.xs, paddingHorizontal: themeSpacing.md, fontSize: themeTypography.fontSize.sm },
      md: { paddingVertical: themeSpacing.sm, paddingHorizontal: themeSpacing.lg, fontSize: themeTypography.fontSize.md },
      lg: { paddingVertical: themeSpacing.md, paddingHorizontal: themeSpacing.xl, fontSize: themeTypography.fontSize.lg },
    };

    const variantStyles = variants[variant];
    const sizeStyles = sizes[size];
    const isDisabled = disabled || loading;

    return (
      <TouchableOpacity
        ref={ref}
        style={[
          styles.button,
          {
            backgroundColor: isDisabled ? themeColors.gray300 : variantStyles.backgroundColor,
            borderColor: isDisabled ? themeColors.gray300 : variantStyles.borderColor,
            borderWidth: variant === 'outline' ? 2 : 0,
            borderRadius: themeBorderRadius.md,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          style,
        ]}
        onPress={isDisabled ? undefined : onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variantStyles.textColor} />
        ) : (
          <>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text
              variant="button"
              color={isDisabled ? 'gray500' : (variantStyles.textColor as any)}
              style={{ fontSize: sizeStyles.fontSize }}
            >
              {children}
            </Text>
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </>
        )}
      </TouchableOpacity>
    );
  },
);
Button.displayName = 'Button';

export const Input = React.forwardRef<TextInput, TextInput['props'] & ThemedProps & {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}>(
  ({
    theme: customTheme = theme,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    style,
    ...props
  }, ref) => {
    const themeColors = customTheme.colors;
    const themeSpacing = customTheme.spacing;
    const themeBorderRadius = customTheme.borderRadius;

    const hasError = !!error;
    const borderColor = hasError ? themeColors.error : themeColors.border;
    const focusBorderColor = hasError ? themeColors.error : themeColors.borderFocus;

    return (
      <View style={styles.inputContainer}>
        {label && (
          <Text variant="bodySmall" color="textSecondary" style={styles.label}>
            {label}
          </Text>
        )}
        <View style={styles.inputWrapper}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                borderColor,
                borderRadius: themeBorderRadius.md,
                paddingHorizontal: themeSpacing.md,
                paddingVertical: themeSpacing.sm,
              },
              style,
            ]}
            placeholderTextColor={themeColors.textTertiary}
            selectionColor={themeColors.navy}
            {...props}
          />
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
        {(error || helperText) && (
          <Text variant="caption" color={hasError ? 'error' : 'textTertiary'} style={styles.helperText}>
            {error || helperText}
          </Text>
        )}
      </View>
    );
  },
);
Input.displayName = 'Input';

export const Card = React.forwardRef<View, View['props'] & ThemedProps & {
  elevation?: 'none' | 'sm' | 'md' | 'lg';
}>(
  ({ theme: customTheme = theme, children, style, elevation = 'md', ...props }, ref) => {
    const themeColors = customTheme.colors;
    const themeShadows = customTheme.shadows;
    const themeBorderRadius = customTheme.borderRadius;

    return (
      <View
        ref={ref}
        style={[
          styles.card,
          {
            backgroundColor: themeColors.surface,
            borderRadius: themeBorderRadius.lg,
            ...themeShadows[elevation],
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  },
);
Card.displayName = 'Card';

export const Avatar = React.forwardRef<Image, Image['props'] & ThemedProps & {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
}>(
  ({ theme: customTheme = theme, size = 'md', source, name, style, ...props }, ref) => {
    const themeColors = customTheme.colors;
    const themeSpacing = customTheme.spacing;
    const themeBorderRadius = customTheme.borderRadius;

    const sizes = {
      xs: 24,
      sm: 32,
      md: 40,
      lg: 56,
      xl: 72,
    };

    const sizeValue = sizes[size];

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const getColorFromName = (name: string) => {
      const colors = [
        themeColors.navy,
        themeColors.gold,
        themeColors.success,
        themeColors.warning,
        themeColors.error,
        themeColors.info,
      ];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
    };

    if (source) {
      return (
        <Image
          ref={ref}
          source={source}
          style={[
            styles.avatar,
            { width: sizeValue, height: sizeValue, borderRadius: themeBorderRadius.full },
            style,
          ]}
          {...props}
        />
      );
    }

    const bgColor = name ? getColorFromName(name) : themeColors.gray300;
    const initials = name ? getInitials(name) : '?';

    return (
      <View
        ref={ref}
        style={[
          styles.avatar,
          {
            width: sizeValue,
            height: sizeValue,
            borderRadius: themeBorderRadius.full,
            backgroundColor: bgColor,
            justifyContent: 'center',
            alignItems: 'center',
          },
          style,
        ]}
        {...props}
      >
        <Text variant="body" color="white" style={{ fontSize: sizeValue * 0.35, fontWeight: '600' }}>
          {initials}
        </Text>
      </View>
    );
  },
);
Avatar.displayName = 'Avatar';

export const Badge = React.forwardRef<View, View['props'] & ThemedProps & {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'sm' | 'md';
}>(
  ({ theme: customTheme = theme, children, style, variant = 'default', size = 'md', ...props }, ref) => {
    const themeColors = customTheme.colors;
    const themeSpacing = customTheme.spacing;
    const themeBorderRadius = customTheme.borderRadius;
    const themeTypography = customTheme.typography;

    const variants = {
      default: { backgroundColor: themeColors.gray100, textColor: themeColors.textSecondary },
      success: { backgroundColor: '#d1fae5', textColor: themeColors.success },
      warning: { backgroundColor: '#fef3c7', textColor: themeColors.warning },
      error: { backgroundColor: '#fee2e2', textColor: themeColors.error },
      info: { backgroundColor: '#dbeafe', textColor: themeColors.info },
      primary: { backgroundColor: '#e0e7ff', textColor: themeColors.navy },
    };

    const sizes = {
      sm: { paddingHorizontal: themeSpacing.sm, paddingVertical: themeSpacing.xs, fontSize: themeTypography.fontSize.xs },
      md: { paddingHorizontal: themeSpacing.md, paddingVertical: themeSpacing.xs, fontSize: themeTypography.fontSize.sm },
    };

    const variantStyles = variants[variant];
    const sizeStyles = sizes[size];

    return (
      <View
        ref={ref}
        style={[
          styles.badge,
          {
            backgroundColor: variantStyles.backgroundColor,
            borderRadius: themeBorderRadius.full,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            paddingVertical: sizeStyles.paddingVertical,
          },
          style,
        ]}
        {...props}
      >
        <Text variant="caption" color={variantStyles.textColor as any} style={{ fontSize: sizeStyles.fontSize, fontWeight: '600' }}>
          {children}
        </Text>
      </View>
    );
  },
);
Badge.displayName = 'Badge';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {},
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  iconLeft: {
    marginRight: theme.spacing.xs,
  },
  iconRight: {
    marginLeft: theme.spacing.xs,
  },
  inputContainer: {
    gap: theme.spacing.xs,
  },
  label: {
    marginLeft: theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
  },
  helperText: {
    marginLeft: theme.spacing.xs,
  },
  card: {
    padding: theme.spacing.md,
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});