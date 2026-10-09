/**
 * Motion tokens + the hooks that keep motion meaningful and accessible (Phase 16).
 * No animation libraries beyond Reanimated (already installed in the apps).
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export const motion = {
  /** Durations in ms. Keep them short: motion should explain, never delay. */
  duration: {
    instant: 90,
    fast: 140,
    normal: 220,
    slow: 320,
    shimmer: 1300,
  },
  easing: {
    standard: Easing.bezier(0.2, 0, 0, 1),
    decelerate: Easing.out(Easing.cubic),
  },
  /** Scale deltas (subtle). */
  scale: {
    press: 0.97,
    pop: 1.06,
  },
  /** Travel distances for sheets/dialogs. */
  offset: {
    sheet: 420,
    dialog: 12,
  },
  /** Under this threshold the skeleton stays static. */
  minShimmerDuration: 900,
} as const;

/**
 * Respects the OS “Reduce Motion” setting.
 * Every animation in the design system checks this before running.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduced(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => setReduced(value));
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

/** Press feedback (a 3% scale dip) for every touchable surface. */
export function usePressScale(scale: number = motion.scale.press) {
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - scale) }],
  }));

  return {
    animatedStyle: style,
    onPressIn: () => {
      if (!reduced) pressed.value = withTiming(1, { duration: motion.duration.instant });
    },
    onPressOut: () => {
      pressed.value = withTiming(0, { duration: motion.duration.fast, easing: motion.easing.decelerate });
    },
  };
}

/** Fade + travel used by sheets, dialogs and banners. */
export function useEnterTransition(travel: number = motion.offset.dialog) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    progress.value = reduced ? 1 : withTiming(1, { duration: motion.duration.normal, easing: motion.easing.decelerate });
  }, [progress, reduced]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * travel }],
  }));

  return { animatedStyle: style, progress };
}

/** A short scale “pop” for success moments (checkmarks, confirmations). */
export function useSuccessPop() {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    progress.value = reduced
      ? 1
      : withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate });
  }, [progress, reduced]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }));

  return style;
}
