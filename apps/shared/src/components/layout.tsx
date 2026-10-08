import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ViewProps, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import { Text as TextComponent } from './primitives';

const HIT_TARGET = 44;

type ColorKey = keyof typeof colors;

/** ScreenContainer — themed root surface. `Screen` is kept as an alias for existing usage. */
export const Screen = React.forwardRef<View, ViewProps & { backgroundColor?: ColorKey }>(
  ({ children, style, backgroundColor, ...props }, ref) => {
    const { theme } = useTheme();
    const bg = backgroundColor ? theme.colors[backgroundColor] : theme.roles.bg;
    return (
      <SafeAreaView ref={ref} style={[styles.screen, { backgroundColor: bg }, style]} {...props}>
        {children}
      </SafeAreaView>
    );
  },
);
Screen.displayName = 'Screen';

export const ScreenContainer = Screen;

export const ScrollableScreen = React.forwardRef<ScrollView, ScrollViewProps & {
  backgroundColor?: ColorKey;
  contentContainerStyle?: any;
}>(
  ({ children, style, backgroundColor, contentContainerStyle, ...props }, ref) => {
    const { theme } = useTheme();
    const bg = backgroundColor ? theme.colors[backgroundColor] : theme.roles.bg;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <ScrollView ref={ref} style={style} contentContainerStyle={[styles.scrollContent, contentContainerStyle]} {...props}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  },
);
ScrollableScreen.displayName = 'ScrollableScreen';

/** TopBar — themed header with back + title + optional right action (rightAction + onRightPress). */
export const Header = React.forwardRef<View, ViewProps & {
  title: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  onRightPress?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}>(
  ({ title, leftAction, rightAction, onRightPress, showBack = false, onBack, style, ...props }, ref) => {
    const { theme } = useTheme();
    const { roles, spacing } = theme;
    return (
      <View
        ref={ref}
        style={[styles.header, { backgroundColor: roles.surface, borderBottomColor: roles.border }, style]}
        {...props}
      >
        <View style={styles.headerContent}>
          {(showBack || leftAction) && (
            <TouchableOpacity style={styles.headerAction} onPress={onBack} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
              {leftAction || (
                <TextComponent variant="h4" color="inherit" style={[styles.backText, { color: roles.text }]}>
                  ←
                </TextComponent>
              )}
            </TouchableOpacity>
          )}
          <TextComponent variant="h3" color="inherit" style={[styles.headerTitle, { color: roles.text }]} numberOfLines={1}>
            {title}
          </TextComponent>
          <TouchableOpacity
            style={[styles.headerAction, { width: 48 }]}
            onPress={onRightPress}
            disabled={!onRightPress}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            {rightAction}
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);
Header.displayName = 'Header';

export const TopBar = Header;

export const TabBar = React.forwardRef<View, ViewProps & {
  tabs: Array<{ label: string; icon: React.ReactNode; activeIcon?: React.ReactNode; badge?: string | number }>;
  activeIndex: number;
  onPress: (index: number) => void;
}>(
  ({ tabs, activeIndex, onPress, style, ...props }, ref) => {
    const { theme } = useTheme();
    const { roles, colors: c, spacing } = theme;
    return (
      <View ref={ref} style={[styles.tabBar, { backgroundColor: roles.surface, borderTopColor: roles.border }, style]} {...props}>
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <TouchableOpacity key={index} style={styles.tabItem} onPress={() => onPress(index)} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: isActive }}>
              <View style={styles.tabIconContainer}>
                {isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
                {tab.badge ? (
                  <View style={[styles.badge, { backgroundColor: c.error }]}>
                    <TextComponent variant="caption" color="inherit" style={{ color: c.white, fontSize: 10, fontWeight: '700' }}>
                      {typeof tab.badge === 'number' && tab.badge > 9 ? '9+' : tab.badge}
                    </TextComponent>
                  </View>
                ) : null}
              </View>
              <TextComponent variant="caption" color="inherit" style={{ color: isActive ? roles.primaryAction : roles.textMuted, fontWeight: isActive ? '600' : '500', marginTop: spacing.xs }}>
                {tab.label}
              </TextComponent>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  },
);
TabBar.displayName = 'TabBar';

export const Divider = React.forwardRef<View, ViewProps & { orientation?: 'horizontal' | 'vertical'; label?: string }>(
  ({ orientation = 'horizontal', label, style, ...props }, ref) => {
    const { theme } = useTheme();
    const { roles, spacing } = theme;
    if (orientation === 'vertical') {
      return <View ref={ref} style={[styles.dividerVertical, { backgroundColor: roles.border }, style]} {...props} />;
    }
    return (
      <View style={[styles.dividerContainer, { gap: spacing.md }]} {...props}>
        <View ref={ref} style={[styles.dividerHorizontal, { backgroundColor: roles.border }]} />
        {label && (
          <TextComponent variant="caption" color="inherit" style={{ color: roles.textMuted }}>
            {label}
          </TextComponent>
        )}
        <View style={[styles.dividerHorizontal, { backgroundColor: roles.border }]} />
      </View>
    );
  },
);
Divider.displayName = 'Divider';

export const Row = React.forwardRef<View, ViewProps & {
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: keyof typeof import('../theme').spacing | number;
}>(
  ({ children, style, align = 'center', justify = 'start', gap = 0, ...props }, ref) => {
    const { theme } = useTheme();
    const gapValue = typeof gap === 'string' ? theme.spacing[gap] : gap;
    return (
      <View ref={ref} style={[styles.row, { alignItems: align as any, justifyContent: justify as any, gap: gapValue }, style]} {...props}>
        {children}
      </View>
    );
  },
);
Row.displayName = 'Row';

export const Column = React.forwardRef<View, ViewProps & {
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: keyof typeof import('../theme').spacing | number;
}>(
  ({ children, style, align = 'stretch', justify = 'start', gap = 0, ...props }, ref) => {
    const { theme } = useTheme();
    const gapValue = typeof gap === 'string' ? theme.spacing[gap] : gap;
    return (
      <View ref={ref} style={[styles.column, { alignItems: align as any, justifyContent: justify as any, gap: gapValue }, style]} {...props}>
        {children}
      </View>
    );
  },
);
Column.displayName = 'Column';

export const Center = React.forwardRef<View, ViewProps>(({ children, style, ...props }, ref) => (
  <View ref={ref} style={[styles.center, style]} {...props}>
    {children}
  </View>
));
Center.displayName = 'Center';

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16 },
  header: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerAction: { width: HIT_TARGET, height: HIT_TARGET, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, height: 80, borderTopWidth: 1 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: HIT_TARGET },
  tabIconContainer: { position: 'relative' },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center' },
  dividerHorizontal: { flex: 1, height: 1 },
  dividerVertical: { width: 1 },
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
