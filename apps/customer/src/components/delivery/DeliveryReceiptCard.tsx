import React, { useState } from 'react';
import { Linking, Share } from 'react-native';
import type { Delivery, ProofOfDelivery } from '@trustlink/shared';
import { Button, Card, Column, Row, Text, useTheme, formatNaira, formatDate, receiptText, receiptMailto } from '@trustlink/shared';
import { useProfile } from '../../hooks';
import { shareReceiptPdf } from '../../utils/receiptPdf';
import { MetaRow } from './DeliveryMetaCard';

/** Receipt summary with share / email / PDF actions (receipt is generated locally — no endpoint). */
export function DeliveryReceiptCard({ delivery, pod }: { delivery: Delivery; pod?: ProofOfDelivery | null }) {
  const { theme } = useTheme();
  const profile = useProfile();
  const [shared, setShared] = useState(false);
  const [mailed, setMailed] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | undefined>();

  const share = () => {
    Share.share({ message: receiptText(delivery, pod ?? null) })
      .then(() => setShared(true))
      .catch(() => undefined);
  };

  const email = () => {
    Linking.openURL(receiptMailto(delivery, pod ?? null, profile.data?.email ?? undefined))
      .then(() => setMailed(true))
      .catch(() => undefined);
  };

  const pdf = async () => {
    setPdfError(undefined);
    setPdfBusy(true);
    try {
      await shareReceiptPdf(delivery, pod ?? null, {
        brand: theme.roles.primaryAction,
        text: theme.roles.text,
        muted: theme.roles.textMuted,
      });
    } catch (error) {
      setPdfError((error as Error).message || 'Could not create the PDF receipt.');
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <Card>
      <Column gap="md">
        <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Receipt</Text>
        <MetaRow label="Fare paid" value={formatNaira(delivery.fare ?? 0)} />
        <MetaRow label="Route" value={`${delivery.pickupArea ?? '—'} → ${delivery.dropoffArea ?? '—'}`} />
        <MetaRow label="Requested" value={formatDate(delivery.createdAt)} />
        {delivery.paymentReference ? <MetaRow label="Payment ref" value={delivery.paymentReference} /> : null}
        {pod ? <MetaRow label="Delivered to" value={`${pod.recipientName} · ${formatDate(pod.createdAt)}`} /> : null}

        <Row gap="sm">
          <Button variant="outline" size="md" style={{ flex: 1 }} onPress={share}>{shared ? 'Shared' : 'Share'}</Button>
          <Button variant="outline" size="md" style={{ flex: 1 }} onPress={email}>{mailed ? 'Email opened' : 'Email receipt'}</Button>
        </Row>
        <Button variant="primary" size="md" loading={pdfBusy} onPress={pdf}>Get PDF receipt</Button>
        {pdfError ? <Text variant="caption" color="inherit" style={{ color: theme.colors.error }}>{pdfError}</Text> : null}
      </Column>
    </Card>
  );
}
