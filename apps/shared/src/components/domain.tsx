import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSuccessPop } from '../motion';
import type { DeliveryEvent, DeliveryStatus, FareBreakdown as FareBreakdownType, PaymentProvider, ProofOfDelivery } from '../domain/types';
import { deliveryStatusLabel } from '../domain/tracking';
import { formatNaira, formatDate, formatDateTime } from '../formatters';
import { useTheme } from '../theme/ThemeProvider';
import { Text, Card, Button } from './primitives';
import { Divider } from './layout';
import { BottomSheet, Banner } from './feedback';
import { SegmentedControl } from './forms';

/** Accessible status text is provided by the theme (roles.statusText); labels live in the domain. */

export function statusLabel(status: DeliveryStatus): string {
  return deliveryStatusLabel(status);
}

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  const { theme } = useTheme();
  const fill = theme.roles.status[status];
  const text = theme.roles.statusText[status];
  const scale = useSuccessPop();
  return (
    <Animated.View
      style={[styles.statusBadge, { backgroundColor: fill + '22' }, scale]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${statusLabel(status)}`}
    >
      <View style={[styles.dot, { backgroundColor: fill }]} />
      <Text variant="caption" color="inherit" style={{ color: text, fontWeight: '600' }}>
        {statusLabel(status)}
      </Text>
    </Animated.View>
  );
}

/**
 * Naira amount with a screen-reader-friendly label.
 * `useSystemFont` falls back to the device font if a build's Inter cut is missing the ₦ glyph.
 */
export function AmountText({ amount, variant = 'body', useSystemFont = false, style }: {
  amount: number;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'bodySmall' | 'caption';
  useSystemFont?: boolean;
  style?: any;
}) {
  const { theme } = useTheme();
  return (
    <Text
      variant={variant}
      color="inherit"
      accessibilityLabel={`${Math.round(amount).toLocaleString('en-NG')} naira`}
      style={[{ color: theme.roles.text }, useSystemFont ? { fontFamily: undefined } : null, style]}
    >
      {formatNaira(amount)}
    </Text>
  );
}

export function StatusTimeline({ events }: { events: DeliveryEvent[] }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 0 }}>
      {events.map((ev, i) => {
        const fill = theme.roles.status[ev.status];
        const last = i === events.length - 1;
        return (
          <View key={ev.id ?? i} style={styles.timelineRow}>
            <View style={styles.timelineGutter}>
              <View style={[styles.timelineDot, { backgroundColor: last ? fill : theme.roles.borderStrong, borderColor: fill }]} />
              {!last && <View style={[styles.timelineLine, { backgroundColor: theme.roles.border }]} />}
            </View>
            <View style={[styles.timelineBody, { paddingBottom: last ? 0 : 16 }]}>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text, fontWeight: '600' }}>
                {statusLabel(ev.status)}
              </Text>
              <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                {formatDateTime(ev.createdAt)}
              </Text>
              {ev.notes ? (
                <Text variant="caption" color="inherit" style={{ color: theme.roles.textSecondary }}>
                  {ev.notes}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function RouteSummaryCard({ pickupArea, dropoffArea, distanceKm, etaMinutes }: { pickupArea: string; dropoffArea: string; distanceKm?: number; etaMinutes?: number }) {
  const { theme } = useTheme();
  return (
    <Card elevation="sm">
      <View style={styles.routeRow}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: theme.colors.success }]} />
          <View>
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Pickup</Text>
            <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{pickupArea}</Text>
          </View>
        </View>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: theme.roles.primaryAction }]} />
          <View>
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Drop-off</Text>
            <Text variant="body" color="inherit" style={{ color: theme.roles.text }}>{dropoffArea}</Text>
          </View>
        </View>
      </View>
      {(distanceKm !== undefined || etaMinutes !== undefined) && (
        <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textSecondary, marginTop: 8 }}>
          {distanceKm !== undefined ? `${distanceKm} km` : ''}{distanceKm !== undefined && etaMinutes !== undefined ? ' • ' : ''}
          {etaMinutes !== undefined ? `~${etaMinutes} min` : ''}
        </Text>
      )}
    </Card>
  );
}

export function FareBreakdownCard({ breakdown }: { breakdown: FareBreakdownType }) {
  const { theme } = useTheme();
  const rows: Array<[string, number]> = [
    ['Base fare', breakdown.baseFare],
    ['Distance', breakdown.distanceCharge],
    ['Weight', breakdown.weightCharge],
  ];
  return (
    <Card elevation="sm">
      <View style={{ gap: 8 }}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.fareRow}>
            <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textSecondary }}>{label}</Text>
            <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{formatNaira(value)}</Text>
          </View>
        ))}
        <Divider />
        <View style={styles.fareRow}>
          <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>Total</Text>
          <Text variant="h4" color="inherit" style={{ color: theme.roles.primaryAction }}>{formatNaira(breakdown.totalFare)}</Text>
        </View>
        {breakdown.subtotal < breakdown.minimumFare ? (
          <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
            Minimum fare of {formatNaira(breakdown.minimumFare)} applies
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

export function CheckoutSheet({ visible, amount, provider, onProviderChange, onPay, onClose, busy }: {
  visible: boolean;
  amount: number;
  provider: PaymentProvider;
  onProviderChange: (p: PaymentProvider) => void;
  onPay: () => void;
  onClose?: () => void;
  busy?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <BottomSheet visible={visible} title="Checkout" onClose={onClose}>
      <View style={{ gap: 16 }}>
        <Banner variant="warning" title="Test mode" message="No real payment is taken in demo mode." />
        <SegmentedControl<PaymentProvider>
          value={provider}
          onChange={onProviderChange}
          options={[
            { label: 'Card', value: 'paystack' },
            { label: 'Bank transfer', value: 'flutterwave' },
          ]}
        />
        <View style={styles.fareRow}>
          <Text variant="body" color="inherit" style={{ color: theme.roles.textSecondary }}>Amount due</Text>
          <Text variant="h3" color="inherit" style={{ color: theme.roles.text }}>{formatNaira(amount)}</Text>
        </View>
        <Button variant="primary" size="lg" loading={busy} onPress={onPay}>Pay {formatNaira(amount)}</Button>
      </View>
    </BottomSheet>
  );
}

export function PodCard({ pod }: { pod: ProofOfDelivery }) {
  const { theme } = useTheme();
  const [failed, setFailed] = useState(false);
  const loadable = /^(https?:|file:|data:|content:)/.test(pod.photoUrl || '');
  return (
    <Card elevation="sm">
      <View style={{ gap: 8 }}>
        {loadable && !failed ? (
          <Image
            source={{ uri: pod.photoUrl }}
            style={[styles.podPhoto, { backgroundColor: theme.roles.bgSecondary, borderColor: theme.roles.border }]}
            resizeMode="cover"
            onError={() => setFailed(true)}
            accessibilityLabel="Proof of delivery photo"
          />
        ) : (
          <View style={[styles.podPhoto, { backgroundColor: theme.roles.bgSecondary, borderColor: theme.roles.border }]}>
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
              {pod.photoUrl ? 'Delivery photo unavailable' : 'No delivery photo'}
            </Text>
          </View>
        )}
        <View style={styles.fareRow}>
          <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textSecondary }}>Received by</Text>
          <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{pod.recipientName}</Text>
        </View>
        <View style={styles.fareRow}>
          <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textSecondary }}>Delivered</Text>
          <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{formatDate(pod.createdAt)}</Text>
        </View>
        {pod.notes ? <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{pod.notes}</Text> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineGutter: { alignItems: 'center', width: 20 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3 },
  timelineLine: { width: 2, flex: 1, marginTop: 2 },
  timelineBody: { flex: 1, paddingTop: 0 },
  routeRow: { flexDirection: 'row', gap: 16 },
  routePoint: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  routeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  fareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  podPhoto: { height: 160, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
