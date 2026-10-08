import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, Button, BottomSheet, Text, Chip, Row, Column, Divider, Banner, SegmentedControl, StatusBadge } from '@trustlink/shared';
import type { ThemeMode, DeliveryStatus } from '@trustlink/shared';
import { useData } from '../data/DataContext';
import { useSession } from '../session/SessionContext';
import type { RootStackParamList } from '../navigation/types';

type CodeRow = { id: string; trackingNumber: string; status: DeliveryStatus; code: string };

interface DemoMenuApi {
  open: () => void;
  close: () => void;
}

const DemoMenuContext = createContext<DemoMenuApi | undefined>(undefined);

/** Demo menu provider — available in ALL builds (investor demos in Expo Go). */
export function DemoMenuProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const api = useMemo<DemoMenuApi>(() => ({ open: () => setVisible(true), close: () => setVisible(false) }), []);
  return (
    <DemoMenuContext.Provider value={api}>
      {children}
      <DemoMenu visible={visible} onClose={() => setVisible(false)} />
    </DemoMenuContext.Provider>
  );
}

export function useDemoMenu(): DemoMenuApi {
  const ctx = useContext(DemoMenuContext);
  if (!ctx) throw new Error('useDemoMenu must be used within a DemoMenuProvider');
  return ctx;
}

function DemoMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const data = useData();
  const demo = data.demo;
  const queryClient = useQueryClient();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { resetAll } = useSession();
  const { theme, mode, setMode } = useTheme();
  const [codes, setCodes] = useState<CodeRow[]>([]);

  const refresh = () => {
    setCodes(demo?.recipientCodes() ?? []);
    queryClient.invalidateQueries();
  };

  useEffect(() => {
    if (visible && demo) setCodes(demo.recipientCodes());
  }, [visible, demo]);

  if (!demo) {
    return (
      <BottomSheet visible={visible} title="Demo menu" onClose={onClose}>
        <Banner variant="warning" message="Demo controls require the mock data source (EXPO_PUBLIC_DATA_SOURCE=mock)." />
      </BottomSheet>
    );
  }

  const rows = codes;

  return (
    <BottomSheet visible={visible} title="Demo menu" onClose={onClose}>
      <Column gap="lg">
        <Column gap="sm">
          <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Scenario</Text>
          <Row gap="sm" style={{ flexWrap: 'wrap' }} justify="start">
            {demo.scenarios.map((s) => (
              <Chip key={s} label={s} selected={demo.scenario() === s} onPress={() => { demo.setScenario(s); refresh(); }} />
            ))}
          </Row>
        </Column>

        <Divider />

        <Column gap="sm">
          <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Advance delivery · recipient codes</Text>
          {rows.length === 0 ? (
            <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>No active deliveries.</Text>
          ) : (
            rows.map((r) => (
              <Row key={r.id} justify="space-between" align="center" gap="sm">
                <Column gap="xs">
                  <Row gap="sm" align="center">
                    <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{r.trackingNumber}</Text>
                    <StatusBadge status={r.status} />
                  </Row>
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Recipient code: {r.code}</Text>
                </Column>
                <Button variant="outline" size="sm" onPress={() => { demo.advance(r.id); refresh(); }}>Advance</Button>
              </Row>
            ))
          )}
        </Column>

        <Divider />

        <Column gap="sm">
          <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Theme</Text>
          <SegmentedControl<ThemeMode>
            value={mode}
            onChange={setMode}
            options={[{ label: 'System', value: 'system' }, { label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }]}
          />
        </Column>

        <Row gap="md">
          <Button variant="ghost" size="md" onPress={() => { demo.reset(); refresh(); }} style={{ flex: 1 }}>Reset data</Button>
          <Button variant="primary" size="md" onPress={onClose} style={{ flex: 1 }}>Close</Button>
        </Row>

        <Row gap="md">
          <Button variant="outline" size="md" onPress={() => demo.expireOtp()} style={{ flex: 1 }}>Expire OTP now</Button>
          <Button
            variant="outline"
            size="md"
            style={{ flex: 1 }}
            onPress={async () => {
              await resetAll();
              onClose();
              nav.navigate('Splash');
            }}
          >
            Reset session &amp; onboarding
          </Button>
        </Row>

        {__DEV__ ? (
          <Button variant="outline" size="md" onPress={() => { onClose(); nav.navigate('DesignGallery'); }}>
            Open Design Gallery
          </Button>
        ) : null}
      </Column>
    </BottomSheet>
  );
}
