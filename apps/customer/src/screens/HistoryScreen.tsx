import React, { useState } from 'react';
import { Screen, Text as TextComponent, Box, Button, Card, Column, Row, Center, Avatar, Badge, Divider } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';

const mockHistory = [
  {
    id: 'TLK-2024-001',
    status: 'delivered',
    pickup: 'Wuse 2, Abuja',
    dropoff: 'Garki, Abuja',
    date: '2024-01-15',
    time: '10:45 AM',
    amount: 2500,
    riderName: 'Mike Johnson',
    proofOfDelivery: true,
  },
  {
    id: 'TLK-2024-002',
    status: 'delivered',
    pickup: 'Maitama, Abuja',
    dropoff: 'Asokoro, Abuja',
    date: '2024-01-12',
    time: '02:30 PM',
    amount: 3200,
    riderName: 'Sarah Williams',
    proofOfDelivery: true,
  },
  {
    id: 'TLK-2024-003',
    status: 'cancelled',
    pickup: 'Garki, Abuja',
    dropoff: 'Wuse 2, Abuja',
    date: '2024-01-10',
    time: '11:00 AM',
    amount: 0,
    riderName: '',
    proofOfDelivery: false,
  },
  {
    id: 'TLK-2024-004',
    status: 'delivered',
    pickup: 'Jabi, Abuja',
    dropoff: 'Utako, Abuja',
    date: '2024-01-08',
    time: '04:15 PM',
    amount: 1800,
    riderName: 'David Brown',
    proofOfDelivery: true,
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  delivered: { label: 'Delivered', color: theme.colors.statusDelivered },
  cancelled: { label: 'Cancelled', color: theme.colors.statusCancelled },
  returned: { label: 'Returned', color: theme.colors.statusReturned },
  failed: { label: 'Failed', color: theme.colors.statusFailed },
};

export function HistoryScreen() {
  const [filter, setFilter] = useState<'all' | 'delivered' | 'cancelled'>('all');

  const filteredHistory = filter === 'all' 
    ? mockHistory 
    : mockHistory.filter(d => d.status === filter);

  return (
    <Screen style={{ flex: 1 }}>
      <Column style={{ flex: 1, padding: theme.spacing.md }} gap="lg">
        <Row justify="space-between" align="center">
          <TextComponent variant="h2" color="textPrimary">Delivery History</TextComponent>
          <Button variant="ghost" size="sm" onPress={() => {}}>
            <Ionicons name="filter" size={20} color={theme.colors.navy} />
          </Button>
        </Row>

        <Row gap="sm" style={{ flexWrap: 'wrap' }}>
          {(['all', 'delivered', 'cancelled'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setFilter(f)}
            >
              <TextComponent variant="bodySmall" color={filter === f ? 'white' : 'textPrimary'} style={{ textTransform: 'capitalize' }}>
                {f}
              </TextComponent>
            </Button>
          ))}
        </Row>

        {filteredHistory.length === 0 ? (
          <Center style={{ flex: 1, padding: theme.spacing.xxl }}>
            <Column gap="md" align="center">
              <Ionicons name="time-outline" size={64} color={theme.colors.textTertiary} />
              <TextComponent variant="h4" color="textSecondary">No deliveries found</TextComponent>
              <TextComponent variant="body" color="textTertiary" style={{ textAlign: 'center' }}>
                {filter === 'all' ? 'Your delivery history will appear here' : `No ${filter} deliveries`}
              </TextComponent>
            </Column>
          </Center>
        ) : (
          <Column gap="md">
            {filteredHistory.map(delivery => (
              <HistoryCard key={delivery.id} delivery={delivery} />
            ))}
          </Column>
        )}
      </Column>
    </Screen>
  );
}

function HistoryCard({ delivery }: any) {
  const config = statusConfig[delivery.status];

  return (
    <Card onPress={() => {}}>
      <Column gap="md">
        <Row justify="space-between">
          <Row gap="sm" align="center">
            <TextComponent variant="h4" color="textPrimary" style={{ fontWeight: '600' }}>
              {delivery.id}
            </TextComponent>
            <Badge variant={getStatusVariant(delivery.status)} size="sm">
              {config.label}
            </Badge>
          </Row>
          <Column gap="xs" align="end">
            <TextComponent variant="bodySmall" color="textSecondary">{delivery.date}</TextComponent>
            <TextComponent variant="caption" color="textTertiary">{delivery.time}</TextComponent>
          </Column>
        </Row>

        <Divider />

        <Row gap="md">
          <Column gap="xs" style={{ flex: 1 }}>
            <Row gap="xs" align="center">
              <Ionicons name="location" size={14} color={theme.colors.textTertiary} />
              <TextComponent variant="bodySmall" color="textSecondary">Pickup</TextComponent>
            </Row>
            <TextComponent variant="body" color="textPrimary">{delivery.pickup}</TextComponent>
          </Column>
          <Column gap="xs" style={{ flex: 1 }}>
            <Row gap="xs" align="center">
              <Ionicons name="location" size={14} color={theme.colors.textTertiary} />
              <TextComponent variant="bodySmall" color="textSecondary">Drop-off</TextComponent>
            </Row>
            <TextComponent variant="body" color="textPrimary">{delivery.dropoff}</TextComponent>
          </Column>
        </Row>

        {delivery.riderName && (
          <Divider />
        )}

        {delivery.riderName && (
          <Row gap="md" align="center">
            <Avatar size="sm" name={delivery.riderName} />
            <Column gap="xs">
              <TextComponent variant="bodySmall" color="textSecondary">Rider</TextComponent>
              <TextComponent variant="body" color="textPrimary">{delivery.riderName}</TextComponent>
            </Column>
            <Box style={{ flex: 1 }} />
            <Column gap="xs" align="end">
              <TextComponent variant="bodySmall" color="textSecondary">Amount</TextComponent>
              <TextComponent variant="h4" color="navy" style={{ fontWeight: '700' }}>
                ₦{delivery.amount.toLocaleString()}
              </TextComponent>
            </Column>
          </Row>
        )}

        {!delivery.riderName && (
          <Divider />
        )}

        {!delivery.riderName && (
          <Row justify="space-between" align="center">
            <TextComponent variant="body" color="textSecondary">No rider assigned</TextComponent>
            <TextComponent variant="h4" color="navy" style={{ fontWeight: '700' }}>
              ₦{delivery.amount.toLocaleString()}
            </TextComponent>
          </Row>
        )}

        {delivery.proofOfDelivery && (
          <Divider />
        )}

        {delivery.proofOfDelivery && (
          <Button variant="ghost" size="sm" onPress={() => {}}>
            <Row gap="sm" align="center">
              <Ionicons name="document-text" size={18} color={theme.colors.navy} />
              <TextComponent variant="bodySmall" color="navy">View Proof of Delivery</TextComponent>
            </Row>
          </Button>
        )}
      </Column>
    </Card>
  );
}

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' {
  switch (status) {
    case 'delivered': return 'success';
    case 'cancelled': return 'error';
    case 'returned': return 'warning';
    case 'failed': return 'error';
    default: return 'default';
  }
}