import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Text, TouchableOpacity } from 'react-native';
import { theme, Theme } from '../theme';
import { Box, Text as TextComponent, Button, Avatar } from './primitives';

type ThemedProps = {
  theme?: Theme;
};

export const Screen = React.forwardRef<SafeAreaView, SafeAreaView['props'] & ThemedProps & {
  backgroundColor?: keyof typeof theme.colors;
}>(
  ({ theme: customTheme = theme, children, style, backgroundColor = 'background', ...props }, ref) => {
    return (
      <SafeAreaView
        ref={ref}
        style={[
          styles.screen,
          { backgroundColor: customTheme.colors[backgroundColor] },
          style,
        ]}
        {...props}
      >
        {children}
      </SafeAreaView>
    );
  },
);
Screen.displayName = 'Screen';

export const ScrollableScreen = React.forwardRef<ScrollView, ScrollView['props'] & ThemedProps & {
  backgroundColor?: keyof typeof theme.colors;
  contentContainerStyle?: any;
}>(
  ({ theme: customTheme = theme, children, style, backgroundColor = 'background', contentContainerStyle, ...props }, ref) => {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: customTheme.colors[backgroundColor] }}>
        <ScrollView
          ref={ref}
          style={style}
          contentContainerStyle={[
            styles.scrollContent,
            contentContainerStyle,
          ]}
          {...props}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  },
);
ScrollableScreen.displayName = 'ScrollableScreen';

export const Header = React.forwardRef<View, View['props'] & ThemedProps & {
  title: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}>(
  ({ theme: customTheme = theme, title, leftAction, rightAction, showBack = false, onBack, style, ...props }, ref) => {
    const themeColors = customTheme.colors;
    const themeSpacing = customTheme.spacing;

    return (
      <View
        ref={ref}
        style={[
          styles.header,
          { backgroundColor: themeColors.surface, borderBottomWidth: 1, borderBottomColor: themeColors.border },
          style,
        ]}
        {...props}
      >
        <View style={styles.headerContent}>
          {(showBack || leftAction) && (
            <TouchableOpacity style={styles.headerAction} onPress={onBack} activeOpacity={0.7}>
              {leftAction || (
                <TextComponent variant="h4" color="textPrimary" style={styles.backText}>
                  ←
                </TextComponent>
              )}
            </TouchableOpacity>
          )}
          <TextComponent variant="h3" color="textPrimary" style={styles.headerTitle} numberOfLines={1}>
            {title}
          </TextComponent>
          <TouchableOpacity style={[styles.headerAction, { width: 48 }]} onPress={() => rightAction} activeOpacity={0.7}>
            {rightAction}
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);
Header.displayName = 'Header';

export const TabBar = React.forwardRef<View, View['props'] & ThemedProps & {
  tabs: Array<{ label: string; icon: React.ReactNode; activeIcon?: React.ReactNode; badge?: string | number }>;
  activeIndex: number;
  onPress: (index: number) => void;
}>(
  ({ theme: customTheme = theme, tabs, activeIndex, onPress, style, ...props }, ref) => {
    const themeColors = customTheme.colors;
    const themeSpacing = customTheme.spacing;

    return (
      <View
        ref={ref}
        style={[
          styles.tabBar,
          { backgroundColor: themeColors.surface, borderTopWidth: 1, borderTopColor: themeColors.border },
          style,
        ]}
        {...props}
      >
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <TouchableOpacity
              key={index}
              style={styles.tabItem}
              onPress={() => onPress(index)}
              activeOpacity={0.7}
            >
              <View style={styles.tabIconContainer}>
                {isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
                {tab.badge && (
                  <View style={[
                    styles.badge,
                    { backgroundColor: themeColors.error }
                  ]}>
                    <TextComponent variant="caption" color="white" style={{ fontSize: 10, fontWeight: '700' }}>
                      {typeof tab.badge === 'number' && tab.badge > 9 ? '9+' : tab.badge}
                    </TextComponent>
                  </View>
                )}
              </View>
              <TextComponent
                variant="caption"
                color={isActive ? 'navy' : 'textTertiary'}
                style={{
                  fontWeight: isActive ? '600' : '500',
                  marginTop: themeSpacing.xs,
                }}
              >
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

export const Divider = React.forwardRef<View, View['props'] & ThemedProps & {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}>(
  ({ theme: customTheme = theme, orientation = 'horizontal', label, style, ...props }, ref) => {
    const themeColors = customTheme.colors;
    const themeSpacing = customTheme.spacing;

    if (orientation === 'vertical') {
      return (
        <View
          ref={ref}
          style={[
            styles.dividerVertical,
            { backgroundColor: themeColors.border },
            style,
          ]}
          {...props}
        />
      );
    }

    return (
      <View style={styles.dividerContainer} {...props}>
        <View
          ref={ref}
          style={[
            styles.dividerHorizontal,
            { backgroundColor: themeColors.border },
          ]}
        />
        {label && (
          <TextComponent variant="caption" color="textTertiary" style={styles.dividerLabel}>
            {label}
          </TextComponent>
        )}
        <View
          style={[
            styles.dividerHorizontal,
            { backgroundColor: themeColors.border },
          ]}
        />
      </View>
    );
  },
);
Divider.displayName = 'Divider';

export const Row = React.forwardRef<View, View['props'] & ThemedProps & {
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: keyof typeof theme.spacing | number;
}>(
  ({ theme: customTheme = theme, children, style, align = 'center', justify = 'start', gap = 0, ...props }, ref) => {
    const gapValue = typeof gap === 'string' ? customTheme.spacing[gap as keyof typeof customTheme.spacing] : gap;
    return (
      <View
        ref={ref}
        style={[
          styles.row,
          { alignItems: align, justifyContent: justify, gap: gapValue },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  },
);
Row.displayName = 'Row';

export const Column = React.forwardRef<View, View['props'] & ThemedProps & {
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  gap?: keyof typeof theme.spacing | number;
}>(
  ({ theme: customTheme = theme, children, style, align = 'stretch', justify = 'start', gap = 0, ...props }, ref) => {
    const gapValue = typeof gap === 'string' ? customTheme.spacing[gap as keyof typeof customTheme.spacing] : gap;
    return (
      <View
        ref={ref}
        style={[
          styles.column,
          { alignItems: align, justifyContent: justify, gap: gapValue },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  },
);
Column.displayName = 'Column';

export const Center = React.forwardRef<View, View['props'] & ThemedProps>(
  ({ theme: customTheme = theme, children, style, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={[
          styles.center,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  },
);
Center.displayName = 'Center';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.md,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: themeSpacing.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerAction: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: themeSpacing.md,
    paddingVertical: themeSpacing.sm,
    height: 80,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: themeSpacing.md,
  },
  dividerHorizontal: {
    flex: 1,
    height: 1,
  },
  dividerVertical: {
    width: 1,
  },
  dividerLabel: {
    whiteSpace: 'nowrap',
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});