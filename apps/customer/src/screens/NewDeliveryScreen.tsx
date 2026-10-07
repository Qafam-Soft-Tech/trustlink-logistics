import React, { useState } from 'react';
import { Keyboard, Alert } from 'react-native';
import { Screen, Text as TextComponent, Box, Button, Input, Card, Column, Center, Row, Divider } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';

export function NewDeliveryScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    pickupAddress: '',
    pickupLandmark: '',
    dropoffAddress: '',
    dropoffLandmark: '',
    packageType: 'document',
    packageWeight: '0.5',
    packageDescription: '',
    senderName: '',
    senderPhone: '',
    recipientName: '',
    recipientPhone: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.pickupAddress || !formData.dropoffAddress) {
        Alert.alert('Missing Information', 'Please enter both pickup and dropoff addresses');
        return;
      }
    } else if (step === 2) {
      if (!formData.senderName || !formData.senderPhone || !formData.recipientName || !formData.recipientPhone) {
        Alert.alert('Missing Information', 'Please fill in all contact details');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/deliveries', formData);
      console.log('Delivery created:', response.data);
      
      Alert.alert('Success', 'Delivery request created! Redirecting to payment...');
      navigation.navigate('Tracking');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create delivery. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgress = () => (
    <Row style={{ marginBottom: theme.spacing.lg }}>
      {[1, 2, 3].map(s => (
        <Row key={s} gap="sm" style={{ flex: 1, alignItems: 'center' }}>
          <Box
            style={{
              width: 28,
              height: 28,
              borderRadius: theme.borderRadius.full,
              backgroundColor: s <= step ? theme.colors.navy : theme.colors.gray200,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <TextComponent variant="caption" color={s <= step ? 'white' : 'textTertiary'} style={{ fontWeight: '700' }}>
              {s}
            </TextComponent>
          </Box>
          {s < 3 && (
            <Box
              style={{
                flex: 1,
                height: 2,
                backgroundColor: s < step ? theme.colors.navy : theme.colors.gray200,
              }}
            />
          )}
        </Row>
      ))}
    </Row>
  );

  const renderStep1 = () => (
    <Card>
      <Column gap="lg">
        <TextComponent variant="h4" color="textPrimary">Addresses</TextComponent>
        <Divider label="Pickup Location" />
        <Input
          label="Pickup Address"
          placeholder="e.g., 123 Ahmadu Bello Way, Wuse 2"
          value={formData.pickupAddress}
          onChangeText={v => updateField('pickupAddress', v)}
          leftIcon={<Ionicons name="location" size={24} color={theme.colors.textTertiary} />}
        />
        <Input
          label="Landmark (optional)"
          placeholder="e.g., Near Shoprite Mall"
          value={formData.pickupLandmark}
          onChangeText={v => updateField('pickupLandmark', v)}
          leftIcon={<Ionicons name="pin" size={24} color={theme.colors.textTertiary} />}
        />
        <Divider label="Dropoff Location" />
        <Input
          label="Dropoff Address"
          placeholder="e.g., 456 Shehu Shagari Way, Maitama"
          value={formData.dropoffAddress}
          onChangeText={v => updateField('dropoffAddress', v)}
          leftIcon={<Ionicons name="location" size={24} color={theme.colors.textTertiary} />}
        />
        <Input
          label="Landmark (optional)"
          placeholder="e.g., Opposite Transcorp Hilton"
          value={formData.dropoffLandmark}
          onChangeText={v => updateField('dropoffLandmark', v)}
          leftIcon={<Ionicons name="pin" size={24} color={theme.colors.textTertiary} />}
        />
      </Column>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <Column gap="lg">
        <TextComponent variant="h4" color="textPrimary">Package Details</TextComponent>
        <Input
          label="Package Type"
          value={formData.packageType}
          onChangeText={v => updateField('packageType', v)}
          editable={false}
          rightIcon={<Ionicons name="chevron-down" size={24} color={theme.colors.textTertiary} />}
        />
        <Input
          label="Weight (kg)"
          placeholder="0.5"
          value={formData.packageWeight}
          onChangeText={v => updateField('packageWeight', v)}
          keyboardType="decimal-pad"
          leftIcon={<Ionicons name="scale" size={24} color={theme.colors.textTertiary} />}
        />
        <Input
          label="Description"
          placeholder="Brief description of contents"
          value={formData.packageDescription}
          onChangeText={v => updateField('packageDescription', v)}
          multiline
          numberOfLines={3}
          leftIcon={<Ionicons name="document-text" size={24} color={theme.colors.textTertiary} />}
        />
      </Column>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <Column gap="lg">
        <TextComponent variant="h4" color="textPrimary">Contacts</TextComponent>
        <Divider label="Sender" />
        <Input
          label="Sender Name"
          placeholder="Your name"
          value={formData.senderName}
          onChangeText={v => updateField('senderName', v)}
          leftIcon={<Ionicons name="person" size={24} color={theme.colors.textTertiary} />}
        />
        <Input
          label="Sender Phone"
          placeholder="080 1234 5678"
          value={formData.senderPhone}
          onChangeText={v => updateField('senderPhone', v)}
          keyboardType="phone-pad"
          leftIcon={<Ionicons name="call" size={24} color={theme.colors.textTertiary} />}
        />
        <Divider label="Recipient" />
        <Input
          label="Recipient Name"
          placeholder="Recipient's name"
          value={formData.recipientName}
          onChangeText={v => updateField('recipientName', v)}
          leftIcon={<Ionicons name="person" size={24} color={theme.colors.textTertiary} />}
        />
        <Input
          label="Recipient Phone"
          placeholder="080 8765 4321"
          value={formData.recipientPhone}
          onChangeText={v => updateField('recipientPhone', v)}
          keyboardType="phone-pad"
          leftIcon={<Ionicons name="call" size={24} color={theme.colors.textTertiary} />}
        />
      </Column>
    </Card>
  );

  return (
    <Screen style={{ flex: 1, padding: theme.spacing.md }}>
      <Column style={{ flex: 1 }} gap="lg">
        <TextComponent variant="h2" color="textPrimary">New Delivery</TextComponent>
        {renderProgress()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <Row gap="md" style={{ marginTop: 'auto' }}>
          {step > 1 && (
            <Button variant="outline" size="lg" onPress={handleBack} style={{ flex: 1 }}>
              Back
            </Button>
          )}
          <Button
            variant="primary"
            size="lg"
            loading={isLoading}
            onPress={step === 3 ? handleSubmit : handleNext}
            style={{ flex: step === 1 ? 1 : 1 }}
          >
            {step === 3 ? 'Create Delivery' : 'Next'}
          </Button>
        </Row>
      </Column>
    </Screen>
  );
}