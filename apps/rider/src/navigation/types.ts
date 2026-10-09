import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  PhoneEntry: undefined;
  OtpVerification: { phone: string; purpose: 'signup' | 'login' };
  ProfileSetup: { phone: string };
};

export type HomeStackParamList = {
  HomeFeed: undefined;
};

export type JobsStackParamList = {
  Jobs: undefined;
};

export type AlertsStackParamList = {
  Alerts: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditVehicle: undefined;
  KycOverview: undefined;
  KycForm: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Jobs: NavigatorScreenParams<JobsStackParamList> | undefined;
  Alerts: NavigatorScreenParams<AlertsStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  DesignGallery: undefined;
};
