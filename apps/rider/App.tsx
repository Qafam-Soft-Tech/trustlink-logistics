import React, { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { ThemeProvider, useTheme } from '@trustlink/shared';

import { AppNavigator } from './src/navigation/AppNavigator';
import { DataProvider } from './src/data/DataContext';
import { SessionProvider } from './src/session/SessionContext';

const queryClient = new QueryClient();

function Root() {
  const { theme, resolvedMode } = useTheme();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_700Bold });

  const navigationTheme = useMemo(() => {
    const base = resolvedMode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.roles.primaryAction,
        background: theme.roles.bg,
        card: theme.roles.surface,
        text: theme.roles.text,
        border: theme.roles.border,
        notification: theme.colors.gold,
      },
    };
  }, [theme, resolvedMode]);

  void fontsLoaded;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <ThemeProvider storage={AsyncStorage}>
          <SessionProvider>
            <Root />
          </SessionProvider>
        </ThemeProvider>
      </DataProvider>
    </QueryClientProvider>
  );
}
