import type { ExpoConfig } from 'expo/config';

/**
 * APP_VARIANT is supplied per EAS profile (eas.json → build.<profile>.env) or by the local shell.
 *
 *   preview / preview-api → tester build: package and name get a ".preview" suffix, so the tester
 *                           APK can sit next to a store install on the same phone
 *   production            → store build with the final package id
 *
 * Unset falls back to the production identity: the final package id is the safe default.
 */
const variant = process.env.APP_VARIANT ?? 'production';
const isPreview = variant.startsWith('preview');

const config: ExpoConfig = {
  name: isPreview ? 'TrustLink (preview)' : 'TrustLink',
  slug: 'customer',
  version: '1.0.0',
  scheme: 'trustlink',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: isPreview ? 'com.qafam.trustlink.preview' : 'com.qafam.trustlink',
    buildNumber: '1',
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: isPreview ? 'com.qafam.trustlink.preview' : 'com.qafam.trustlink',
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#0b1f47',
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
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 220,
        resizeMode: 'contain',
        backgroundColor: '#0b1f47',
      },
    ],
    'expo-sharing',
  ],
};

export default config;
