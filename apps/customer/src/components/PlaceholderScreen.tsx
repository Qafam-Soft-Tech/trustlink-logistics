import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenScaffold } from './ScreenScaffold';

/** Factory that produces a branded placeholder screen for a route. */
export function makePlaceholder(title: string, note?: string, message?: string) {
  return function Placeholder({ navigation }: NativeStackScreenProps<any>) {
    const canGoBack = navigation.canGoBack();
    return <ScreenScaffold title={title} note={note} message={message} onBack={canGoBack ? () => navigation.goBack() : undefined} />;
  };
}
