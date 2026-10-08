import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/** Root navigation ref — lets non-screen overlays (Demo menu, SessionExpired) navigate safely. */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<Name extends keyof RootStackParamList>(name: Name, params?: RootStackParamList[Name]): void {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as (n: string, p?: unknown) => void)(name, params);
  }
}
