import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useTheme,
  Screen,
  TopBar,
  Text,
  Button,
  Card,
  Column,
  Row,
  Chip,
  Badge,
  EmptyState,
  ErrorState,
  Skeleton,
  formatDate,
  ISSUE_STATUSES,
  issueStatusLabel,
  issueStatusVariant,
  issueTypeLabel,
  type IssueStatus,
} from '@trustlink/shared';
import { useMyIssues } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MyIssues'>;

export function MyIssuesScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState<IssueStatus | undefined>();
  const { data, isLoading, isError, refetch } = useMyIssues(filter);

  return (
    <Screen>
      <TopBar title="My issues" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Row gap="sm" style={{ flexWrap: 'wrap' }} justify="start">
          <Chip label="All" selected={!filter} onPress={() => setFilter(undefined)} />
          {ISSUE_STATUSES.map((status) => (
            <Chip key={status} label={issueStatusLabel(status)} selected={filter === status} onPress={() => setFilter(status)} />
          ))}
        </Row>

        {isLoading ? (
          <Column gap="sm"><Skeleton height={72} /><Skeleton height={72} /></Column>
        ) : isError ? (
          <ErrorState message="Couldn't load your issues." onAction={() => refetch()} />
        ) : (data ?? []).length === 0 ? (
          <EmptyState
            icon="🛠"
            title={filter ? `No ${issueStatusLabel(filter).toLowerCase()} issues` : 'No issues yet'}
            message="Anything you report will show up here with its progress."
            actionLabel="Report an issue"
            onAction={() => navigation.navigate('ReportIssue')}
          />
        ) : (
          <Column gap="sm">
            {(data ?? []).map((issue) => (
              <Card key={issue.id} onPress={() => navigation.navigate('IssueDetail', { issueId: issue.id })}>
                <Column gap="xs">
                  <Row justify="space-between" align="center">
                    <Text variant="body" color="inherit" style={{ flex: 1, color: theme.roles.text }}>{issue.title}</Text>
                    <Badge variant={issueStatusVariant(issue.status)}>{issueStatusLabel(issue.status)}</Badge>
                  </Row>
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                    {issueTypeLabel(issue.type)} · {formatDate(issue.createdAt)}
                  </Text>
                </Column>
              </Card>
            ))}
          </Column>
        )}

        <Button variant="primary" size="lg" onPress={() => navigation.navigate('ReportIssue')}>Report an issue</Button>
      </ScrollView>
    </Screen>
  );
}
