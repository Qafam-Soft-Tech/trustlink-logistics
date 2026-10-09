import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, Center, Column, Text, Button, Card, SuccessState } from '@trustlink/shared';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'IssueSubmitted'>;

export function IssueSubmittedScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const shortId = route.params.issueId.replace(/^issue-/, '#');

  return (
    <Screen>
      <Center style={{ flex: 1, padding: 24 }}>
        <Column gap="lg" align="center" style={{ width: '100%' }}>
          <SuccessState
            title="Report submitted"
            message="Support will review your issue and reply in the app. You can follow progress under My issues."
            actionLabel="View my issues"
            onAction={() => navigation.replace('MyIssues')}
          />
          <Card style={{ width: '100%' }}>
            <Column gap="xs" align="center">
              <Text variant="label" color="inherit" style={{ color: theme.roles.textMuted }}>Reference</Text>
              <Text variant="h4" color="inherit" selectable style={{ color: theme.roles.primaryAction }}>{shortId}</Text>
            </Column>
          </Card>
        </Column>
      </Center>

      <Column style={{ padding: 16, gap: 8 }}>
        <Button variant="ghost" size="md" onPress={() => navigation.navigate('Main')}>Done</Button>
      </Column>
    </Screen>
  );
}
