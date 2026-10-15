import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, Screen, TopBar, Text, Button, Card, Column, Row, Badge, Divider, Avatar, ListItem, Dialog, Skeleton, ErrorState, type VehicleType } from '@trustlink/shared';
import { useMyProfile, useRiderProfile, useKycStatus } from '../hooks';
import { useSession } from '../session/SessionContext';
import type { ProfileStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

const VEHICLE_LABEL: Record<VehicleType, string> = { motorcycle: 'Motorcycle', van: 'Van', truck: 'Truck' };

export function ProfileScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { signOut } = useSession();
  const user = useMyProfile();
  const rider = useRiderProfile();
  const kyc = useKycStatus();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const kycStatus = kyc.data?.status ?? 'pending';
  const kycLabel = kycStatus === 'approved' ? 'Approved' : kycStatus === 'rejected' ? 'Rejected' : kyc.data?.submittedAt ? 'Under review' : 'Not started';
  const kycVariant = kycStatus === 'approved' ? 'success' : kycStatus === 'rejected' ? 'error' : 'warning';

  const name = `${user.data?.firstName ?? ''} ${user.data?.lastName ?? ''}`.trim();

  if (user.isLoading || rider.isLoading || kyc.isLoading) {
    return (
      <Screen>
        <TopBar title="Profile" />
        <Column gap="md" style={{ padding: 16 }}>
          <Skeleton height={96} />
          <Skeleton height={160} />
        </Column>
      </Screen>
    );
  }

  if (user.isError || rider.isError || kyc.isError) {
    return (
      <Screen>
        <TopBar title="Profile" />
        <Column style={{ padding: 16 }}>
          <ErrorState message="Couldn't load your profile." onAction={() => { user.refetch(); rider.refetch(); kyc.refetch(); }} />
        </Column>
      </Screen>
    );
  }

  const profile = rider.data;

  return (
    <Screen>
      <TopBar title="Profile" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card>
          <Row gap="md" align="center">
            <Avatar size="lg" name={name || 'Rider'} />
            <Column gap="xs" style={{ flex: 1 }}>
              <Text variant="h4" color="inherit" style={{ color: theme.roles.text }}>{name || 'Rider'}</Text>
              <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.textMuted }}>{user.data?.phone}</Text>
              {user.data?.email ? (
                <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>{user.data.email}</Text>
              ) : null}
              <Row gap="sm" align="center">
                <Badge variant={kycVariant}>{kycLabel}</Badge>
                <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
                  ★ {profile?.rating ? profile.rating.toFixed(1) : '—'} · {profile?.totalDeliveries ?? 0} deliveries
                </Text>
              </Row>
            </Column>
          </Row>
        </Card>

        <Column gap="sm">
          <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Verification</Text>
          <Card>
            <ListItem
              title="KYC verification"
              subtitle={kycStatus === 'rejected' ? 'Action needed — see the reason and resubmit' : kycLabel}
              right={<Badge variant={kycVariant}>{kycLabel}</Badge>}
              onPress={() => navigation.navigate('KycOverview')}
            />
          </Card>
        </Column>

        <Column gap="sm">
          <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Vehicle</Text>
          <Card>
            <Column gap="md">
              <Row justify="space-between" align="center">
                <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Type</Text>
                <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{profile ? VEHICLE_LABEL[profile.vehicleType as VehicleType] : '—'}</Text>
              </Row>
              <Row justify="space-between" align="center">
                <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Plate</Text>
                <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{profile?.vehiclePlate || 'Not set'}</Text>
              </Row>
              {profile?.vehicleModel ? (
                <Row justify="space-between" align="center">
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Model</Text>
                  <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{profile.vehicleModel}</Text>
                </Row>
              ) : null}
              {profile?.vehicleColor ? (
                <Row justify="space-between" align="center">
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Colour</Text>
                  <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{profile.vehicleColor}</Text>
                </Row>
              ) : null}
              {profile?.zone ? (
                <Row justify="space-between" align="center">
                  <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>Zone</Text>
                  <Text variant="bodySmall" color="inherit" style={{ color: theme.roles.text }}>{profile.zone}</Text>
                </Row>
              ) : null}
              <Button variant="outline" size="md" onPress={() => navigation.navigate('EditVehicle')}>Edit vehicle details</Button>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Text variant="label" color="inherit" style={{ color: theme.roles.textSecondary }}>Account</Text>
          <Card>
            <Column gap="sm">
              <ListItem title="Phone number" subtitle={`${user.data?.phone} · can't be changed here`} />
              <Divider />
              <ListItem title="Notifications" subtitle="In-app alerts while push is off (R1)" />
            </Column>
          </Card>
        </Column>

        <Divider />

        <Button variant="destructive" size="lg" onPress={() => setConfirmSignOut(true)}>Sign out</Button>

        <Row justify="center">
          <Text variant="caption" color="inherit" style={{ color: theme.roles.textMuted }}>
            TrustLink Rider · Secure. Swift. Strategic.
          </Text>
        </Row>
      </ScrollView>

      <Dialog
        visible={confirmSignOut}
        title="Sign out?"
        message="You'll need your phone number and a fresh code to sign back in."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        destructive
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          setConfirmSignOut(false);
          void signOut();
        }}
      />
    </Screen>
  );
}
