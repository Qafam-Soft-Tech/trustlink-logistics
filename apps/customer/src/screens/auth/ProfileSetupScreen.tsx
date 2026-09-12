import React, { useState } from 'react';
import { Keyboard, Alert } from 'react-native';
import { Screen, Text as TextComponent, Box, Button, Input, Card, Column, Center, Row, Avatar } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';

interface ProfileSetupScreenProps {
  navigation: any;
  route: { params: { phone: string; role: string } };
}

export function ProfileSetupScreen({ navigation, route }: ProfileSetupScreenProps) {
  const { phone, role } = route.params;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing Information', 'Please enter your first and last name');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call backend API to complete profile
      // const response = await api.post('/auth/profile/setup', { phone, firstName, lastName, email, role });
      console.log('Completing profile:', { phone, firstName, lastName, email, role });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigation.replace('Main');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={{ flex: 1, padding: theme.spacing.lg }}>
      <Column style={{ flex: 1, justifyContent: 'center' }} gap="xl">
        <Center>
          <Avatar size="xl" name={`${firstName} ${lastName}` || 'User'} />
        </Center>
        
        <Column gap="sm" style={{ alignItems: 'center' }}>
          <TextComponent variant="h2" color="textPrimary" style={{ textAlign: 'center' }}>
            Complete your profile
          </TextComponent>
          <TextComponent variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
            This helps us personalize your experience
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