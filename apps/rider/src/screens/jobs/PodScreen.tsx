import React, { useState } from 'react';
import { Image, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, Screen, TopBar, Text, Button, Card, Column, Row, Banner, Skeleton, ErrorState, SuccessState, OtpInput, TextArea, isValidOtp } from '@trustlink/shared';
import { errorMessage } from '@trustlink/shared';
import { useDeliveryJob, useCompleteDelivery, useUploadFile, useResendRecipientOtp } from '../../hooks';
import { useData } from '../../data/DataContext';
import { ExecutionExitGuard } from './ExecutionExitGuard';
import type { JobsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<JobsStackParamList, 'Pod'>;

export function PodScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { jobId } = route.params;
  const job = useDeliveryJob(jobId);
  const complete = useCompleteDelivery();
  const upload = useUploadFile();
  const resend = useResendRecipientOtp();
  const data = useData();

  const [photo, setPhoto] = useState<string | undefined>();
  const [code, setCode] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [resendMessage, setResendMessage] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  if (job.isLoading) {
    return (
      <Screen>
        <TopBar title="Proof of delivery" showBack onBack={() => navigation.goBack()} />
        <Column gap="md" style={{ padding: 16 }}><Skeleton height={180} /><Skeleton height={120} /></Column>
      </Screen>
    );
  }

  if (job.isError || !job.data) {
    return (
      <Screen>
        <TopBar title="Proof of delivery" showBack onBack={() => navigation.goBack()} />
        <Column style={{ padding: 16 }}>
          <ErrorState message="Couldn't load this job." onAction={() => job.refetch()} />
        </Column>
      </Screen>
    );
  }

  const delivery = job.data;

  if (done) {
    return (
      <Screen>
        <SuccessState
          title="Delivered"
          message={`${delivery.trackingNumber} was completed and the recipient confirmed the hand-over.`}
          actionLabel="Back to jobs"
          onAction={() => navigation.popToTop()}
        />
      </Screen>
    );
  }

  const pickPhoto = async (camera: boolean) => {
    setError(undefined);
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(camera ? 'Camera permission is needed for the delivery photo.' : 'Photo access is needed for the delivery photo.');
      return;
    }
    const result = camera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  };

  const submit = async () => {
    setError(undefined);
    if (!photo) {
      setError('Take a delivery photo before completing.');
      return;
    }
    if (!isValidOtp(code)) {
      setError('Enter the 6-digit code from the recipient.');
      return;
    }

    setUploading(true);
    try {
      const uploaded = await upload.mutateAsync({ uri: photo, name: 'proof-of-delivery.jpg' });
      await complete.mutateAsync({
        id: jobId,
        proof: {
          photoUrl: uploaded.url,
          recipientOtp: code,
          recipientName: delivery.recipientName,
          recipientPhone: delivery.recipientPhone,
          notes: notes.trim() || undefined,
        },
      });
      setDone(true);
    } catch (e) {
      setCode('');
      setError(errorMessage(e, 'jobs'));
    } finally {
      setUploading(false);
    }
  };

  const resendCode = () => {
    setResendMessage(undefined);
    resend.mutate(jobId, {
      onSuccess: () => setResendMessage('A new code was sent to the recipient.'),
      onError: (e: unknown) => setError(errorMessage(e, 'jobs')),
    });
  };

  return (
    <Screen>
      <TopBar title="Proof of delivery" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <Banner
          variant="info"
          title="Recipient code"
          message={data.source === 'mock'
            ? 'Ask the recipient for their 6-digit code. In this demo the code is shown in the Customer app: Demo menu → recipient codes.'
            : 'Ask the recipient for their 6-digit code. They receive it by SMS; use “Resend code” if they did not get it.'}
        />

        <Card>
          <Column gap="md">
            <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Delivery photo</Text>
            {photo ? (
              <Image source={{ uri: photo }} style={{ width: '100%', height: 180, borderRadius: theme.borderRadius.md }} resizeMode="cover" />
            ) : (
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>No photo attached yet.</Text>
            )}
            <Row gap="sm">
              <Button variant="outline" size="md" style={{ flex: 1 }} onPress={() => pickPhoto(false)}>Gallery</Button>
              <Button variant="primary" size="md" style={{ flex: 1 }} onPress={() => pickPhoto(true)}>Camera</Button>
            </Row>
          </Column>
        </Card>

        <Card>
          <Column gap="lg">
            <Column gap="sm">
              <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Recipient code</Text>
              <OtpInput value={code} onChange={setCode} />
              <Button variant="ghost" size="sm" loading={resend.isPending} onPress={resendCode}>Resend code</Button>
              {resendMessage ? <Text variant="caption" color="inherit" style={{ color: theme.roles.primaryAction }}>{resendMessage}</Text> : null}
            </Column>
            <TextArea label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="e.g. Left with the recipient at the front desk" />
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
              Receiving: {delivery.recipientName} · {delivery.recipientPhone}
            </Text>
          </Column>
        </Card>

        {error ? <Banner variant="error" title="Not completed" message={error} /> : null}
      </ScrollView>

      <Column style={{ padding: 16 }}>
        <Button variant="primary" size="lg" loading={complete.isPending || uploading} onPress={submit}>Complete delivery</Button>
      </Column>

      <ExecutionExitGuard navigation={navigation} active={!done} />
    </Screen>
  );
}
