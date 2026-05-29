import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetDashboardStats, useGetAppointments } from '@workspace/api-client-react';

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  const colors = useColors();
  const s = StyleSheet.create({
    card: { flex: 1, backgroundColor: colors.card, borderRadius: colors.radius + 4, padding: 16, borderWidth: 1, borderColor: colors.border },
    iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    value: { fontSize: 26, fontFamily: 'Inter_700Bold', color: colors.foreground },
    label: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 2 },
  });
  return (
    <View style={s.card}>
      <View style={[s.iconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={s.value}>{value}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

export default function OwnerDashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: stats } = useGetDashboardStats();
  const today = new Date().toISOString().split('T')[0];
  const { data: appointments = [] } = useGetAppointments();

  const recentAppointments = React.useMemo(() => {
    return [...appointments]
      .filter((a) => a.date >= today && a.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .slice(0, 5);
  }, [appointments, today]);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: colors.primary },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter_500Medium' },
    title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#fff', marginTop: 2, letterSpacing: -0.5 },
    todayBadge: {
      marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start',
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    todayText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
    settingsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    content: { padding: 20 },
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 12, marginTop: 4 },
    apptCard: {
      backgroundColor: colors.card, borderRadius: colors.radius + 2,
      borderWidth: 1, borderColor: colors.border,
      padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    timeCol: { alignItems: 'center', minWidth: 50 },
    timeText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.primary },
    dateText: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 },
    divLine: { width: 1, height: 36, backgroundColor: colors.border },
    apptInfo: { flex: 1 },
    apptService: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    apptMeta: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 },
    priceText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.foreground },
    emptyText: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', padding: 20 },
    bankBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: colors.card, borderRadius: colors.radius + 2,
      borderWidth: 1, borderColor: colors.border,
      padding: 14, marginBottom: 20,
    },
    bankBtnText: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    bottomPad: { height: bottomPad },
  });

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.greeting}>Salon Manager</Text>
            <Text style={s.title}>Welcome, {user?.name?.split(' ')[0]}</Text>
          </View>
          <TouchableOpacity style={s.settingsBtn} onPress={() => { Haptics.selectionAsync(); router.push('/(owner)/bank-accounts'); }}>
            <Ionicons name="card-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={s.todayBadge}>
          <Ionicons name="today-outline" size={14} color="#fff" />
          <Text style={s.todayText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <View style={s.statsGrid}>
            <StatCard icon="today-outline" label="Today's Bookings" value={stats?.todayCount ?? 0} color={colors.primary} />
            <StatCard icon="calendar-outline" label="Upcoming" value={stats?.upcomingCount ?? 0} color="#6366f1" />
          </View>
          <View style={s.statsGrid}>
            <StatCard icon="cash-outline" label="Total Revenue" value={`$${stats?.totalRevenue?.toFixed(0) ?? 0}`} color="#22c55e" />
            <StatCard icon="time-outline" label="Open Slots" value={stats?.openSlotsCount ?? 0} color="#f59e0b" />
          </View>

          <TouchableOpacity style={s.bankBtn} onPress={() => { Haptics.selectionAsync(); router.push('/(owner)/bank-accounts'); }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="card-outline" size={18} color={colors.primary} />
            </View>
            <Text style={s.bankBtnText}>Manage Bank Accounts</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          <Text style={[s.sectionTitle]}>Upcoming Appointments</Text>
          {recentAppointments.length === 0 ? (
            <Text style={s.emptyText}>No upcoming appointments</Text>
          ) : (
            recentAppointments.map((appt) => (
              <View key={appt.id} style={s.apptCard}>
                <View style={s.timeCol}>
                  <Text style={s.timeText}>{appt.startTime}</Text>
                  <Text style={s.dateText}>{formatDate(appt.date)}</Text>
                </View>
                <View style={s.divLine} />
                <View style={s.apptInfo}>
                  <Text style={s.apptService}>{appt.serviceName}</Text>
                  <Text style={s.apptMeta}>{appt.customerName} · {appt.stylistName}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={s.priceText}>${appt.servicePrice}</Text>
                  {appt.paymentStatus !== 'paid' && (
                    <View style={{ backgroundColor: '#f59e0b18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                      <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#f59e0b' }}>Unpaid</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
        <View style={s.bottomPad} />
      </ScrollView>
    </View>
  );
}
