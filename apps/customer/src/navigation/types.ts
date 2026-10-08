import type { NavigatorScreenParams } from '@react-navigation/native';
import type { UserRole } from '@trustlink/shared';

export type OnboardingStackParamList = {
  Slides: undefined;
  Welcome: undefined;
};

export type AuthStackParamList = {
  PhoneEntry: undefined;
  OtpVerification: { phone: string; role?: UserRole; purpose: 'signup' | 'login' };
  ProfileSetup: { phone: string; role: UserRole };
  AccountReady: undefined;
};

export type HomeStackParamList = {
  HomeFeed: undefined;
  TrackByNumber: { trackingNumber: string };
  NotFound: { trackingNumber?: string };
  SavedAddresses: undefined;
  AddressForm: { id?: string };
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Deliveries: undefined;
  Alerts: undefined;
  Account: undefined;
};

export type NewDeliveryStackParamList = {
  Pickup: undefined;
  Dropoff: undefined;
  Package: undefined;
  Sender: undefined;
  Review: undefined;
  Fare: undefined;
  PaySummary: undefined;
  Processing: undefined;
  Result: { status: 'success' | 'failed' | 'cancelled'; deliveryId?: string };
};

export type TrackingStackParamList = {
  TrackingHome: { deliveryId?: string } | undefined;
  Timeline: { deliveryId: string };
  POD: { deliveryId: string };
  Failed: { deliveryId: string };
  Returned: { deliveryId: string };
  CancelFlow: { deliveryId: string };
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList> | undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  NewDelivery: NavigatorScreenParams<NewDeliveryStackParamList> | undefined;
  Tracking: NavigatorScreenParams<TrackingStackParamList> | undefined;
  DesignGallery: undefined;
};
