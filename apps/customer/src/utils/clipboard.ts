import { Clipboard } from 'react-native';

/**
 * Copy helper for the confirmation screen.
 * Uses React Native's built-in Clipboard (deprecated in core, still present in RN 0.86).
 * Swapping to `expo-clipboard` needs dependency approval — tracked in CONTRACT_LEDGER.md.
 */
export function copyToClipboard(text: string): void {
  try {
    Clipboard.setString(text);
  } catch {
    /* clipboard unavailable — the tracking number stays selectable */
  }
}
