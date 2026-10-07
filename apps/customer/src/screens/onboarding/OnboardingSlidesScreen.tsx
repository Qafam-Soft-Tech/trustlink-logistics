import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@trustlink/shared';
import { Screen, Text, Button, Row, Column, Center } from '@trustlink/shared';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { OnboardingStackParamList, RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Slides'>;

const SLIDES = [
  { title: 'Send parcels across Abuja', body: 'Documents and parcels, picked up and delivered the same day.' },
  { title: 'Track in real time', body: 'Follow every status from request to proof of delivery.' },
  { title: 'Secure. Swift. Strategic.', body: 'Verified riders and transparent, upfront pricing in naira.' },
];

export function OnboardingSlidesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  const finish = () => navigation.navigate('Welcome');

  return (
    <Screen>
      <Column style={styles.container} gap="xl" justify="space-between">
        <Row justify="end" style={styles.top}>
          <Button variant="ghost" size="sm" onPress={() => { rootNav.navigate('Main'); void finish(); }}>
            <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.primaryAction }}>Skip</Text>
          </Button>
        </Row>

        <Center style={styles.body}>
          <Column gap="md" align="center">
            <View style={[styles.badge, { backgroundColor: theme.roles.primaryAction }]}>
              <Text variant="h3" color="inherit" style={{ color: theme.roles.primaryActionText }}>TL</Text>
            </View>
            <Text variant="h2" color="inherit" style={{ color: theme.roles.text, textAlign: 'center' }}>{slide.title}</Text>
            <Text variant="body" color="inherit" style={{ color: theme.roles.textSecondary, textAlign: 'center' }}>{slide.body}</Text>
          </Column>
        </Center>

        <Column gap="lg" style={styles.bottom}>
          <Row gap="sm" justify="center">
            {SLIDES.map((s, i) => (
              <View key={s.title} style={[styles.dot, { backgroundColor: i === index ? theme.roles.primaryAction : theme.roles.borderStrong }]} />
            ))}
          </Row>
          <Button variant="primary" size="lg" onPress={() => (last ? finish() : setIndex(index + 1))}>
            {last ? 'Get started' : 'Next'}
          </Button>
        </Column>
      </Column>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  top: { minHeight: 44 },
  body: { flex: 1 },
  bottom: { paddingBottom: 8 },
  badge: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
