/**
 * TrustLink design tokens — light + dark, semantic roles.
 * Brand: navy #0b1f47 (primary), gold #b8863a (accent).
 */
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedMode = 'light' | 'dark';

export const colors = {
  // Primary brand colors
  navy: '#0b1f47',
  navyLight: '#142d5e',
  navyDark: '#06122e',
  gold: '#b8863a',
  goldLight: '#d4a55d',
  goldDark: '#966b2e',

  // Semantic colors
  success: '#059669',
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

  // Text colors (textMuted is the accessible replacement for textTertiary on white, ~5.6:1)
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textTertiary: '#9ca3af',
  textMuted: '#5b6472',
  textInverse: '#ffffff',
  textOnPrimary: '#ffffff',

  // Border colors
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  borderStrong: '#d1d5db',
  borderFocus: '#b8863a',

  // Accessibility-derived accent (gold on light fails contrast; this is ≥4.5:1 on white)
  goldText: '#8a5f22',

  // Status colors for delivery states
  statusRequested: '#3b82f6',
  statusSearching: '#f59e0b',
  statusAssigned: '#8b5cf6',
  statusPickedUp: '#06b6d4',
  statusInTransit: '#3b82f6',
  statusDelivered: '#059669',
  statusFailed: '#ef4444',
  statusReturned: '#6b7280',
  statusCancelled: '#9ca3af',
};

export const darkColors: typeof colors = {
  ...colors,
  navy: '#142d5e',
  navyLight: '#1c3a72',
  navyDark: '#0b1f47',
  gold: '#d4a55d',
  goldLight: '#e0b877',
  goldDark: '#b8863a',

  success: '#34d399',
  successLight: '#6ee7b7',
  warning: '#fbbf24',
  warningLight: '#fcd34d',
  error: '#f87171',
  errorLight: '#fca5a5',
  info: '#60a5fa',
  infoLight: '#93c5fd',

  gray50: '#0f172a',
  gray100: '#16203a',
  gray200: '#243049',
  gray300: '#33405c',
  gray400: '#54617a',
  gray500: '#7b879b',
  gray600: '#9aa6b8',
  gray700: '#c3cad6',
  gray800: '#e2e6ec',
  gray900: '#f3f4f6',

  background: '#0b1220',
  backgroundSecondary: '#0f172a',
  surface: '#131c2e',
  surfaceElevated: '#1a2438',

  textPrimary: '#f3f4f6',
  textSecondary: '#c3cad6',
  textTertiary: '#9aa6b8',
  textMuted: '#9aa6b8',
  textInverse: '#0b1220',
  textOnPrimary: '#0b1220',

  border: '#243049',
  borderLight: '#1a2438',
  borderStrong: '#33405c',
  borderFocus: '#d4a55d',

  goldText: '#e0b877',

  statusRequested: '#60a5fa',
  statusSearching: '#fbbf24',
  statusAssigned: '#a78bfa',
  statusPickedUp: '#22d3ee',
  statusInTransit: '#60a5fa',
  statusDelivered: '#34d399',
  statusFailed: '#f87171',
  statusReturned: '#9aa6b8',
  statusCancelled: '#7b879b',
};

export interface ThemeRoles {
  bg: string;
  bgSecondary: string;
  surface: string;
  surfaceElevated: string;
  overlay: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  primaryAction: string;
  primaryActionText: string;
  accent: string;
  accentText: string;
  accentOnLight: string;
  danger: string;
  dangerText: string;
  /** accessible text colours for tinted badges/chips */
  badgeText: { success: string; warning: string; error: string; info: string; neutral: string };
  status: {
    requested: string;
    searching: string;
    assigned: string;
    picked_up: string;
    in_transit: string;
    delivered: string;
    failed: string;
    returned: string;
    cancelled: string;
  };
  /** accessible text colours paired with each status tint */
  statusText: {
    requested: string;
    searching: string;
    assigned: string;
    picked_up: string;
    in_transit: string;
    delivered: string;
    failed: string;
    returned: string;
    cancelled: string;
  };
}

export const lightRoles: ThemeRoles = {
  bg: colors.background,
  bgSecondary: colors.backgroundSecondary,
  surface: colors.surface,
  surfaceElevated: colors.surfaceElevated,
  overlay: 'rgba(11, 31, 71, 0.45)',
  border: colors.border,
  borderStrong: colors.borderStrong,
  text: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textMuted: colors.textMuted,
  textInverse: colors.white,
  primaryAction: colors.navy,
  primaryActionText: colors.white,
  accent: colors.gold,
  accentText: colors.navy,
  accentOnLight: colors.goldText,
  danger: '#b91c1c',
  dangerText: colors.white,
  badgeText: { success: '#065f46', warning: '#92400e', error: '#991b1b', info: '#1e40af', neutral: '#374151' },
  status: {
    requested: colors.statusRequested,
    searching: colors.statusSearching,
    assigned: colors.statusAssigned,
    picked_up: colors.statusPickedUp,
    in_transit: colors.statusInTransit,
    delivered: colors.statusDelivered,
    failed: colors.statusFailed,
    returned: colors.statusReturned,
    cancelled: colors.statusCancelled,
  },
  statusText: {
    requested: '#1d4ed8',
    searching: '#92400e',
    assigned: '#6d28d9',
    picked_up: '#0e7490',
    in_transit: '#1d4ed8',
    delivered: '#047857',
    failed: '#b91c1c',
    returned: '#4b5563',
    cancelled: '#6b7280',
  },
};

export const darkRoles: ThemeRoles = {
  bg: darkColors.background,
  bgSecondary: darkColors.backgroundSecondary,
  surface: darkColors.surface,
  surfaceElevated: darkColors.surfaceElevated,
  overlay: 'rgba(0, 0, 0, 0.6)',
  border: darkColors.border,
  borderStrong: darkColors.borderStrong,
  text: darkColors.textPrimary,
  textSecondary: darkColors.textSecondary,
  textMuted: darkColors.textMuted,
  textInverse: darkColors.textInverse,
  // Dark primary action = gold fill with navy text
  primaryAction: darkColors.gold,
  primaryActionText: darkColors.navy,
  accent: darkColors.gold,
  accentText: darkColors.navy,
  accentOnLight: darkColors.goldText,
  danger: '#dc2626',
  dangerText: darkColors.white,
  badgeText: { success: '#6ee7b7', warning: '#fcd34d', error: '#fca5a5', info: '#93c5fd', neutral: '#c3cad6' },
  status: {
    requested: darkColors.statusRequested,
    searching: darkColors.statusSearching,
    assigned: darkColors.statusAssigned,
    picked_up: darkColors.statusPickedUp,
    in_transit: darkColors.statusInTransit,
    delivered: darkColors.statusDelivered,
    failed: darkColors.statusFailed,
    returned: darkColors.statusReturned,
    cancelled: darkColors.statusCancelled,
  },
  statusText: {
    requested: darkColors.statusRequested,
    searching: darkColors.statusSearching,
    assigned: darkColors.statusAssigned,
    picked_up: darkColors.statusPickedUp,
    in_transit: darkColors.statusInTransit,
    delivered: darkColors.statusDelivered,
    failed: darkColors.statusFailed,
    returned: darkColors.statusReturned,
    cancelled: darkColors.statusCancelled,
  },
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
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    bold: 'Inter_700Bold',
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

export interface Theme {
  mode: ResolvedMode;
  colors: typeof colors;
  roles: ThemeRoles;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  shadows: typeof shadows;
}

export function createTheme(mode: ResolvedMode): Theme {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : colors,
    roles: mode === 'dark' ? darkRoles : lightRoles,
    spacing,
    borderRadius,
    typography,
    shadows,
  };
}

/** DEPRECATED light-only theme — kept for existing screens during the transition. Prefer useTheme(). */
export const theme: Theme = createTheme('light');
