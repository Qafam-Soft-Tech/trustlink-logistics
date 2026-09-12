export const colors = {
  // Primary brand colors
  navy: '#0b1f47',
  navyLight: '#142d5e',
  navyDark: '#06122e',
  gold: '#b8863a',
  goldLight: '#d4a55d',
  goldDark: '#966b2e',

  // Semantic colors
  success: '#10b981',
  successLight: '#34d399',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  error: '#ef4444',
  errorLight: '#f87171',
  info: '#3b82f6',
  infoLight: '#60a5fa',

  // Neutral colors
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Background colors
  background: '#ffffff',
  backgroundSecondary: '#f9fafb',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',

  // Text colors
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',
  textOnPrimary: '#ffffff',

  // Border colors
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  borderFocus: '#b8863a',

  // Status colors for delivery states
  statusRequested: '#3b82f6',
  statusSearching: '#f59e0b',
  statusAssigned: '#8b5cf6',
  statusPickedUp: '#06b6d4',
  statusInTransit: '#3b82f6',
  statusDelivered: '#10b981',
  statusFailed: '#ef4444',
  statusReturned: '#6b7280',
  statusCancelled: '#9ca3af',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
};

export type Theme = typeof theme;