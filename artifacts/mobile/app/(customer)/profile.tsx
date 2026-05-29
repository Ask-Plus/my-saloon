import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetAppointments } from '@workspace/api-client-react';

export default function CustomerProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const { data: appointments = [] } = useGetAppointments(
    user?.id ? { customerId: user.id } : undefined,
    { query: { enabled: !!user?.id } },
  );

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: appointments.length,
      upcoming: appointments.filter((a) => a.date >= today && a.status !== 'cancelled').length,
      spent: appointments.filter((a) => a.paymentStatus === 'paid').reduce((sum, a) => sum + a.servicePrice, 0),
    };
  }, [appointments]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = Platform.OS === 'android'
    ? insets.bottom + 16
    : insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 72;

  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() ?? '?';

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPad + 24, paddingHorizontal: 20, paddingBottom: 28,
      alignItems: 'center', backgroundColor: colors.primary,
    },
    avatar: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', marginBottom: 12,
    },
    avatarText: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#fff' },
    name: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
    phone: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontFamily: 'Inter_400Regular' },
    roleBadge: {
      marginTop: 10, backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
    },
    roleText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff' },
    statsRow: {
      flexDirection: 'row', margin: 16,
      backgroundColor: colors.card, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    statItem: { flex: 1, paddingVertical: 18, alignItems: 'center' },
    statDivider: { width: 1, backgroundColor: colors.border },
    statEmoji: { fontSize: 20, marginBottom: 4 },
    statVal: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.foreground },
    statLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    section: { marginHorizontal: 16, marginBottom: 12 },
    sectionTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
    menuCard: {
      backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
      overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    menuItemDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
    menuEmojiWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
    menuEmoji: { fontSize: 18 },
    menuText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.foreground },
    menuChevron: { fontSize: 18, color: colors.mutedForeground },
    menuDestructive: { color: colors.destructive },
    bottomPad: { height: bottomPad },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.phone}>{user?.phone}</Text>
        <View style={s.roleBadge}>
          <Text style={s.roleText}>✨  Customer</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statEmoji}>📋</Text>
            <Text style={s.statVal}>{stats.total}</Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statEmoji}>📅</Text>
            <Text style={s.statVal}>{stats.upcoming}</Text>
            <Text style={s.statLabel}>Upcoming</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statEmoji}>💰</Text>
            <Text style={[s.statVal, { color: colors.primary }]}>${stats.spent}</Text>
            <Text style={s.statLabel}>Spent</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>My Account</Text>
          <View style={s.menuCard}>
            <TouchableOpacity style={s.menuItem} onPress={() => router.push('/(customer)/appointments')}>
              <View style={s.menuEmojiWrap}><Text style={s.menuEmoji}>📅</Text></View>
              <Text style={s.menuText}>My Appointments</Text>
              <Text style={s.menuChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Support</Text>
          <View style={s.menuCard}>
            <TouchableOpacity style={s.menuItem}>
              <View style={s.menuEmojiWrap}><Text style={s.menuEmoji}>💬</Text></View>
              <Text style={s.menuText}>Help & Support</Text>
              <Text style={s.menuChevron}>›</Text>
            </TouchableOpacity>
            <View style={s.menuItemDivider} />
            <TouchableOpacity style={s.menuItem}>
              <View style={s.menuEmojiWrap}><Text style={s.menuEmoji}>⭐</Text></View>
              <Text style={s.menuText}>Rate the App</Text>
              <Text style={s.menuChevron}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.menuCard}>
            <TouchableOpacity style={s.menuItem} onPress={handleLogout}>
              <View style={[s.menuEmojiWrap, { backgroundColor: '#ef44441A' }]}>
                <Text style={s.menuEmoji}>🚪</Text>
              </View>
              <Text style={[s.menuText, s.menuDestructive]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.bottomPad} />
      </ScrollView>
    </View>
  );
}
