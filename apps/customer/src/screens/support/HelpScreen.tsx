import React, { useState } from 'react';
import { Linking, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Card, Column, Row, Badge, Banner, ListItem } from '@trustlink/shared';
import { CONTACT_CHANNELS, FAQ_ITEMS, SUPPORT_HOURS } from './helpContent';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Help'>;

export function HelpScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Screen>
      <TopBar title="Help & support" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Banner
          variant="info"
          title="In-app alerts only"
          message="Push notifications are off in R1. Status updates appear in Alerts, and important ones are also sent to your phone by SMS."
        />

        <Card>
          <Column gap="sm">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Frequently asked</Text>
            {FAQ_ITEMS.map((item, index) => (
              <Column key={item.question} gap="xs">
                <ListItem
                  title={item.question}
                  right={<Text variant="body" color="inherit" style={{ color: theme.roles.primaryAction }}>{open === index ? '−' : '+'}</Text>}
                  onPress={() => setOpen(open === index ? null : index)}
                />
                {open === index ? (
                  <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textSecondary }}>{item.answer}</Text>
                ) : null}
              </Column>
            ))}
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Contact support</Text>
            {CONTACT_CHANNELS.map((channel) => (
              <ListItem
                key={channel.id}
                title={channel.label}
                subtitle={channel.value}
                right={<Badge variant="warning">Placeholder</Badge>}
                onPress={() => Linking.openURL(channel.url).catch(() => undefined)}
              />
            ))}
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{SUPPORT_HOURS}</Text>
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
              Placeholder contact details — the real support lines are added before launch.
            </Text>
          </Column>
        </Card>

        <Row gap="sm">
          <Button variant="primary" size="md" style={{ flex: 1 }} onPress={() => navigation.navigate('ReportIssue')}>Report an issue</Button>
          <Button variant="outline" size="md" style={{ flex: 1 }} onPress={() => navigation.navigate('MyIssues')}>My issues</Button>
        </Row>
      </ScrollView>
    </Screen>
  );
}
