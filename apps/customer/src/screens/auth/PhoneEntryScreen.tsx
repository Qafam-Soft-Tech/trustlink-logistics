import React, { useState } from 'react';
import { Keyboard, Alert } from 'react-native';
import { Screen, Text as TextComponent, Box, Button, Input, Card, Column, Center, Row } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';

export function PhoneEntryScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'rider'>('customer');
  const [isLogin, setIsLogin] = useState(false);

  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhone(text);
    setPhone(formatted);
  };

  const handleContinue = async () => {
    const cleanedPhone = phone.replace(/\s/g, '');
    if (!cleanedPhone || cleanedPhone.length !== 11) {
      Alert.alert('Invalid Phone', 'Please enter a valid 11-digit Nigerian phone number');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { phone: cleanedPhone });
        console.log('Login response:', response.data);
        navigation.navigate('OtpVerification', { 
          phone: cleanedPhone, 
          purpose: 'login'
        });
      } else {
        const response = await api.post('/auth/signup', { phone: cleanedPhone, role: selectedRole });
        console.log('Signup response:', response.data);
        navigation.navigate('OtpVerification', { 
          phone: cleanedPhone, 
          role: selectedRole,
          purpose: 'signup'
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen style={{ flex: 1, padding: theme.spacing.lg }}>
      <StatusBarHidden />
      <Column style={{ flex: 1, justifyContent: 'center' }} gap="xl">
        <Center>
          <Box style={{ 
            width: 100, 
            height: 100, 
            borderRadius: theme.borderRadius.full, 
            backgroundColor: theme.colors.navy,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Ionicons name="cube" size={50} color={theme.colors.gold} />
          </Box>
        </Center>
        
        <Column gap="md" style={{ alignItems: 'center' }}>
          <TextComponent variant="h2" color="textPrimary" style={{ textAlign: 'center' }}>
            Welcome to TrustLink
          </TextComponent>
          <TextComponent variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
            Secure. Swift. Strategic.
          </TextComponent>
        </Column>

        <Card style={{ padding: theme.spacing.xl }}>
          <Column gap="lg">
            <Column gap="sm">
              <TextComponent variant="h4" color="textPrimary" style={{ textAlign: 'center' }}>
                {isLogin ? 'Welcome back' : 'Enter your phone number'}
              </TextComponent>
              <TextComponent variant="bodySmall" color="textSecondary" style={{ textAlign: 'center' }}>
                {isLogin 
                  ? 'We\'ll send a verification code to log you in' 
                  : 'We\'ll send a verification code via SMS'}
              </TextComponent>
            </Column>

            <Input
              label="Phone Number"
              placeholder="080 1234 5678"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={14}
              leftIcon={<Ionicons name="call" size={24} color={theme.colors.textTertiary} />}
            />

            {!isLogin && (
              <>
                <Column gap="md" style={{ marginTop: theme.spacing.md }}>
                  <TextComponent variant="bodySmall" color="textSecondary" style={{ marginBottom: theme.spacing.xs }}>
                    I am a:
                  </TextComponent>
                  <Row gap="md">
                    <TouchableRoleButton
                      label="Customer"
                      icon="person"
                      selected={selectedRole === 'customer'}
                      onPress={() => setSelectedRole('customer')}
                    />
                    <TouchableRoleButton
                      label="Rider"
                      icon="bicycle"
                      selected={selectedRole === 'rider'}
                      onPress={() => setSelectedRole('rider')}
                    />
                  </Row>
                </Column>
              </>
            )}

            <Button
              variant="primary"
              size="lg"
              loading={isLoading}
              onPress={handleContinue}
              style={{ marginTop: theme.spacing.md }}
            >
              {isLogin ? 'Log In' : 'Continue'}
            </Button>

            <Button
              variant="ghost"
              size="md"
              onPress={() => setIsLogin(!isLogin)}
              style={{ marginTop: theme.spacing.sm }}
            >
              {isLogin ? 'Don\'t have an account? Sign Up' : 'Already have an account? Log In'}
            </Button>
          </Column>
        </Card>

        <Center>
          <TextComponent variant="caption" color="textTertiary">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </TextComponent>
        </Center>
      </Column>
    </Screen>
  );
}

function TouchableRoleButton({ label, icon, selected, onPress }: any) {
  return (
    <Button
      variant={selected ? 'primary' : 'outline'}
      size="md"
      onPress={onPress}
      style={{ flex: 1 }}
      leftIcon={<Ionicons name={icon} size={20} color={selected ? theme.colors.white : theme.colors.navy} />}
    >
      {label}
    </Button>
  );
}

function StatusBarHidden() {
  return null;
}