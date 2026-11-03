import * as Clipboard from 'expo-clipboard';

/** Copy helper for the confirmation screen (expo-clipboard; RN core Clipboard is deprecated). */
export function copyToClipboard(text: string): void {
  void Clipboard.setStringAsync(text).catch(() => {
    /* clipboard unavailable — the tracking number stays selectable */
  });
}
