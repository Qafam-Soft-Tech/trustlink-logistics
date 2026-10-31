import Constants from 'expo-constants';

/** App metadata. The version is read from app.config.ts `expo.version` at runtime (expo-constants). */
export const APP_NAME = 'TrustLink Customer';
export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
export const TAGLINE = 'Secure. Swift. Strategic.';
export const BUILD_LABEL = `${APP_NAME} · Version ${APP_VERSION}`;
export const DEMO_DATA_NOTICE =
  'Demo build: deliveries, riders and payments come from local sample data. Nothing is charged to a real card and no real SMS is sent.';
