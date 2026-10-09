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
  Input,
  Chip,
  Badge,
  Banner,
  ListItem,
  TextArea,
  Skeleton,
  EmptyState,
  ErrorState,
  ISSUE_TYPES,
  issueTypeLabel,
  type IssueType,
  errorMessage,
} from '@trustlink/shared';
import { useDeliveries, useCreateIssue } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportIssue'>;

export function ReportIssueScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const deliveries = useDeliveries();
  const create = useCreateIssue();

  const [deliveryId, setDeliveryId] = useState<string | undefined>();
  const [type, setType] = useState<IssueType>('delivery_issue');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const next: Record<string, string> = {};
    if (!deliveryId) next.deliveryId = 'Choose the delivery this is about';
    if (title.trim().length < 3) next.title = 'Add a short summary (min 3 characters)';
    if (description.trim().length < 10) next.description = 'Describe what happened (min 10 characters)';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    create.mutate(
      { deliveryId: deliveryId as string, type, priority: 'medium', title: title.trim(), description: description.trim() },
      {
        onSuccess: (issue) => navigation.replace('IssueSubmitted', { issueId: issue.id }),
        onError: (e: unknown) => setErrors({ submit: errorMessage(e, 'issues') }),
      },
    );
  };

  return (
    <Screen>
      <TopBar title="Report an issue" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Card>
          <Column gap="md">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Which delivery?</Text>
            {deliveries.isLoading ? (
              <Column gap="sm"><Skeleton height={56} /><Skeleton height={56} /></Column>
            ) : deliveries.isError ? (
              <ErrorState message="Couldn't load your deliveries." onAction={() => deliveries.refetch()} />
            ) : (deliveries.data ?? []).length === 0 ? (
              <EmptyState icon="📦" title="No deliveries yet" message="Report an issue once you have a delivery." />
            ) : (
              <Column gap="sm">
                {(deliveries.data ?? []).slice(0, 12).map((d) => (
                  <ListItem
                    key={d.id}
                    title={d.trackingNumber}
                    subtitle={`${d.pickupArea ?? 'Pickup'} → ${d.dropoffArea ?? 'Drop-off'}`}
                    right={deliveryId === d.id ? <Badge variant="primary">Selected</Badge> : undefined}
                    onPress={() => setDeliveryId(d.id)}
                  />
                ))}
              </Column>
            )}
            {errors.deliveryId ? <Text variant="caption" color="inherit" style={{ color: theme.colors.error }}>{errors.deliveryId}</Text> : null}
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>What went wrong?</Text>
            <Row gap="sm" style={{ flexWrap: 'wrap' }} justify="start">
              {ISSUE_TYPES.map((t) => (
                <Chip key={t} label={issueTypeLabel(t)} selected={type === t} onPress={() => setType(t)} />
              ))}
            </Row>
          </Column>
        </Card>

        <Card>
          <Column gap="lg">
            <Input label="Summary" value={title} onChangeText={setTitle} placeholder="e.g. Package left at the gate" error={errors.title} />
            <TextArea
              label="Describe it"
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us what happened so support can help."
              error={errors.description}
            />
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
              Photos aren't supported yet — support may ask you for evidence in the conversation.
            </Text>
          </Column>
        </Card>

        {errors.submit ? <Banner variant="error" message={errors.submit} /> : null}
      </ScrollView>

      <Column style={{ padding: 16 }}>
        <Button variant="primary" size="lg" loading={create.isPending} onPress={submit}>Submit report</Button>
      </Column>
    </Screen>
  );
}
