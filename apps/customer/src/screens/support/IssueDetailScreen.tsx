import React from 'react';
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
  Badge,
  Banner,
  Skeleton,
  ErrorState,
  formatDate,
  isIssueClosed,
  issueStatusLabel,
  issueStatusVariant,
  issueTypeLabel,
} from '@trustlink/shared';
import { useIssue } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'IssueDetail'>;

export function IssueDetailScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { data, isLoading, isError, refetch } = useIssue(route.params.issueId);

  if (isLoading) {
    return (
      <Screen>
        <TopBar title="Issue" showBack onBack={() => navigation.goBack()} />
        <Column gap="md" style={{ padding: 16 }}>
          <Skeleton height={64} />
          <Skeleton height={120} />
        </Column>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen>
        <TopBar title="Issue" showBack onBack={() => navigation.goBack()} />
        <Column style={{ padding: 16 }}>
          <ErrorState message="Couldn't load this issue." onAction={() => refetch()} />
        </Column>
      </Screen>
    );
  }

  const closed = isIssueClosed(data.status);

  return (
    <Screen>
      <TopBar title="Issue" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Column gap="sm">
          <Row gap="sm" align="center">
            <Badge variant={issueStatusVariant(data.status)}>{issueStatusLabel(data.status)}</Badge>
            <Badge variant="primary">{issueTypeLabel(data.type)}</Badge>
          </Row>
          <Text variant="h3" color="inherit" style={{ color: theme.roles.text }}>{data.title}</Text>
          <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
            Priority {data.priority} · Reported {formatDate(data.createdAt)}
          </Text>
        </Column>

        <Card>
          <Column gap="sm">
            <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Description</Text>
            <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{data.description}</Text>
          </Column>
        </Card>

        {data.resolution ? (
          <Card>
            <Column gap="sm">
              <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Resolution</Text>
              <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{data.resolution}</Text>
              {data.resolvedAt ? (
                <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Resolved {formatDate(data.resolvedAt)}</Text>
              ) : null}
            </Column>
          </Card>
        ) : (
          <Banner
            variant="info"
            title={closed ? 'Issue closed' : 'Support is on it'}
            message={closed ? 'This issue has been closed. Report a new one if you need more help.' : "We'll notify you here when the status changes."}
          />
        )}

        <Button variant="outline" size="md" onPress={() => navigation.navigate('Tracking', { screen: 'Details', params: { deliveryId: data.deliveryId } })}>
          View the delivery
        </Button>
      </ScrollView>

      <Column style={{ padding: 16 }}>
        <Button variant="primary" size="lg" onPress={() => navigation.navigate('Help')}>Contact support</Button>
      </Column>
    </Screen>
  );
}
