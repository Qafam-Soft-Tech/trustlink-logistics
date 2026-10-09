import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'trustlink.notifications.read';

/**
 * Locally-tracked read state for in-app alerts.
 * The backend `Notification` has no read/unread field and no read endpoint (SC-30),
 * so "unread" is a device-local concern.
 */
export async function loadReadNotificationIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function saveReadNotificationIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(ids.slice(0, 200)));
  } catch {
    /* storage unavailable — unread state simply resets */
  }
}
