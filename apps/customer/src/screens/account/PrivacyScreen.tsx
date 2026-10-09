import React from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Card, Column, Banner } from '@trustlink/shared';
import { DRAFT_NOTICE, LEGAL_UPDATED, PRIVACY_SECTIONS } from './legalContent';
import type { RootStackParamList } from '../../navigation/types';

export function PrivacyScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Screen>
      <TopBar title="Privacy Policy" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Banner variant="warning" title="Draft for legal review" message={DRAFT_NOTICE} />
        <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
          {LEGAL_UPDATED} · Your rights under the Nigeria Data Protection Act 2023 are summarised in section 6.
        </Text>
        {PRIVACY_SECTIONS.map((section) => (
          <Card key={section.heading}>
            <Column gap="sm">
              <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{section.heading}</Text>
              {section.paragraphs.map((paragraph, index) => (
                <Text key={index} variant="bodySmall" color="inherit" style={{ color: theme.roles.textSecondary }}>
                  {paragraph}
                </Text>
              ))}
            </Column>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
