import React, { useState } from 'react';
import { Keyboard, Alert } from 'react-native';
import { Screen, Text as TextComponent, Box, Button, Input, Card, Column, Row, Center, Avatar, Divider } from '@trustlink/shared';
import { theme } from '@trustlink/shared';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';

export function ProfileScreen() {
  const [user, setUser] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '080 1234 5678',
    role: 'customer',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await api.put('/users/profile', editForm);
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

  const menuItems = [
    { icon: 'person', label: 'My Profile', action: () => setIsEditing(true) },
    { icon: 'card', label: 'Payment Methods', action: () => {} },
    { icon: 'shield', label: 'Security', action: () => {} },
    { icon: 'notifications', label: 'Notifications', action: () => {} },
    { icon: 'help', label: 'Help & Support', action: () => {} },
    { icon: 'settings', label: 'Settings', action: () => {} },
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
              <TextComponent variant="body" color="gold">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</TextComponent>
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
                  <Row gap="md">
                    <Button variant="outline" size="md" onPress={() => { setIsEditing(false); setEditForm({ firstName: user.firstName, lastName: user.lastName, email: user.email }); }} style={{ flex: 1 }}>
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
              <Button variant="ghost" size="sm" onPress={() => setIsEditing(true)} style={{ marginTop: theme.spacing.md }}>
                <TextComponent variant="button" color="gold">Edit Profile</TextComponent>
              </Button>
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