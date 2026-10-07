import React from 'react';
import { ActivityIndicator } from 'react-native';
import { createNativeStackNavigator, type NativeStackScreenProps, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, TabBar, Screen, Center, Column, Text, Button, Banner } from '@trustlink/shared';

import { AuthNavigator } from './AuthNavigator';
import { HomeScreen } from '../screens/HomeScreen';
import { DeliveriesScreen } from '../screens/DeliveriesScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { TrackByNumberScreen } from '../screens/TrackByNumberScreen';
import { OnboardingSlidesScreen } from '../screens/onboarding/OnboardingSlidesScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { DesignGalleryScreen } from '../screens/DesignGalleryScreen';
import { SplashScreen } from '../screens/splash/SplashScreen';
import { SessionExpiredSheet } from '../screens/auth/SessionExpiredSheet';
import { makePlaceholder } from '../components/PlaceholderScreen';
import type { RootStackParamList, MainTabParamList, NewDeliveryStackParamList, TrackingStackParamList, OnboardingStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const NewDeliveryStack = createNativeStackNavigator<NewDeliveryStackParamList>();
const TrackingStack = createNativeStackNavigator<TrackingStackParamList>();

/** Deep links: trustlink://track/:trackingNumber and trustlink://delivery/:id */
export const linking = {
  prefixes: ['trustlink://'],
  config: {
    screens: {
      Main: { screens: { Home: 'home', Deliveries: 'deliveries', Alerts: 'alerts', Account: 'account' } },
      Tracking: { screens: { TrackingHome: 'delivery/:deliveryId', TrackByNumber: 'track/:trackingNumber' } },
      NewDelivery: { screens: { Pickup: 'new/pickup' } },
      Auth: { screens: { PhoneEntry: 'signin' } },
    },
  },
};

// ---- placeholders for unbuilt screens (see SCAFFOLD_REGISTER.md) ----
const PickupStep = makePlaceholder('Pickup', 'Address entry arrives in Phase 6.');
const DropoffStep = makePlaceholder('Drop-off & recipient', 'Address entry arrives in Phase 6.');
const PackageStep = makePlaceholder('Package details', 'Weight chips arrive in Phase 6.');
const SenderStep = makePlaceholder('Sender contact', 'Sender details arrive in Phase 6.');
const ReviewStep = makePlaceholder('Review', 'Review step arrives in Phase 6.');
const FareStep = makePlaceholder('Fare quote', 'Fare breakdown arrives in Phase 7.');
const PaySummaryStep = makePlaceholder('Pay summary', 'Payment summary arrives in Phase 7.');
const TrackingHome = makePlaceholder('Tracking', 'Live status arrives in Phase 8.');
const TimelineStep = makePlaceholder('Timeline', 'Timeline detail arrives in Phase 8.');
const PodStep = makePlaceholder('Proof of delivery', 'POD view arrives in Phase 9.');
const FailedStep = makePlaceholder('Delivery unsuccessful', 'Failure state arrives in Phase 9.');
const ReturnedStep = makePlaceholder('Returned', 'Returned state arrives in Phase 9.');
const CancelFlowStep = makePlaceholder('Cancel delivery', 'Cancellation flow arrives in Phase 8.');

function ProcessingScreen({ navigation }: NativeStackScreenProps<NewDeliveryStackParamList, 'Processing'>) {
  const { theme } = useTheme();
  React.useEffect(() => navigation.addListener('beforeRemove', (e) => e.preventDefault()), [navigation]);
  return (
    <Screen>
      <Center style={{ flex: 1, padding: 24 }}>
        <Column gap="lg" align="center">
          <ActivityIndicator size="large" color={theme.roles.primaryAction} />
          <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Processing payment…</Text>
          <Banner variant="info" message="Please don't close the app while we confirm your payment." />
          <Button variant="primary" size="md" onPress={() => navigation.replace('Result', { status: 'success' })}>
            Simulate result
          </Button>
        </Column>
      </Center>
    </Screen>
  );
}

function PayResultScreen({ navigation, route }: NativeStackScreenProps<NewDeliveryStackParamList, 'Result'>) {
  const { theme } = useTheme();
  const root = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
  const ok = route.params.status === 'success';
  return (
    <Screen>
      <Center style={{ flex: 1, padding: 24 }}>
        <Column gap="lg" align="center">
          <Text variant="h2" color="inherit" style={{ color: ok ? theme.colors.success : theme.colors.error }}>
            {ok ? '✓' : '!'}
          </Text>
          <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>
            {ok ? 'Request confirmed' : route.params.status === 'failed' ? 'Payment failed' : 'Payment cancelled'}
          </Text>
          {ok ? (
            <Button
              variant="primary"
              size="lg"
              onPress={() => root?.navigate('Tracking', { screen: 'TrackingHome', params: { deliveryId: route.params.deliveryId } })}
            >
              Track this delivery
            </Button>
          ) : (
            <Button variant="primary" size="lg" onPress={() => root?.navigate('Main')}>Back to home</Button>
          )}
          <Button variant="ghost" size="md" onPress={() => root?.navigate('Main')}>Done</Button>
        </Column>
      </Center>
    </Screen>
  );
}

function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const c = theme.roles.textMuted;
  const a = theme.roles.primaryAction;
  const tabs = [
    { label: 'Home', icon: <Ionicons name="home-outline" size={22} color={c} />, activeIcon: <Ionicons name="home" size={22} color={a} /> },
    { label: 'Deliveries', icon: <Ionicons name="cube-outline" size={22} color={c} />, activeIcon: <Ionicons name="cube" size={22} color={a} /> },
    { label: 'Alerts', icon: <Ionicons name="notifications-outline" size={22} color={c} />, activeIcon: <Ionicons name="notifications" size={22} color={a} /> },
    { label: 'Account', icon: <Ionicons name="person-outline" size={22} color={c} />, activeIcon: <Ionicons name="person" size={22} color={a} /> },
  ];
  return (
    <TabBar
      tabs={tabs}
      activeIndex={state.index}
      onPress={(index) => {
        const route = state.routes[index];
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (!event.defaultPrevented) navigation.navigate(route.name);
      }}
    />
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <MainTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Deliveries" component={DeliveriesScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Slides" component={OnboardingSlidesScreen} />
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
    </OnboardingStack.Navigator>
  );
}

function NewDeliveryNavigator() {
  return (
    <NewDeliveryStack.Navigator screenOptions={{ headerShown: false }}>
      <NewDeliveryStack.Screen name="Pickup" component={PickupStep} />
      <NewDeliveryStack.Screen name="Dropoff" component={DropoffStep} />
      <NewDeliveryStack.Screen name="Package" component={PackageStep} />
      <NewDeliveryStack.Screen name="Sender" component={SenderStep} />
      <NewDeliveryStack.Screen name="Review" component={ReviewStep} />
      <NewDeliveryStack.Screen name="Fare" component={FareStep} />
      <NewDeliveryStack.Screen name="PaySummary" component={PaySummaryStep} />
      <NewDeliveryStack.Screen name="Processing" component={ProcessingScreen} options={{ gestureEnabled: false }} />
      <NewDeliveryStack.Screen name="Result" component={PayResultScreen} options={{ gestureEnabled: false }} />
    </NewDeliveryStack.Navigator>
  );
}

function TrackingNavigator() {
  return (
    <TrackingStack.Navigator screenOptions={{ headerShown: false }}>
      <TrackingStack.Screen name="TrackingHome" component={TrackingHome} />
      <TrackingStack.Screen name="Timeline" component={TimelineStep} />
      <TrackingStack.Screen name="POD" component={PodStep} />
      <TrackingStack.Screen name="Failed" component={FailedStep} />
      <TrackingStack.Screen name="Returned" component={ReturnedStep} />
      <TrackingStack.Screen name="CancelFlow" component={CancelFlowStep} />
      <TrackingStack.Screen name="TrackByNumber" component={TrackByNumberScreen} />
    </TrackingStack.Navigator>
  );
}

function RootNavigator() {
  return (
    <>
      <RootStack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        <RootStack.Screen name="Auth" component={AuthNavigator} />
        <RootStack.Screen name="Main" component={MainTabs} />
        <RootStack.Screen name="NewDelivery" component={NewDeliveryNavigator} options={{ presentation: 'modal' }} />
        <RootStack.Screen name="Tracking" component={TrackingNavigator} />
        {__DEV__ ? <RootStack.Screen name="DesignGallery" component={DesignGalleryScreen} /> : null}
      </RootStack.Navigator>
      <SessionExpiredSheet />
    </>
  );
}

export function AppNavigator() {
  return <RootNavigator />;
}
