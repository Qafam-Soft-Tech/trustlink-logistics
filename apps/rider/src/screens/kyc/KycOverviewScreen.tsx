import React from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Card, Column, Row, Badge, Banner, Skeleton, ErrorState, ListItem } from '@trustlink/shared';
import { useKycStatus } from '../../hooks';
import type { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'KycOverview'>;

export function KycOverviewScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const kyc = useKycStatus();

  if (kyc.isLoading) {
    return (
      <Screen>
        <TopBar title="KYC verification" showBack onBack={() => navigation.goBack()} />
        <Column gap="md" style={{ padding: 16 }}><Skeleton height={120} /><Skeleton height={160} /></Column>
      </Screen>
    );
  }

  if (kyc.isError || !kyc.data) {
    return (
      <Screen>
        <TopBar title="KYC verification" showBack onBack={() => navigation.goBack()} />
        <Column style={{ padding: 16 }}>
          <ErrorState message="Couldn't load your verification status." onAction={() => kyc.refetch()} />
        </Column>
      </Screen>
    );
  }

  const { status, rejectionReason, submittedAt } = kyc.data;
  const underReview = status === 'pending' && Boolean(submittedAt);
  const notStarted = status === 'pending' && !submittedAt;

  return (
    <Screen>
      <TopBar title="KYC verification" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Column gap="sm" align="center">
            <Badge variant={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning'}>
              {status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : underReview ? 'Under review' : 'Not started'}
            </Badge>
            <Text variant="h3" color="inherit" style={{ textAlign: 'center', color: theme.roles.text }}>
              {status === 'approved' ? "You're verified" : status === 'rejected' ? 'Verification rejected' : underReview ? 'Documents under review' : 'Verify your identity'}
            </Text>
            <Text variant="bodySmall" color="inherit" style={{ textAlign: 'center', color: theme.roles.textSecondary }}>
              {status === 'approved'
                ? 'You can go online and accept deliveries.'
                : status === 'rejected'
                  ? 'Fix the issue below and resubmit your documents.'
                  : underReview
                    ? "We're reviewing your documents. You'll be able to go online once approved."
                    : 'Verification is required before you can go online.'}
            </Text>
          </Column>
        </Card>

        {status === 'approved' ? (
          <Banner variant="success" title="Approved" message="Your KYC is approved. Go to Home and switch yourself online." />
        ) : null}

        {status === 'rejected' ? (
          <>
            <Banner variant="error" title="Reason" message={rejectionReason ?? 'Please contact support for details.'} />
            <Button variant="primary" size="lg" onPress={() => navigation.navigate('KycForm')}>Resubmit documents</Button>
          </>
        ) : null}

        {underReview ? (
          <Banner variant="info" title="Under review" message={`Submitted ${submittedAt ? new Date(submittedAt).toDateString() : ''}. Reviews usually take 24–48 hours.`} />
        ) : null}

        {notStarted ? (
          <>
            <Card>
              <Column gap="sm">
                <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>What you'll need</Text>
                <ListItem title="NIN" subtitle="Your 11-digit National Identification Number" />
                <ListItem title="Government ID" subtitle="Front and back photos" />
                <ListItem title="Selfie" subtitle="Holding your ID, well lit" />
                <ListItem title="Vehicle registration" subtitle="Plus your vehicle type and plate number" />
              </Column>
            </Card>
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
              Documents are used only for verification. Photos stay on your device until you submit.
            </Text>
            <Button variant="primary" size="lg" onPress={() => navigation.navigate('KycForm')}>Start verification</Button>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
