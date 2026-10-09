import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Card, Column, Row, Chip, Banner, Input, TextArea, SuccessState, ISSUE_TYPES, issueTypeLabel, type IssueType } from '@trustlink/shared';
import { useCreateRiderIssue } from '../../hooks';
import type { JobsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<JobsStackParamList, 'ReportIssue'>;

export function RiderReportIssueScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { deliveryId } = route.params;
  const create = useCreateRiderIssue();
  const [type, setType] = useState<IssueType>('delivery_issue');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Screen>
        <SuccessState
          title="Report submitted"
          message="Dispatch will review your report and get back to you."
          actionLabel="Back to job"
          onAction={() => navigation.goBack()}
        />
      </Screen>
    );
  }

  const submit = () => {
    setError(undefined);
    if (title.trim().length < 3) {
      setError('Add a short summary (min 3 characters)');
      return;
    }
    if (description.trim().length < 10) {
      setError('Describe what happened (min 10 characters)');
      return;
    }
    create.mutate(
      { deliveryId, type, priority: 'medium', title: title.trim(), description: description.trim() },
      {
        onSuccess: () => setDone(true),
        onError: (e: unknown) => setError((e as Error).message || 'Could not submit the report.'),
      },
    );
  };

  return (
    <Screen>
      <TopBar title="Report an issue" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Card>
          <Column gap="md">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>What went wrong?</Text>
            <Row gap="sm" style={{ flexWrap: 'wrap' }} justify="start">
              {ISSUE_TYPES.map((item) => (
                <Chip key={item} label={issueTypeLabel(item)} selected={type === item} onPress={() => setType(item)} />
              ))}
            </Row>
          </Column>
        </Card>

        <Card>
          <Column gap="lg">
            <Input label="Summary" value={title} onChangeText={setTitle} placeholder="e.g. Recipient not at the address" />
            <TextArea label="Describe it" value={description} onChangeText={setDescription} placeholder="Tell dispatch what happened." />
          </Column>
        </Card>

        {error ? <Banner variant="error" message={error} /> : null}
      </ScrollView>

      <Column style={{ padding: 16 }}>
        <Button variant="primary" size="lg" loading={create.isPending} onPress={submit}>Submit report</Button>
      </Column>
    </Screen>
  );
}
