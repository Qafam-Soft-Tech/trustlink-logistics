import React from 'react';
import * as Linking from 'expo-linking';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, TabBar } from '@trustlink/shared';

import { AuthNavigator } from './AuthNavigator';
import { HomeScreen } from '../screens/HomeScreen';
import { DeliveriesScreen } from '../screens/DeliveriesScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { TrackByNumberScreen } from '../screens/TrackByNumberScreen';
import { NotFoundScreen } from '../screens/NotFoundScreen';
import { SavedAddressesScreen } from '../screens/SavedAddressesScreen';
import { AddressFormScreen } from '../screens/AddressFormScreen';
import { OnboardingSlidesScreen } from '../screens/onboarding/OnboardingSlidesScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { PickupScreen } from '../screens/newdelivery/PickupScreen';
import { DropoffScreen } from '../screens/newdelivery/DropoffScreen';
import { PackageScreen } from '../screens/newdelivery/PackageScreen';
import { SenderScreen } from '../screens/newdelivery/SenderScreen';
import { ReviewScreen } from '../screens/newdelivery/ReviewScreen';
import { NewDeliveryDraftProvider } from '../screens/newdelivery/DraftContext';
import { FareScreen } from '../screens/payment/FareScreen';
import { PaySummaryScreen } from '../screens/payment/PaySummaryScreen';
import { ProcessingScreen } from '../screens/payment/ProcessingScreen';
import { ResultScreen } from '../screens/payment/ResultScreen';
import { TrackingHomeScreen } from '../screens/tracking/TrackingHomeScreen';
import { PodScreen } from '../screens/tracking/PodScreen';
import { FailedScreen } from '../screens/tracking/FailedScreen';
import { ReturnedScreen } from '../screens/tracking/ReturnedScreen';
import { CancelledScreen } from '../screens/tracking/CancelledScreen';
import { DetailsScreen } from '../screens/tracking/DetailsScreen';
import { CancelFlowScreen } from '../screens/tracking/CancelFlowScreen';
import { ReportIssueScreen } from '../screens/support/ReportIssueScreen';
import { IssueSubmittedScreen } from '../screens/support/IssueSubmittedScreen';
import { MyIssuesScreen } from '../screens/support/MyIssuesScreen';
import { IssueDetailScreen } from '../screens/support/IssueDetailScreen';
import { HelpScreen } from '../screens/support/HelpScreen';
import { DesignGalleryScreen } from '../screens/DesignGalleryScreen';
import { SplashScreen } from '../screens/splash/SplashScreen';
import { SessionExpiredSheet } from '../screens/auth/SessionExpiredSheet';
import type { RootStackParamList, MainTabParamList, HomeStackParamList, NewDeliveryStackParamList, TrackingStackParamList, OnboardingStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const NewDeliveryStack = createNativeStackNavigator<NewDeliveryStackParamList>();
const TrackingStack = createNativeStackNavigator<TrackingStackParamList>();

/** Deep links: trustlink://track/:trackingNumber, trustlink://delivery/:id (+ Expo Go via createURL). */
export const linking = {
  prefixes: [Linking.createURL('/'), 'trustlink://'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: { screens: { HomeFeed: 'home', TrackByNumber: 'track/:trackingNumber', SavedAddresses: 'addresses' } },
          Deliveries: 'deliveries',
          Alerts: 'alerts',
          Account: 'account',
        },
      },
      Tracking: { screens: { TrackingHome: 'delivery/:deliveryId' } },
      NewDelivery: { screens: { Pickup: 'new/pickup' } },
      Auth: { screens: { PhoneEntry: 'signin' } },
    },
  },
};

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

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeFeed" component={HomeScreen} />
      <HomeStack.Screen name="TrackByNumber" component={TrackByNumberScreen} />
      <HomeStack.Screen name="NotFound" component={NotFoundScreen} />
      <HomeStack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <HomeStack.Screen name="AddressForm" component={AddressFormScreen} />
    </HomeStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <MainTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeNavigator} />
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
    <NewDeliveryDraftProvider>
      <NewDeliveryStack.Navigator screenOptions={{ headerShown: false }}>
        <NewDeliveryStack.Screen name="Pickup" component={PickupScreen} />
        <NewDeliveryStack.Screen name="Dropoff" component={DropoffScreen} />
        <NewDeliveryStack.Screen name="Package" component={PackageScreen} />
        <NewDeliveryStack.Screen name="Sender" component={SenderScreen} />
        <NewDeliveryStack.Screen name="Review" component={ReviewScreen} />
        <NewDeliveryStack.Screen name="Fare" component={FareScreen} />
        <NewDeliveryStack.Screen name="PaySummary" component={PaySummaryScreen} />
        <NewDeliveryStack.Screen name="Processing" component={ProcessingScreen} options={{ gestureEnabled: false }} />
        <NewDeliveryStack.Screen name="Result" component={ResultScreen} options={{ gestureEnabled: false }} />
      </NewDeliveryStack.Navigator>
    </NewDeliveryDraftProvider>
  );
}

function TrackingNavigator() {
  return (
    <TrackingStack.Navigator screenOptions={{ headerShown: false }}>
      <TrackingStack.Screen name="TrackingHome" component={TrackingHomeScreen} />
      <TrackingStack.Screen name="Pod" component={PodScreen} />
      <TrackingStack.Screen name="Failed" component={FailedScreen} />
      <TrackingStack.Screen name="Returned" component={ReturnedScreen} />
      <TrackingStack.Screen name="Cancelled" component={CancelledScreen} />
      <TrackingStack.Screen name="Details" component={DetailsScreen} />
      <TrackingStack.Screen name="CancelFlow" component={CancelFlowScreen} />
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
        <RootStack.Screen name="ReportIssue" component={ReportIssueScreen} options={{ presentation: 'modal' }} />
        <RootStack.Screen name="IssueSubmitted" component={IssueSubmittedScreen} options={{ gestureEnabled: false }} />
        <RootStack.Screen name="MyIssues" component={MyIssuesScreen} />
        <RootStack.Screen name="IssueDetail" component={IssueDetailScreen} />
        <RootStack.Screen name="Help" component={HelpScreen} />
        {__DEV__ ? <RootStack.Screen name="DesignGallery" component={DesignGalleryScreen} /> : null}
      </RootStack.Navigator>
      <SessionExpiredSheet />
    </>
  );
}

export function AppNavigator() {
  return <RootNavigator />;
}
