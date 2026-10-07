import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, Alert } from 'react-native';
import { Screen, Text as TextComponent, Box, Button, Input, Card, Column, Center, Row } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';

interface OtpVerificationScreenProps {
  navigation: any;
  route: any;
}

export function OtpVerificationScreen({ navigation, route }: OtpVerificationScreenProps) {
  const { phone, role, purpose } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<any>>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value) || value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (newOtp.every(d => d)) {
      handleVerify();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;

    setIsLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { phone, code, purpose });
      console.log('OTP verified:', response.data);
      
      if (purpose === 'signup') {
        navigation.navigate('ProfileSetup', { phone, role });
      } else {
        navigation.replace('Main');
      }
    } catch (error: any) {
      Alert.alert('Invalid OTP', error.response?.data?.message || 'The code you entered is incorrect or expired.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setIsLoading(true);
    try {
      await api.post('/auth/resend-otp', { phone, purpose });
      console.log('OTP resent');
      setResendTimer(60);
      setCanResend(false);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  };

  return (
    <Screen style={{ flex: 1, padding: theme.spacing.lg }}>
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
            <Ionicons name="lock-closed" size={50} color={theme.colors.gold} />
          </Box>
        </Center>
        
        <Column gap="sm" style={{ alignItems: 'center' }}>
          <TextComponent variant="h2" color="textPrimary" style={{ textAlign: 'center' }}>
            Verify your phone
          </TextComponent>
          <TextComponent variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
            We sent a 6-digit code to
          </TextComponent>
          <TextComponent variant="body" color="navy" style={{ textAlign: 'center', fontWeight: '600' }}>
            {formatPhone(phone)}
          </TextComponent>
        </Column>

        <Card style={{ padding: theme.spacing.xl }}>
          <Column gap="lg">
            <Row gap="md" style={{ justifyContent: 'center' }}>
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={{ width: 50, height: 60, textAlign: 'center', fontSize: 24 }}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  maxLength={1}
                  keyboardType="number-pad"
                  autoFocus={index === 0}
                />
              ))}
            </Row>

            <Row gap="md" style={{ justifyContent: 'center', alignItems: 'center' }}>
              <TextComponent variant="bodySmall" color={canResend ? 'navy' : 'textTertiary'}>
                Didn't receive the code?
              </TextComponent>
              <Button
                variant="ghost"
                size="sm"
                onPress={handleResend}
                disabled={!canResend || isLoading}
              >
                {canResend ? 'Resend' : `Resend in ${resendTimer}s`}
              </Button>
            </Row>

            <Button
              variant="primary"
              size="lg"
              loading={isLoading}
              onPress={handleVerify}
              disabled={otp.some(d => !d) || isLoading}
              style={{ marginTop: theme.spacing.md }}
            >
              Verify & Continue
            </Button>
          </Column>
        </Card>
      </Column>
    </Screen>
  );
}