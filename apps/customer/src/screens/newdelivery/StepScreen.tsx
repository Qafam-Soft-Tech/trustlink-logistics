import React from 'react';
import { ScrollView } from 'react-native';
import { Screen, TopBar, StepIndicator, NEW_DELIVERY_STEPS } from '@trustlink/shared';
import { DraftExitGuard, type NewDeliveryNavigation } from './DraftExitGuard';

/** Common chrome for a request-flow step: back bar, step indicator, scrollable body, pinned footer. */
export function StepScreen({ title, step, navigation, children, footer }: {
  title: string;
  step: number;
  navigation: NewDeliveryNavigation;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Screen>
      <TopBar title={title} showBack onBack={() => navigation.goBack()} />
      <StepIndicator steps={NEW_DELIVERY_STEPS} current={step} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer}
      <DraftExitGuard navigation={navigation} />
    </Screen>
  );
}
