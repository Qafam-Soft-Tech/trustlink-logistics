import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, Text, Column, Center } from '@trustlink/shared';
import type { RootStackParamList } from '../../navigation/types';
import { useSession } from '../../session/SessionContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { ready, session, onboardingSeen } = useSession();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 600 });
    opacity.value = withTiming(1, { duration: 600 });
  }, [scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));

  useEffect(() => {
    if (!ready) return;
    const target: keyof RootStackParamList = !onboardingSeen ? 'Onboarding' : session ? 'Main' : 'Auth';
    navigation.replace(target);
  }, [ready, session, onboardingSeen, navigation]);

  return (
    <Screen>
      <Center style={styles.center}>
        <Animated.View style={animStyle}>
          <Column gap="md" align="center">
            <View style={[styles.logo, { backgroundColor: theme.roles.primaryAction }]}>
              <Text variant="h1" color="inherit" style={{ color: theme.roles.primaryActionText }}>TL</Text>
            </View>
            <Text variant="h2" color="inherit" style={{ color: theme.roles.text }}>TrustLink</Text>
            <Text variant="body" color="inherit" style={{ color: theme.roles.textMuted }}>Secure. Swift. Strategic.</Text>
          </Column>
        </Animated.View>
      </Center>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  logo: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
