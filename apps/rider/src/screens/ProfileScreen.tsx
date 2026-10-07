import React, { useState, useEffect } from 'react';
import { Keyboard, Alert } from 'react-native';
import { Screen, Text as TextComponent, Box, Button, Input, Card, Column, Row, Center, Avatar, Divider, Badge } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';

export function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState({
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike@example.com',
    phone: '080 1111 2222',
    role: 'rider',
    vehicleType: 'motorcycle',
    vehiclePlate: 'ABC 123 XY',
    kycStatus: 'approved',
    zone: 'Wuse',
    vehicleModel: '',
    vehicleColor: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike@example.com',
    vehicleType: 'motorcycle',
    vehiclePlate: 'ABC 123 XY',
    vehicleModel: '',
    vehicleColor: '',
    zone: 'Wuse',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const vehicleTypes = [
    { value: 'motorcycle', label: 'Motorcycle', icon: 'bicycle' },
    { value: 'van', label: 'Van', icon: 'car' },
    { value: 'truck', label: 'Truck', icon: 'bus' },
  ] as const;

const fetchProfile = async () => {
    try {
      const response = await api.get('/rider/profile');
      const profile = response.data;
      setUser((prev: any) => ({
        ...prev,
        vehicleType: profile.vehicleType || 'motorcycle',
        vehiclePlate: profile.vehiclePlate || '',
        vehicleModel: profile.vehicleModel || '',
        vehicleColor: profile.vehicleColor || '',
        zone: profile.zone || 'Wuse',
      }));
      setEditForm((prev: any) => ({
        ...prev,
        vehicleType: profile.vehicleType || 'motorcycle',
        vehiclePlate: profile.vehiclePlate || '',
        vehicleModel: profile.vehicleModel || '',
        vehicleColor: profile.vehicleColor || '',
        zone: profile.zone || 'Wuse',
      }));
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await api.put('/rider/profile', editForm);
      console.log('Profile saved:', response.data);
      setUser(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const kycStatusConfig = {
    approved: { color: theme.colors.success, label: 'Approved', variant: 'success' as const },
    pending: { color: theme.colors.warning, label: 'Pending Review', variant: 'warning' as const },
    rejected: { color: theme.colors.error, label: 'Rejected', variant: 'error' as const },
  };
  const kycConfig = kycStatusConfig[user.kycStatus as keyof typeof kycStatusConfig];

  const menuItems = [
    { icon: 'person', label: 'My Profile', action: () => setIsEditing(true) },
    { icon: 'shield', label: 'KYC Verification', action: () => navigation.navigate('Kyc') },
    { icon: 'card', label: 'Payment Details', action: () => {} },
    { icon: 'settings', label: 'Settings', action: () => {} },
    { icon: 'help', label: 'Help & Support', action: () => {} },
    { icon: 'log-out', label: 'Logout', variant: 'danger', action: () => Alert.alert('Logout', 'Are you sure you want to logout?') },
  ];

  return (
    <Screen style={{ flex: 1 }}>
      <Column style={{ flex: 1 }} gap="lg">
        <Box style={{ padding: theme.spacing.lg, backgroundColor: theme.colors.navy }}>
          <Column gap="md" align="center">
            <Avatar size="xl" name={`${user.firstName} ${user.lastName}`} />
            <Column gap="xs" align="center">
              <TextComponent variant="h2" color="white">{user.firstName} {user.lastName}</TextComponent>
              <TextComponent variant="body" color="gold">Rider</TextComponent>
              <Row gap="sm" align="center" style={{ marginTop: theme.spacing.sm }}>
                <Badge variant={kycConfig.variant} size="sm">
                  <Row gap="xs" align="center">
                    <Ionicons name={kycConfig.label === 'Approved' ? 'checkmark-circle' : kycConfig.label === 'Pending Review' ? 'time' : 'close-circle'} size={12} color="white" />
                    <TextComponent variant="caption" color="white">{kycConfig.label}</TextComponent>
                  </Row>
                </Badge>
                <TextComponent variant="bodySmall" color="gold">⭐ 4.9</TextComponent>
              </Row>
            </Column>
            {isEditing && (
              <Card style={{ padding: theme.spacing.md, width: '100%', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <Column gap="md">
                  <Input
                    label="First Name"
                    value={editForm.firstName}
                    onChangeText={v => setEditForm(prev => ({ ...prev, firstName: v }))}
                    leftIcon={<Ionicons name="person" size={24} color={theme.colors.gold} />}
                  />
                  <Input
                    label="Last Name"
                    value={editForm.lastName}
                    onChangeText={v => setEditForm(prev => ({ ...prev, lastName: v }))}
                    leftIcon={<Ionicons name="person" size={24} color={theme.colors.gold} />}
                  />
                  <Input
                    label="Email"
                    value={editForm.email}
                    onChangeText={v => setEditForm(prev => ({ ...prev, email: v }))}
                    keyboardType="email-address"
                    leftIcon={<Ionicons name="mail" size={24} color={theme.colors.gold} />}
                  />
                  <Divider label="Vehicle Information" />
                  <Column gap="md">
                    <TextComponent variant="bodySmall" color="gold">Vehicle Type</TextComponent>
                    <Row gap="sm">
                      {vehicleTypes.map(vt => (
                        <Button
                          key={vt.value}
                          variant={editForm.vehicleType === vt.value ? 'primary' : 'outline'}
                          size="md"
                          onPress={() => setEditForm(prev => ({ ...prev, vehicleType: vt.value }))}
                          style={{ flex: 1 }}
                          leftIcon={<Ionicons name={vt.icon} size={20} color={editForm.vehicleType === vt.value ? theme.colors.white : theme.colors.gold} />}
                        >
                          <TextComponent variant="bodySmall" color={editForm.vehicleType === vt.value ? 'white' : 'gold'}>{vt.label}</TextComponent>
                        </Button>
                      ))}
                    </Row>
                  </Column>
                  <Input
                    label="Vehicle Plate"
                    value={editForm.vehiclePlate}
                    onChangeText={v => setEditForm(prev => ({ ...prev, vehiclePlate: v }))}
                    autoCapitalize="characters"
                    leftIcon={<Ionicons name="card" size={24} color={theme.colors.gold} />}
                  />
                  <Input
                    label="Vehicle Model"
                    value={editForm.vehicleModel}
                    onChangeText={v => setEditForm(prev => ({ ...prev, vehicleModel: v }))}
                    leftIcon={<Ionicons name="car" size={24} color={theme.colors.gold} />}
                  />
                  <Input
                    label="Vehicle Color"
                    value={editForm.vehicleColor}
                    onChangeText={v => setEditForm(prev => ({ ...prev, vehicleColor: v }))}
                    leftIcon={<Ionicons name="color-palette" size={24} color={theme.colors.gold} />}
                  />
                  <Input
                    label="Service Zone"
                    value={editForm.zone}
                    onChangeText={v => setEditForm(prev => ({ ...prev, zone: v }))}
                    leftIcon={<Ionicons name="map" size={24} color={theme.colors.gold} />}
                  />
                  <Row gap="md">
                    <Button variant="outline" size="md" onPress={() => { setIsEditing(false); setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, vehicleType: user.vehicleType, vehiclePlate: user.vehiclePlate, vehicleModel: user.vehicleModel, vehicleColor: user.vehicleColor, zone: user.zone }); }} style={{ flex: 1 }}>
                      Cancel
                    </Button>
                    <Button variant="secondary" size="md" loading={isLoading} onPress={handleSave} style={{ flex: 1 }}>
                      Save
                    </Button>
                  </Row>
                </Column>
              </Card>
            )}
            {!isEditing && (
              <>
                <Card style={{ marginTop: theme.spacing.md, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Column gap="sm">
                    <Row gap="sm" align="center">
                      <Ionicons name="car" size={20} color={theme.colors.gold} />
                      <TextComponent variant="bodySmall" color="gold">Vehicle Type</TextComponent>
                      <TextComponent variant="body" color="white" style={{ fontWeight: '600' }}>
                        {user.vehicleType === 'motorcycle' ? 'Motorcycle' : user.vehicleType === 'van' ? 'Van' : 'Truck'}
                      </TextComponent>
                    </Row>
                    <Row gap="sm" align="center">
                      <Ionicons name="card" size={20} color={theme.colors.gold} />
                      <TextComponent variant="bodySmall" color="gold">Plate</TextComponent>
                      <TextComponent variant="body" color="white" style={{ fontWeight: '600' }}>
                        {user.vehiclePlate || 'Not set'}
                      </TextComponent>
                    </Row>
                    {user.vehicleModel && (
                      <Row gap="sm" align="center">
                        <Ionicons name="car" size={20} color={theme.colors.gold} />
                        <TextComponent variant="bodySmall" color="gold">Model</TextComponent>
                        <TextComponent variant="body" color="white" style={{ fontWeight: '600' }}>
                          {user.vehicleModel}
                        </TextComponent>
                      </Row>
                    )}
                    {user.vehicleColor && (
                      <Row gap="sm" align="center">
                        <Ionicons name="color-palette" size={20} color={theme.colors.gold} />
                        <TextComponent variant="bodySmall" color="gold">Color</TextComponent>
                        <TextComponent variant="body" color="white" style={{ fontWeight: '600' }}>
                          {user.vehicleColor}
                        </TextComponent>
                      </Row>
                    )}
                    {user.zone && (
                      <Row gap="sm" align="center">
                        <Ionicons name="map" size={20} color={theme.colors.gold} />
                        <TextComponent variant="bodySmall" color="gold">Service Zone</TextComponent>
                        <TextComponent variant="body" color="white" style={{ fontWeight: '600' }}>
                          {user.zone}
                        </TextComponent>
                      </Row>
                    )}
                  </Column>
                </Card>
                <Button variant="ghost" size="sm" onPress={() => setIsEditing(true)} style={{ marginTop: theme.spacing.md }}>
                  <TextComponent variant="button" color="gold">Edit Profile</TextComponent>
                </Button>
              </>
            )}
          </Column>
        </Box>

        <Column style={{ padding: theme.spacing.md, flex: 1 }} gap="md">
          <TextComponent variant="h4" color="textPrimary" style={{ marginLeft: theme.spacing.md }}>Account</TextComponent>
          <Column gap={0}>
            {menuItems.map((item, index) => (
              <MenuItem key={item.label} {...item} isLast={index === menuItems.length - 1} />
            ))}
          </Column>

          <Divider label="App Info" style={{ marginTop: theme.spacing.lg }} />
          <Card style={{ padding: theme.spacing.md }}>
            <Row justify="space-between">
              <Column gap="xs">
                <TextComponent variant="bodySmall" color="textSecondary">Version</TextComponent>
                <TextComponent variant="body" color="textPrimary">1.0.0</TextComponent>
              </Column>
              <Column gap="xs" align="end">
                <TextComponent variant="bodySmall" color="textSecondary">Build</TextComponent>
                <TextComponent variant="body" color="textPrimary">2024.01.15</TextComponent>
              </Column>
            </Row>
          </Card>

          <Center style={{ padding: theme.spacing.lg }}>
            <TextComponent variant="caption" color="textTertiary">
              TrustLink Logistics — Secure. Swift. Strategic.
            </TextComponent>
          </Center>
        </Column>
      </Column>
    </Screen>
  );
}

function MenuItem({ icon, label, variant = 'default', action, isLast }: any) {
  return (
    <Card style={{ padding: theme.spacing.md, marginHorizontal: theme.spacing.md }}>
      <Button
        variant="ghost"
        onPress={action}
        style={{ padding: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Row gap="md" align="center">
          <Box style={{ width: 40, height: 40, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.gray100, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name={icon} size={22} color={variant === 'danger' ? theme.colors.error : theme.colors.navy} />
          </Box>
          <TextComponent variant="body" color={variant === 'danger' ? 'error' : 'textPrimary'}>
            {label}
          </TextComponent>
        </Row>
        <Ionicons name="chevron-forward" size={22} color={theme.colors.textTertiary} />
      </Button>
      {!isLast && <Divider />}
    </Card>
  );
}