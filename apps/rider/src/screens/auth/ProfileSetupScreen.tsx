import React, { useState } from 'react';
import { Keyboard, Alert } from 'react-native';
import { Screen, Text as TextComponent, Box, Button, Input, Card, Column, Center, Row, Avatar, Divider } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';

interface ProfileSetupScreenProps {
  navigation: any;
  route: any;
}

export function ProfileSetupScreen({ navigation, route }: ProfileSetupScreenProps) {
  const { phone, role } = route.params;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const vehicleTypes = [
    { value: 'motorcycle', label: 'Motorcycle', icon: 'bicycle' },
    { value: 'van', label: 'Van', icon: 'car' },
    { value: 'truck', label: 'Truck', icon: 'bus' },
  ] as const;

  const handleComplete = async () => {
    if (!firstName.trim() || !lastName.trim() || !vehiclePlate.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/profile/setup', { phone, firstName, lastName, email, role: 'rider', vehicleType, vehiclePlate });
      console.log('Rider profile completed:', response.data);
      
      navigation.replace('Main');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={{ flex: 1, padding: theme.spacing.lg }}>
      <Column style={{ flex: 1, justifyContent: 'center' }} gap="xl">
        <Center>
          <Avatar size="xl" name={`${firstName} ${lastName}` || 'Rider'} />
        </Center>
        
        <Column gap="sm" style={{ alignItems: 'center' }}>
          <TextComponent variant="h2" color="textPrimary" style={{ textAlign: 'center' }}>
            Complete your rider profile
          </TextComponent>
          <TextComponent variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
            This information is required for KYC verification
          </TextComponent>
        </Column>

        <Card style={{ padding: theme.spacing.xl }}>
          <Column gap="lg">
            <Input
              label="First Name"
              placeholder="John"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              leftIcon={<Ionicons name="person" size={24} color={theme.colors.textTertiary} />}
            />

            <Input
              label="Last Name"
              placeholder="Doe"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              leftIcon={<Ionicons name="person" size={24} color={theme.colors.textTertiary} />}
            />

            <Input
              label="Email (optional)"
              placeholder="john@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail" size={24} color={theme.colors.textTertiary} />}
            />

            <Divider label="Vehicle Information" />
            
            <Column gap="md">
              <TextComponent variant="bodySmall" color="textSecondary">Vehicle Type</TextComponent>
              <Row gap="sm">
                {vehicleTypes.map(vt => (
                  <Button
                    key={vt.value}
                    variant={vehicleType === vt.value ? 'primary' : 'outline'}
                    size="md"
                    onPress={() => setVehicleType(vt.value)}
                    style={{ flex: 1 }}
                    leftIcon={<Ionicons name={vt.icon} size={20} color={vehicleType === vt.value ? theme.colors.white : theme.colors.navy} />}
                  >
                    <TextComponent variant="bodySmall" color={vehicleType === vt.value ? 'white' : 'navy'}>{vt.label}</TextComponent>
                  </Button>
                ))}
              </Row>
            </Column>

            <Input
              label="Vehicle Plate Number"
              placeholder="ABC 123 XY"
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
              autoCapitalize="characters"
              leftIcon={<Ionicons name="card" size={24} color={theme.colors.textTertiary} />}
            />

            <Button
              variant="primary"
              size="lg"
              loading={isLoading}
              onPress={handleComplete}
              style={{ marginTop: theme.spacing.md }}
            >
              Complete Setup
            </Button>
          </Column>
        </Card>
      </Column>
    </Screen>
  );
}