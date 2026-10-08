import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Delivery, ProofOfDelivery, ReceiptColors } from '@trustlink/shared';
import { receiptHtml } from '@trustlink/shared';

/** Render the receipt to a PDF on device and open the OS share sheet (expo-print + expo-sharing). */
export async function shareReceiptPdf(
  delivery: Delivery,
  pod: Partial<ProofOfDelivery> | null | undefined,
  colors: ReceiptColors,
): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: receiptHtml(delivery, pod, colors) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'TrustLink receipt', UTI: 'com.adobe.pdf' });
  }
}
