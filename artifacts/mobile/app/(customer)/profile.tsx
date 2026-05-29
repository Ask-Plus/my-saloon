import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Feather, Ionicons } from '@expo/vector-icons';
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
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPad + 24, paddingHorizontal: 20, paddingBottom: 24,
      alignItems: 'center', backgroundColor: colors.primary,
    },
    avatar: {
      width: 76, height: 76, borderRadius: 38,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)', marginBottom: 12,
    },
    name: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
    phone: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontFamily: 'Inter_400Regular' },
    statsRow: {
      flexDirection: 'row', margin: 20,
      backgroundColor: colors.card, borderRadius: colors.radius + 4,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    statItem: { flex: 1, paddingVertical: 16, alignItems: 'center' },
    statDivider: { width: 1, backgroundColor: colors.border },
    statVal: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.foreground },
    statLabel: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
    section: { marginHorizontal: 20, marginBottom: 8 },
    sectionTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
    menuCard: { backgroundColor: colors.card, borderRadius: colors.radius + 4, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    menuIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
    menuText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.foreground },
    menuDestructive: { color: colors.destructive },
    bottomPad: { height: bottomPad },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.avatar}>
          <Ionicons name="person" size={36} color="rgba(255,255,255,0.9)" />
        </View>
        <Text style={s.name}>{user?.name}</Text>
        <Text style={s.phone}>{user?.phone}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats.total}</Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statVal}>{stats.upcoming}</Text>
            <Text style={s.statLabel}>Upcoming</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: colors.primary }]}>${stats.spent}</Text>
            <Text style={s.statLabel}>Spent</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>My Account</Text>
          <View style={s.menuCard}>
            <TouchableOpacity style={s.menuItem} onPress={() => router.push('/(customer)/appointments')}>
              <View style={s.menuIconWrap}><Feather name="calendar" size={18} color={colors.primary} /></View>
              <Text style={s.menuText}>My Appointments</Text>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>More</Text>
          <View style={s.menuCard}>
            <TouchableOpacity style={s.menuItem} onPress={handleLogout}>
              <View style={[s.menuIconWrap, { backgroundColor: '#ef44441A' }]}>
                <Feather name="log-out" size={18} color={colors.destructive} />
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
