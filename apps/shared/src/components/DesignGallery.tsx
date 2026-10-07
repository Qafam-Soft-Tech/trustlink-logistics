import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { ThemeMode } from '../theme';
import { Text, Button, Input, Card, Avatar, Badge, Chip, Box } from './primitives';
import { Screen, Divider, Row, Column, Header } from './layout';
import { Skeleton, Banner, Toast, Dialog, EmptyState, ErrorState, SuccessState, BottomSheet } from './feedback';
import { SegmentedControl, PhoneInput, OtpInput, TextArea, SelectTrigger } from './forms';
import { ListItem } from './list';
import { StatusBadge, StatusTimeline, RouteSummaryCard, FareBreakdownCard, CheckoutSheet, PodCard } from './domain';
import { calculateFare, DEFAULT_PRICING } from '../domain/fare';
import { formatNaira } from '../formatters';
import type { DeliveryStatus, PaymentProvider } from '../domain/types';
import { DEMO_DELIVERIES } from '../mocks/fixtures';

const ALL_STATUSES: DeliveryStatus[] = ['requested', 'searching', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned', 'cancelled'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{title}</Text>
      {children}
      <Divider />
    </View>
  );
}

/**
 * Dev-only Design Gallery. Shows every component, variant and state in both themes.
 * Reached only from the dev menu (see app navigator, gated by __DEV__).
 */
export function DesignGallery({ onBack }: { onBack?: () => void }) {
  const { theme, mode, resolvedMode, setMode } = useTheme();
  const [showDialog, setShowDialog] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [provider, setProvider] = useState<PaymentProvider>('paystack');
  const [otp, setOtp] = useState('48');
  const [phone, setPhone] = useState('');
  const [text, setText] = useState('');
  const [segment, setSegment] = useState<'a' | 'b'>('a');

  const sample = DEMO_DELIVERIES[9];
  const fare = calculateFare(DEFAULT_PRICING, { distanceKm: 4, weightKg: 2, packageType: 'parcel' });
  const pod = { id: 'pod-1', deliveryId: sample.id, photoUrl: 'file://proof.jpg', recipientOtp: '482913', recipientName: sample.recipientName, recipientPhone: sample.recipientPhone, notes: 'Left with security', createdAt: new Date().toISOString() };

  return (
    <Screen>
      <Header title={`Design Gallery · ${resolvedMode}`} showBack onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ gap: 24 }}>
          <Section title="Theme">
            <SegmentedControl<ThemeMode>
              value={mode}
              onChange={setMode}
              options={[{ label: 'System', value: 'system' }, { label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }]}
            />
            <Row gap="sm" style={{ flexWrap: 'wrap' }}>
              <Swatch label="bg" color={theme.roles.bg} />
              <Swatch label="surface" color={theme.roles.surface} />
              <Swatch label="primary" color={theme.roles.primaryAction} />
              <Swatch label="accent" color={theme.roles.accent} />
              <Swatch label="danger" color={theme.roles.danger} />
            </Row>
          </Section>

          <Section title="Typography">
            <Text variant="h1" color="inherit">Heading 1</Text>
            <Text variant="h2" color="inherit">Heading 2</Text>
            <Text variant="h3" color="inherit">Heading 3</Text>
            <Text variant="h4" color="inherit">Heading 4</Text>
            <Text variant="body" color="inherit">Body — {formatNaira(1400)} renders naira</Text>
            <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textSecondary }}>Body small / secondary</Text>
            <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Caption / muted (accessible)</Text>
          </Section>

          <Section title="Buttons">
            {(['primary', 'accent', 'secondary', 'outline', 'ghost', 'destructive'] as const).map((v) => (
              <Row key={v} gap="sm" style={{ flexWrap: 'wrap' }}>
                <Button variant={v} size="sm">Small</Button>
                <Button variant={v} size="md">Medium</Button>
                <Button variant={v} size="lg">Large</Button>
              </Row>
            ))}
            <Row gap="sm">
              <Button variant="primary" loading>Loading</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </Row>
          </Section>

          <Section title="Inputs">
            <Input label="Text input" placeholder="Enter value" />
            <PhoneInput value={phone} onChangeText={setPhone} />
            <OtpInput value={otp} onChange={setOtp} />
            <TextArea label="Textarea" value={text} onChangeText={setText} placeholder="Notes…" />
            <SelectTrigger label="Select" value="Parcel" onPress={() => {}} />
            <SegmentedControl<'a' | 'b'> value={segment} onChange={setSegment} options={[{ label: 'Option A', value: 'a' }, { label: 'Option B', value: 'b' }]} />
          </Section>

          <Section title="Badges & chips">
            <Row gap="sm" style={{ flexWrap: 'wrap' }}>
              {(['default', 'success', 'warning', 'error', 'info', 'primary'] as const).map((v) => (
                <Badge key={v} variant={v}>{v}</Badge>
              ))}
            </Row>
            <Row gap="sm" style={{ flexWrap: 'wrap' }}>
              <Chip label="Selected" selected onPress={() => {}} />
              <Chip label="Unselected" onPress={() => {}} />
            </Row>
          </Section>

          <Section title="Status badges">
            <Row gap="sm" style={{ flexWrap: 'wrap' }}>
              {ALL_STATUSES.map((s) => <StatusBadge key={s} status={s} />)}
            </Row>
          </Section>

          <Section title="Cards, list, avatar">
            <Card><Text variant="body" color="inherit">Card content</Text></Card>
            <Card onPress={() => {}}><Text variant="body" color="inherit">Pressable card</Text></Card>
            <ListItem title="Amina Bello" subtitle="0803 123 4567" left={<Avatar size="sm" name="Amina Bello" />} right={<Badge variant="success">Active</Badge>} onPress={() => {}} />
            <Row gap="sm" align="center"><Avatar size="xs" name="A B" /><Avatar size="sm" name="C D" /><Avatar size="md" name="E F" /><Avatar size="lg" name="G H" /><Avatar size="xl" name="I J" /></Row>
          </Section>

          <Section title="Feedback">
            <Banner variant="info" message="Info banner" />
            <Banner variant="success" message="Success banner" />
            <Banner variant="warning" message="Warning banner" />
            <Banner variant="error" message="Error banner" />
            <Banner variant="offline" message="You are offline" />
            <Toast visible message="Toast message" onDismiss={() => {}} />
            <Skeleton />
            <Skeleton width="60%" />
            <Row gap="sm"><Button variant="outline" size="sm" onPress={() => setShowDialog(true)}>Open dialog</Button><Button variant="outline" size="sm" onPress={() => setShowSheet(true)}>Open sheet</Button><Button variant="outline" size="sm" onPress={() => setShowCheckout(true)}>Open checkout</Button></Row>
          </Section>

          <Section title="States">
            <EmptyState title="Nothing here yet" message="Your deliveries will appear here." actionLabel="Send a package" onAction={() => {}} />
            <ErrorState message="Couldn't load data." onAction={() => {}} />
            <SuccessState title="Delivered" message="Package delivered successfully." />
          </Section>

          <Section title="Domain components">
            <StatusTimeline events={sample.events ?? []} />
            <RouteSummaryCard pickupArea={sample.pickupArea ?? 'Wuse 2'} dropoffArea={sample.dropoffArea ?? 'Garki'} distanceKm={4.2} etaMinutes={14} />
            <FareBreakdownCard breakdown={fare} />
            <PodCard pod={pod} />
          </Section>
        </View>
      </ScrollView>

      <Dialog visible={showDialog} title="Confirm action" message="This uses the design-system Dialog." onConfirm={() => setShowDialog(false)} onCancel={() => setShowDialog(false)} />
      <BottomSheet visible={showSheet} title="Bottom sheet" onClose={() => setShowSheet(false)}>
        <Text variant="body" color="inherit">Sheet content</Text>
      </BottomSheet>
      <CheckoutSheet visible={showCheckout} amount={1400} provider={provider} onProviderChange={setProvider} onPay={() => setShowCheckout(false)} onClose={() => setShowCheckout(false)} />
    </Screen>
  );
}

function Swatch({ label, color }: { label: string; color: string }) {
  const { theme } = useTheme();
  return (
    <Box style={{ alignItems: 'center', gap: 4 }}>
      <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: color, borderWidth: 1, borderColor: theme.roles.border }} />
      <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{label}</Text>
    </Box>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
});
