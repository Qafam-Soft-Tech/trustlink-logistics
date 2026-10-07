import React, { useState } from 'react';
import { Keyboard, Alert, Platform } from 'react-native';
import { Screen, Text as TextComponent, Box, Button, Input, Card, Column, Row, Center, Avatar, Badge, Divider } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../utils/api';

interface KycScreenProps {
  navigation: any;
}

export function KycScreen({ navigation }: KycScreenProps) {
  const [kycData, setKycData] = useState({
    nin: '',
    idType: 'nin',
    idFront: null as any,
    idBack: null as any,
    selfie: null as any,
    vehicleRegistration: null as any,
  });
  const [kycStatus, setKycStatus] = useState<'pending' | 'approved' | 'rejected' | 'not_started'>('not_started');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusConfig = {
    not_started: { color: theme.colors.textTertiary, label: 'Not Started', variant: 'default' as const },
    pending: { color: theme.colors.warning, label: 'Under Review', variant: 'warning' as const },
    approved: { color: theme.colors.success, label: 'Approved', variant: 'success' as const },
    rejected: { color: theme.colors.error, label: 'Rejected', variant: 'error' as const },
  };
  const config = statusConfig[kycStatus];

  const pickImage = async (field: string) => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Image picker not available on web. This would open camera/gallery on mobile.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) {
        setKycData(prev => ({ ...prev, [field]: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async (field: string) => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Camera not available on web. This would open camera on mobile.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) {
        setKycData(prev => ({ ...prev, [field]: result.assets[0].uri }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSubmit = async () => {
    if (!kycData.nin || !kycData.idFront || !kycData.idBack || !kycData.selfie || !kycData.vehicleRegistration) {
      Alert.alert('Incomplete', 'Please fill in all fields and upload all required documents');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('nin', kycData.nin);
      formData.append('idType', kycData.idType);
      
      // Append images
      const appendFile = (field: string, uri: string) => {
        formData.append(field, {
          uri,
          name: `${field}.jpg`,
          type: 'image/jpeg',
        } as any);
      };
      
      appendFile('idFront', kycData.idFront);
      appendFile('idBack', kycData.idBack);
      appendFile('selfie', kycData.selfie);
      appendFile('vehicleRegistration', kycData.vehicleRegistration);

      const response = await api.post('/rider/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('KYC submitted:', response.data);
      setKycStatus('pending');
      Alert.alert('Submitted', 'Your KYC documents have been submitted for review. This typically takes 24-48 hours.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDocumentUpload = (title: string, field: keyof typeof kycData, required: boolean = true) => {
    const image = kycData[field];
    return (
      <Card style={{ padding: 0 }}>
        <Column gap="md">
          <Row justify="space-between" align="center" style={{ padding: theme.spacing.md, paddingBottom: 0 }}>
            <TextComponent variant="body" color="textPrimary" style={{ fontWeight: '600' }}>
              {title} {required && <TextComponent variant="body" color="error">*</TextComponent>}
            </TextComponent>
            {image && (
              <Badge variant="success" size="xs">Uploaded</Badge>
            )}
          </Row>
          <Box
            style={{
              height: 150,
              borderRadius: theme.borderRadius.md,
              backgroundColor: image ? 'transparent' : theme.colors.gray100,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: image ? theme.colors.success : theme.colors.border,
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
            }}
          >
            {image ? (
              <Image
                source={{ uri: image }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <Column gap="sm" align="center">
                <Ionicons name="camera" size={32} color={theme.colors.textTertiary} />
                <TextComponent variant="bodySmall" color="textSecondary">Tap to upload</TextComponent>
              </Column>
            )}
          </Box>
          <Row gap="md" style={{ paddingTop: theme.spacing.sm }}>
            <Button variant="outline" size="sm" onPress={() => pickImage(field)} style={{ flex: 1 }}>
              Gallery
            </Button>
            <Button variant="primary" size="sm" onPress={() => takePhoto(field)} style={{ flex: 1 }}>
              Camera
            </Button>
          </Row>
        </Column>
      </Card>
    );
  };

  return (
    <Screen style={{ flex: 1 }}>
      <Column style={{ flex: 1, padding: theme.spacing.md }} gap="lg">
        <Row justify="space-between" align="center">
          <TextComponent variant="h2" color="textPrimary">KYC Verification</TextComponent>
          <Badge variant={config.variant} size="md">
            <Row gap="xs" align="center">
              <TextComponent variant="bodySmall" color="white">{config.label}</TextComponent>
            </Row>
          </Badge>
        </Row>

        <Card>
          <Column gap="md">
            <TextComponent variant="h4" color="textPrimary">Verification Status</TextComponent>
            <Row gap="md" align="center">
              <KycStatusStep label="Documents" completed={['pending', 'approved', 'rejected'].includes(kycStatus)} current={kycStatus === 'pending'} />
              <KycStatusStep label="Review" completed={['approved', 'rejected'].includes(kycStatus)} current={kycStatus === 'pending'} />
              <KycStatusStep label="Complete" completed={kycStatus === 'approved'} current={kycStatus === 'approved'} />
            </Row>
            {kycStatus === 'rejected' && (
              <Box style={{ padding: theme.spacing.md, backgroundColor: theme.colors.error + '15', borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.error }}>
                <Row gap="sm" align="center">
                  <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                  <TextComponent variant="bodySmall" color="error">Rejected: {rejectionReason || 'Please contact support for details'}</TextComponent>
                </Row>
              </Box>
            )}
          </Column>
        </Card>

        {kycStatus === 'not_started' || kycStatus === 'rejected' ? (
          <Column gap="lg">
            <Card>
              <Column gap="lg">
                <TextComponent variant="h4" color="textPrimary">Personal Information</TextComponent>
                <Input
                  label="NIN (National Identification Number)"
                  placeholder="12345678901"
                  value={kycData.nin}
                  onChangeText={v => setKycData(prev => ({ ...prev, nin: v }))}
                  keyboardType="number-pad"
                  maxLength={11}
                  leftIcon={<Ionicons name="card" size={24} color={theme.colors.textTertiary} />}
                />
                <Input
                  label="ID Type"
                  value={kycData.idType}
                  onChangeText={v => setKycData(prev => ({ ...prev, idType: v }))}
                  editable={false}
                  rightIcon={<Ionicons name="chevron-down" size={24} color={theme.colors.textTertiary} />}
                />
              </Column>
            </Card>

            <Card>
              <Column gap="lg">
                <TextComponent variant="h4" color="textPrimary">Required Documents</TextComponent>
                <TextComponent variant="bodySmall" color="textSecondary">
                  All documents must be clear, valid, and match your NIN information.
                </TextComponent>
                
                {renderDocumentUpload('Government ID (Front)', 'idFront')}
                {renderDocumentUpload('Government ID (Back)', 'idBack')}
                {renderDocumentUpload('Selfie with ID', 'selfie')}
                {renderDocumentUpload('Vehicle Registration', 'vehicleRegistration')}
              </Column>
            </Card>

            <Button
              variant="primary"
              size="lg"
              loading={isSubmitting}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              Submit for Verification
            </Button>
          </Column>
        ) : (
          <Card>
            <Column gap="md" align="center">
              <Ionicons name={kycStatus === 'approved' ? 'checkmark-circle' : 'time'} size={64} color={config.color} />
              <TextComponent variant="h4" color="textPrimary" style={{ textAlign: 'center' }}>
                {kycStatus === 'approved' ? 'KYC Approved!' : 'Under Review'}
              </TextComponent>
              <TextComponent variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
                {kycStatus === 'approved' 
                  ? 'Your account is fully verified. You can now accept deliveries.'
                  : 'Our team is reviewing your documents. You\'ll be notified once complete.'}
              </TextComponent>
              {kycStatus === 'approved' && (
                <Button variant="secondary" size="md" onPress={() => {}} style={{ marginTop: theme.spacing.md }}>
                  View Certificate
                </Button>
              )}
            </Column>
          </Card>
        )}
      </Column>
    </Screen>
  );
}

function KycStatusStep({ label, completed, current }: any) {
  return (
    <Column gap="xs" align="center" style={{ flex: 1 }}>
      <Box
        style={{
          width: 36,
          height: 36,
          borderRadius: theme.borderRadius.full,
          backgroundColor: completed ? theme.colors.success : current ? theme.colors.navy : theme.colors.gray200,
          borderWidth: current && !completed ? 3 : 0,
          borderColor: theme.colors.navy,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {completed && <Ionicons name="checkmark" size={18} color="white" />}
        {!completed && !current && <TextComponent variant="caption" color="textTertiary" style={{ fontWeight: '700' }}>⋯</TextComponent>}
      </Box>
      <TextComponent variant="caption" color={completed || current ? 'textPrimary' : 'textTertiary'} style={{ fontWeight: completed || current ? '600' : '500' }}>
        {label}
      </TextComponent>
    </Column>
  );
}

function Image({ source, style, resizeMode }: any) {
  return <Box style={style} />;
}