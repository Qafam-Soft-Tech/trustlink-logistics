import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Card, Column, Row, Chip, Banner, Dialog, Skeleton, ErrorState, TextArea } from '@trustlink/shared';
import { useDeliveryJob, useReportFailure } from '../../hooks';
import { ExecutionExitGuard } from './ExecutionExitGuard';
import type { JobsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<JobsStackParamList, 'Failure'>;

const REASONS: Array<{ value: string; label: string }> = [
  { value: 'recipient_unavailable', label: 'Recipient unavailable' },
  { value: 'wrong_address', label: 'Wrong address' },
  { value: 'refused', label: 'Refused' },
];

export function FailureScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { jobId } = route.params;
  const job = useDeliveryJob(jobId);
  const failure = useReportFailure();

  const [reason, setReason] = useState<string>('recipient_unavailable');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [outcome, setOutcome] = useState<'failed' | 'returned' | null>(null);
  const [error, setError] = useState<string | undefined>();

  if (job.isLoading) {
    return (
      <Screen>
        <TopBar title="Report a problem" showBack onBack={() => navigation.goBack()} />
        <Column gap="md" style={{ padding: 16 }}><Skeleton height={140} /></Column>
      </Screen>
    );
  }

  if (job.isError || !job.data) {
    return (
      <Screen>
        <TopBar title="Report a problem" showBack onBack={() => navigation.goBack()} />
        <Column style={{ padding: 16 }}>
          <ErrorState message="Couldn't load this job." onAction={() => job.refetch()} />
        </Column>
      </Screen>
    );
  }

  const delivery = job.data;

  if (outcome) {
    const returned = outcome === 'returned';
    return (
      <Screen>
        <Column style={{ flex: 1, padding: 24, gap: 16, justifyContent: 'center' }}>
          <Banner
            variant={returned ? 'info' : 'warning'}
            title={returned ? 'Returned to sender' : 'Delivery unsuccessful'}
            message={
              returned
                ? 'This was the second failed attempt, so the package is heading back to the sender.'
                : 'TrustLink will arrange one redelivery at no extra cost. You can pick the job up again from your queue when dispatch reassigns it.'
            }
          />
          <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
            Job {delivery.trackingNumber} · attempt {delivery.redeliveryAttempts ?? 1} recorded.
          </Text>
          <Button variant="primary" size="lg" onPress={() => navigation.popToTop()}>Back to jobs</Button>
        </Column>
      </Screen>
    );
  }

  const submit = () => {
    setError(undefined);
    failure.mutate(
      { deliveryId: jobId, reason },
      {
        onSuccess: (result) => setOutcome(result.status === 'returned' ? 'returned' : 'failed'),
        onError: (e: unknown) => setError((e as Error).message || 'Could not record the problem.'),
      },
    );
  };

  const attempts = delivery.redeliveryAttempts ?? 0;

  return (
    <Screen>
      <TopBar title="Report a problem" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Banner
          variant="warning"
          title="Tell us what happened"
          message={attempts >= 1
            ? 'This is attempt 2 of 2 — a second failure sends the package back to the sender.'
            : 'Redelivery is arranged by TrustLink. You do not need to call the customer.'}
        />

        <Card>
          <Column gap="md">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Reason</Text>
            <Row gap="sm" style={{ flexWrap: 'wrap' }} justify="start">
              {REASONS.map((item) => (
                <Chip key={item.value} label={item.label} selected={reason === item.value} onPress={() => setReason(item.value)} />
              ))}
            </Row>
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <TextArea
              label="Note (optional)"
              value={note}
              onChangeText={setNote}
              placeholder="Anything the dispatcher should know"
            />
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
              The note stays with you for reference; the dispatcher receives the selected reason.
            </Text>
          </Column>
        </Card>

        {error ? <Banner variant="error" message={error} /> : null}
      </ScrollView>

      <Column style={{ padding: 16 }}>
        <Button variant="destructive" size="lg" loading={failure.isPending} onPress={() => setConfirm(true)}>Submit failure report</Button>
      </Column>

      <Dialog
        visible={confirm}
        title="Report this delivery as failed?"
        message={attempts >= 1
          ? 'This is the second attempt, so the package will be returned to the sender.'
          : 'The customer will be told why and TrustLink will arrange one redelivery.'}
        confirmLabel="Submit report"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          submit();
        }}
      />

      <ExecutionExitGuard navigation={navigation} active={!outcome} />
    </Screen>
  );
}
