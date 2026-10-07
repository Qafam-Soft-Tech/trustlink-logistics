import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Screen, Text as TextComponent, Box, Button, Input, Card, Row, Column, Center, Divider } from '@trustlink/shared';
import { theme } from '@trustlink/shared';

import { PhoneEntryScreen } from '../screens/auth/PhoneEntryScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { AccountReadyScreen } from '../screens/auth/AccountReadyScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="AccountReady" component={AccountReadyScreen} />
    </Stack.Navigator>
  );
}