import React, { useState, useEffect } from 'react';
import { Screen, Text as TextComponent, Box, Button, Card, Column, Row, Center, Avatar, Badge, Divider } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';

export function HomeScreen({ navigation }: any) {
  const [isOnline, setIsOnline] = useState(false);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRiderData = async () => {
    try {
      const [profileRes, earningsRes] = await Promise.all([
        api.get('/rider/profile'),
        api.get('/rider/earnings'), // assuming this endpoint exists
      ]);
      
      setIsOnline(profileRes.data.status === 'online');
      setTodayEarnings(earningsRes.data?.todayTotal || 12500);
      setTodayDeliveries(earningsRes.data?.todayDeliveries || 8);
      setRating(profileRes.data.rating || 4.9);
    } catch (error) {
      console.error('Failed to fetch rider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const response = await api.put('/rider/profile/status');
      setIsOnline(response.data.status === 'online');
    } catch (error) {
      console.error('Failed to toggle online status:', error);
    }
  };

  useEffect(() => {
    fetchRiderData();
  }, []);

  if (loading) {
    return (
      <Screen style={{ flex: 1 }}>
        <Center style={{ flex: 1 }}>
          <Ionicons name="sync" size={48} color={theme.colors.navy} />
        </Center>
      </Screen>
    );
  }

  return (
    <Screen style={{ flex: 1 }}>
      <Column style={{ flex: 1, padding: theme.spacing.md }} gap="lg">
        <Row justify="space-between" align="center">
          <Column gap="xs">
            <TextComponent variant="h2" color="textPrimary">
              Good morning, Mike
            </TextComponent>
            <TextComponent variant="bodySmall" color="textSecondary">
              Ready to earn today?
            </TextComponent>
          </Column>
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <Box style={{ width: 12, height: 12, borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.success }} />
            <TextComponent variant="bodySmall" color="success" style={{ fontWeight: '600' }}>Online</TextComponent>
          </Box>
        </Row>

        <Card>
          <Column gap="md">
            <Row justify="space-between" align="center">
              <TextComponent variant="h4" color="textPrimary">Today's Earnings</TextComponent>
              <Button variant="ghost" size="sm" onPress={() => navigation.navigate('Earnings')}>
                Details
              </Button>
            </Row>
            <TextComponent variant="h2" color="navy" style={{ fontWeight: '700' }}>
              ₦{todayEarnings.toLocaleString()}
            </TextComponent>
            <Row gap="xl">
              <StatItem label="Deliveries" value={todayDeliveries} />
              <StatItem label="Rating" value={rating} />
              <StatItem label="Online" value="6h 32m" />
            </Row>
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <Row justify="space-between">
              <TextComponent variant="h4" color="textPrimary">Quick Actions</TextComponent>
            </Row>
            <Row gap="md">
              <QuickActionButton
                icon={isOnline ? 'toggle' : 'toggle-outline'}
                label={isOnline ? 'Go Offline' : 'Go Online'}
                color={isOnline ? theme.colors.warning : theme.colors.success}
                onPress={toggleOnlineStatus}
              />
              <QuickActionButton
                icon="navigate"
                label="Navigation"
                color={theme.colors.info}
                onPress={() => {}}
              />
              <QuickActionButton
                icon="document-text"
                label="KYC Status"
                color={theme.colors.navy}
                onPress={() => navigation.navigate('Kyc')}
              />
            </Row>
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <Row justify="space-between">
              <TextComponent variant="h4" color="textPrimary">Available Jobs</TextComponent>
              <Button variant="ghost" size="sm" onPress={() => navigation.navigate('Jobs')}>
                View All
              </Button>
            </Row>
            <Column gap="sm">
              <JobCard
                id="TLK-2024-003"
                pickup="Wuse 2, Abuja"
                dropoff="Garki, Abuja"
                distance="3.2 km"
                fare={2500}
                packageType="Document"
                timeLeft="2 min"
              />
              <JobCard
                id="TLK-2024-004"
                pickup="Maitama, Abuja"
                dropoff="Asokoro, Abuja"
                distance="5.1 km"
                fare={3200}
                packageType="Parcel"
                timeLeft="5 min"
              />
            </Column>
          </Column>
        </Card>

        <Card>
          <Column gap="md">
            <TextComponent variant="h4" color="textPrimary">Active Delivery</TextComponent>
            <ActiveDeliveryCard
              id="TLK-2024-001"
              status="in_transit"
              pickup="Wuse 2, Abuja"
              dropoff="Garki, Abuja"
              recipientName="John Doe"
              recipientPhone="080 1234 5678"
            />
          </Column>
        </Card>
      </Column>
    </Screen>
  );
}

function StatItem({ label, value }: any) {
  return (
    <Column gap="xs" style={{ flex: 1, alignItems: 'center' }}>
      <TextComponent variant="h4" color="navy" style={{ fontWeight: '700' }}>{value}</TextComponent>
      <TextComponent variant="caption" color="textSecondary">{label}</TextComponent>
    </Column>
  );
}

function QuickActionButton({ icon, label, color, onPress }: any) {
  return (
    <Button
      variant="outline"
      size="md"
      onPress={onPress}
      style={{ flex: 1, paddingVertical: theme.spacing.lg }}
      leftIcon={<Ionicons name={icon} size={24} color={color} />}
    >
      <TextComponent variant="bodySmall" color={color as any} style={{ textAlign: 'center' }}>
        {label}
      </TextComponent>
    </Button>
  );
}

function JobCard({ id, pickup, dropoff, distance, fare, packageType, timeLeft }: any) {
  return (
    <Button
      variant="outline"
      size="md"
      onPress={() => {}}
      style={{ padding: theme.spacing.md, flexDirection: 'row', justifyContent: 'space-between' }}
    >
      <Column gap="xs" style={{ flex: 1 }}>
        <Row gap="sm" align="center">
          <TextComponent variant="body" color="textPrimary" style={{ fontWeight: '600' }}>
            {id}
          </TextComponent>
          <Badge variant="info" size="sm">{packageType}</Badge>
        </Row>
        <Row gap="md">
          <TextComponent variant="caption" color="textSecondary">{pickup} → {dropoff}</TextComponent>
        </Row>
      </Column>
      <Column gap="xs" align="end">
        <TextComponent variant="h4" color="navy" style={{ fontWeight: '700' }}>₦{fare.toLocaleString()}</TextComponent>
        <Row gap="xs" align="center">
          <Ionicons name="time" size={12} color={theme.colors.warning} />
          <TextComponent variant="caption" color="warning" style={{ fontWeight: '600' }}>{timeLeft}</TextComponent>
        </Row>
        <TextComponent variant="caption" color="textTertiary">{distance}</TextComponent>
      </Column>
    </Button>
  );
}

function ActiveDeliveryCard({ id, status, pickup, dropoff, recipientName, recipientPhone }: any) {
  const statusConfig = {
    in_transit: { color: theme.colors.statusInTransit, label: 'In Transit', icon: 'bicycle' },
    picked_up: { color: theme.colors.statusPickedUp, label: 'Picked Up', icon: 'package' },
    assigned: { color: theme.colors.statusAssigned, label: 'Assigned', icon: 'person' },
  };
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.in_transit;

  return (
    <Box style={{ padding: theme.spacing.md, backgroundColor: theme.colors.backgroundSecondary, borderRadius: theme.borderRadius.md }}>
      <Row justify="space-between">
        <Column gap="xs">
          <Row gap="sm" align="center">
            <TextComponent variant="body" color="textPrimary" style={{ fontWeight: '600' }}>
              {id}
            </TextComponent>
            <Badge variant="info" size="sm">{config.label}</Badge>
          </Row>
          <Row gap="md">
            <TextComponent variant="caption" color="textSecondary">{pickup} → {dropoff}</TextComponent>
          </Row>
        </Column>
      </Row>
      <Divider />
      <Row gap="md" align="center">
        <Column gap="xs" style={{ flex: 1 }}>
          <Row gap="xs" align="center">
            <Ionicons name="person" size={16} color={theme.colors.textTertiary} />
            <TextComponent variant="bodySmall" color="textSecondary">Recipient</TextComponent>
          </Row>
          <TextComponent variant="body" color="textPrimary">{recipientName}</TextComponent>
        </Column>
        <Column gap="xs" style={{ flex: 1 }}>
          <Row gap="xs" align="center">
            <Ionicons name="call" size={16} color={theme.colors.textTertiary} />
            <TextComponent variant="bodySmall" color="textSecondary">Contact</TextComponent>
          </Row>
          <Button variant="outline" size="sm" onPress={() => {}}>
            <Ionicons name="call" size={18} color={theme.colors.navy} />
          </Button>
        </Column>
      </Row>
      <Divider />
      <Row gap="md">
        <Button variant="secondary" size="md" onPress={() => {}} style={{ flex: 1 }}>
          Mark Picked Up
        </Button>
        <Button variant="primary" size="md" onPress={() => {}} style={{ flex: 1 }}>
          Mark Delivered
        </Button>
      </Row>
    </Box>
  );
}