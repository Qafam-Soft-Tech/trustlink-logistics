import type { ExpoConfig } from 'expo/config';

/**
 * APP_VARIANT is supplied per EAS profile (eas.json → build.<profile>.env) or by the local shell.
 *
 *   preview / preview-api → tester build: package and name get a ".preview" suffix
 *   production            → store build with the final package id
 *
 * Unset falls back to the production identity.
 */
const variant = process.env.APP_VARIANT ?? 'production';
const isPreview = variant.startsWith('preview');

const config: ExpoConfig = {
  name: isPreview ? 'TrustLink Rider (preview)' : 'TrustLink Rider',
  slug: 'rider',
  version: '1.0.0',
  scheme: 'trustlink-rider',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
  },
  android: {
    package: isPreview ? 'com.qafam.trustlink.rider.preview' : 'com.qafam.trustlink.rider',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-splash-screen',
    'expo-secure-store',
    [
      'expo-image-picker',
      {
        photosPermission: 'TrustLink Rider uses your photos so you can attach KYC documents and delivery-proof pictures.',
        cameraPermission: 'TrustLink Rider uses the camera to photograph KYC documents and proof of delivery.',
        microphonePermission: false,
      },
    ],
  ],
};

export default config;
