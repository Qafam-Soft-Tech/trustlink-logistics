import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Screen, Text as TextComponent, Box, Button, Card, Column, Row, Center, Avatar, Badge, Divider } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';

const mockEarnings = [
  { id: 'TLK-2024-001', date: '2024-01-15', amount: 2500, status: 'paid' },
  { id: 'TLK-2024-002', date: '2024-01-15', amount: 3200, status: 'paid' },
  { id: 'TLK-2024-003', date: '2024-01-14', amount: 2800, status: 'paid' },
  { id: 'TLK-2024-004', date: '2024-01-14', amount: 1500, status: 'paid' },
  { id: 'TLK-2024-005', date: '2024-01-13', amount: 3000, status: 'pending' },
  { id: 'TLK-2024-006', date: '2024-01-13', amount: 2200, status: 'pending' },
];

export function EarningsScreen() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const handleWithdraw = async () => {
    try {
      const response = await api.post('/rider/earnings/withdraw');
      console.log('Withdrawal initiated:', response.data);
      Alert.alert('Success', 'Withdrawal initiated. Funds will be transferred to your bank account within 24 hours.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to initiate withdrawal');
    }
  };

  const todayTotal = mockEarnings.filter(e => e.date === '2024-01-15').reduce((sum, e) => sum + e.amount, 0);
  const weekTotal = mockEarnings.filter(e => ['2024-01-15', '2024-01-14', '2024-01-13'].includes(e.date)).reduce((sum, e) => sum + e.amount, 0);
  const monthTotal = mockEarnings.reduce((sum, e) => sum + e.amount, 0);

  const totals = { today: todayTotal, week: weekTotal, month: monthTotal };

  return (
    <Screen style={{ flex: 1 }}>
      <Column style={{ flex: 1, padding: theme.spacing.md }} gap="lg">
        <TextComponent variant="h2" color="textPrimary">Earnings</TextComponent>

        <Card>
          <Column gap="md">
            <Row justify="space-between" align="center">
              <TextComponent variant="h4" color="textPrimary">Total Earnings</TextComponent>
              <Row gap="sm">
                {(['today', 'week', 'month'] as const).map(p => (
                  <Button
                    key={p}
                    variant={period === p ? 'primary' : 'ghost'}
                    size="sm"
                    onPress={() => setPeriod(p)}
                  >
                    <TextComponent variant="bodySmall" color={period === p ? 'white' : 'textPrimary'} style={{ textTransform: 'capitalize' }}>
                      {p}
                    </TextComponent>
                  </Button>
                ))}
              </Row>
            </Row>
            <TextComponent variant="h1" color="navy" style={{ fontWeight: '700' }}>
              ₦{totals[period].toLocaleString()}
            </TextComponent>
            <TextComponent variant="bodySmall" color="textSecondary">
              {period === 'today' ? 'Today' : period === 'week' ? 'This week' : 'This month'}
            </TextComponent>
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <TextComponent variant="h4" color="textPrimary">Breakdown</TextComponent>
            <Row gap="md">
              <StatCard label="Completed Jobs" value="24" icon="checkmark-circle" color={theme.colors.success} />
              <StatCard label="Pending" value="2" icon="time" color={theme.colors.warning} />
              <StatCard label="Cancelled" value="1" icon="close-circle" color={theme.colors.error} />
            </Row>
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <Row justify="space-between">
              <TextComponent variant="h4" color="textPrimary">Recent Earnings</TextComponent>
              <Button variant="ghost" size="sm" onPress={() => {}}>
                View All
              </Button>
            </Row>
            <Column gap={0}>
              {mockEarnings.slice(0, 5).map(earning => (
                <EarningRow key={earning.id} earning={earning} />
              ))}
            </Column>
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <TextComponent variant="h4" color="textPrimary">Withdraw</TextComponent>
            <Row gap="md" align="center">
              <Column gap="xs" style={{ flex: 1, alignItems: 'center', paddingVertical: theme.spacing.lg, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md }}>
                <Ionicons name="wallet" size={28} color={theme.colors.navy} />
                <TextComponent variant="bodySmall" color="textSecondary">Available Balance</TextComponent>
                <TextComponent variant="h3" color="navy" style={{ fontWeight: '700' }}>₦{totals.month.toLocaleString()}</TextComponent>
              </Column>
            </Row>
            <Button variant="primary" size="lg" onPress={handleWithdraw}>
              Withdraw Earnings
            </Button>
          </Column>
        </Card>
      </Column>
    </Screen>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <Column gap="xs" style={{ flex: 1, alignItems: 'center', paddingVertical: theme.spacing.md }}>
      <Box style={{ width: 48, height: 48, borderRadius: theme.borderRadius.md, backgroundColor: color + '20', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={icon} size={24} color={color} />
      </Box>
      <TextComponent variant="h4" color="textPrimary" style={{ fontWeight: '700' }}>{value}</TextComponent>
      <TextComponent variant="caption" color="textSecondary">{label}</TextComponent>
    </Column>
  );
}

function EarningRow({ earning }: any) {
  const statusConfig = {
    paid: { color: theme.colors.success, label: 'Paid' },
    pending: { color: theme.colors.warning, label: 'Pending' },
  };
  const config = statusConfig[earning.status as keyof typeof statusConfig];

  return (
    <Box style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.sm }}>
      <Row gap="md" align="center">
        <TextComponent variant="body" color="textPrimary" style={{ fontWeight: '500' }}>{earning.id}</TextComponent>
        <Badge variant={earning.status === 'paid' ? 'success' : 'warning'} size="xs">{config.label}</Badge>
      </Row>
      <Column gap="xs" align="end">
        <TextComponent variant="h4" color="navy" style={{ fontWeight: '700' }}>₦{earning.amount.toLocaleString()}</TextComponent>
        <TextComponent variant="caption" color="textTertiary">{earning.date}</TextComponent>
      </Column>
    </Box>
  );
}