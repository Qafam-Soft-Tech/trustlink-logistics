import React from 'react';
import { ActivityIndicator } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Screen, Center, TabBar } from '@trustlink/shared';

import { PhoneEntryScreen } from '../screens/auth/PhoneEntryScreen';
import { OtpVerificationScreen } from '../screens/auth/OtpVerificationScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { JobsScreen } from '../screens/JobsScreen';
import { JobDetailsScreen } from '../screens/jobs/JobDetailsScreen';
import { ExecutionScreen } from '../screens/jobs/ExecutionScreen';
import { PodScreen } from '../screens/jobs/PodScreen';
import { FailureScreen } from '../screens/jobs/FailureScreen';
import { RiderReportIssueScreen } from '../screens/jobs/RiderReportIssueScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditVehicleScreen } from '../screens/account/EditVehicleScreen';
import { KycOverviewScreen } from '../screens/kyc/KycOverviewScreen';
import { KycFormScreen } from '../screens/kyc/KycFormScreen';
import { DesignGalleryScreen } from '../screens/DesignGalleryScreen';
import { RiderSessionExpiredSheet } from '../screens/auth/SessionExpiredSheet';
import { useSession } from '../session/SessionContext';
import type { AuthStackParamList, AlertsStackParamList, HomeStackParamList, JobsStackParamList, MainTabParamList, ProfileStackParamList, RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const JobsStack = createNativeStackNavigator<JobsStackParamList>();
const AlertsStack = createNativeStackNavigator<AlertsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <AuthStack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <AuthStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const inactive = theme.roles.textMuted;
  const active = theme.roles.primaryAction;
  const tabs = [
    { label: 'Home', icon: <Ionicons name="home-outline" size={22} color={inactive} />, activeIcon: <Ionicons name="home" size={22} color={active} /> },
    { label: 'Jobs', icon: <Ionicons name="briefcase-outline" size={22} color={inactive} />, activeIcon: <Ionicons name="briefcase" size={22} color={active} /> },
    { label: 'Alerts', icon: <Ionicons name="notifications-outline" size={22} color={inactive} />, activeIcon: <Ionicons name="notifications" size={22} color={active} /> },
    { label: 'Profile', icon: <Ionicons name="person-outline" size={22} color={inactive} />, activeIcon: <Ionicons name="person" size={22} color={active} /> },
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
    </HomeStack.Navigator>
  );
}

function JobsNavigator() {
  return (
    <JobsStack.Navigator screenOptions={{ headerShown: false }}>
      <JobsStack.Screen name="JobsList" component={JobsScreen} />
      <JobsStack.Screen name="JobDetails" component={JobDetailsScreen} />
      <JobsStack.Screen name="Execution" component={ExecutionScreen} options={{ gestureEnabled: false }} />
      <JobsStack.Screen name="Pod" component={PodScreen} />
      <JobsStack.Screen name="Failure" component={FailureScreen} />
      <JobsStack.Screen name="ReportIssue" component={RiderReportIssueScreen} />
    </JobsStack.Navigator>
  );
}

function AlertsNavigator() {
  return (
    <AlertsStack.Navigator screenOptions={{ headerShown: false }}>
      <AlertsStack.Screen name="AlertsFeed" component={AlertsScreen} />
    </AlertsStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="EditVehicle" component={EditVehicleScreen} />
      <ProfileStack.Screen name="KycOverview" component={KycOverviewScreen} />
      <ProfileStack.Screen name="KycForm" component={KycFormScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <MainTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeNavigator} />
      <Tab.Screen name="Jobs" component={JobsNavigator} />
      <Tab.Screen name="Alerts" component={AlertsNavigator} />
      <Tab.Screen name="Profile" component={ProfileNavigator} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { theme } = useTheme();
  const { session, ready } = useSession();

  if (!ready) {
    return (
      <Screen>
        <Center style={{ flex: 1 }}>
          <ActivityIndicator size="large" color={theme.roles.primaryAction} />
        </Center>
      </Screen>
    );
  }

  return (
    <>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
        {__DEV__ ? <RootStack.Screen name="DesignGallery" component={DesignGalleryScreen} /> : null}
      </RootStack.Navigator>
      <RiderSessionExpiredSheet />
    </>
  );
}
