import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetDashboardStats, useGetAppointments } from '@workspace/api-client-react';

function StatCard({ emoji, label, value, color, sub }: { emoji: string; label: string; value: string | number; color: string; sub?: string }) {
  const colors = useColors();
  const s = StyleSheet.create({
    card: {
      flex: 1, backgroundColor: colors.card, borderRadius: 16,
      padding: 16, borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    emojiWrap: {
      width: 44, height: 44, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    emoji: { fontSize: 22 },
    value: { fontSize: 28, fontFamily: 'Inter_700Bold', color: colors.foreground, letterSpacing: -0.5 },
    label: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    sub: { fontSize: 10, color, fontFamily: 'Inter_500Medium', marginTop: 2 },
  });
  return (
    <View style={s.card}>
      <View style={[s.emojiWrap, { backgroundColor: `${color}18` }]}>
        <Text style={s.emoji}>{emoji}</Text>
      </View>
      <Text style={s.value}>{value}</Text>
      <Text style={s.label}>{label}</Text>
      {sub ? <Text style={s.sub}>{sub}</Text> : null}
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

  const unpaidCount = appointments.filter(a => a.paymentStatus !== 'paid' && a.status !== 'cancelled').length;

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = Platform.OS === 'android'
    ? insets.bottom + 16
    : insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 72;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 24, backgroundColor: colors.primary },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter_500Medium' },
    title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#fff', marginTop: 2, letterSpacing: -0.5 },
    todayBadge: {
      marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'flex-start',
      paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    },
    todayEmoji: { fontSize: 13 },
    todayText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
    cardBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: 4,
    },
    cardBtnEmoji: { fontSize: 18 },
    content: { padding: 16 },
    statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.foreground },
    seeAll: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary },
    bankBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border,
      padding: 16, marginTop: 10, marginBottom: 6,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    bankEmojiWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: `${colors.primary}12`, alignItems: 'center', justifyContent: 'center' },
    bankEmoji: { fontSize: 20 },
    bankBtnText: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    bankChevron: { fontSize: 18, color: colors.mutedForeground },
    apptCard: {
      backgroundColor: colors.card, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border,
      padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    },
    timeCol: { alignItems: 'center', minWidth: 54 },
    timeText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.primary },
    dateText: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 },
    divLine: { width: 1, height: 40, backgroundColor: colors.border },
    apptInfo: { flex: 1 },
    apptService: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    apptMeta: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 3 },
    priceText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.foreground },
    unpaidBadge: { backgroundColor: '#f59e0b18', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
    unpaidText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#f59e0b' },
    emptyText: { color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', padding: 24 },
    emptyEmoji: { textAlign: 'center', fontSize: 36, marginTop: 20 },
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
          <TouchableOpacity style={s.cardBtn} onPress={() => { Haptics.selectionAsync(); router.push('/(owner)/bank-accounts'); }}>
            <Text style={s.cardBtnEmoji}>💳</Text>
          </TouchableOpacity>
        </View>
        <View style={s.todayBadge}>
          <Text style={s.todayEmoji}>📅</Text>
          <Text style={s.todayText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.content}>
          <View style={[s.statsGrid, { marginTop: 16 }]}>
            <StatCard emoji="📋" label="Today" value={stats?.todayCount ?? 0} color={colors.primary} sub="bookings" />
            <StatCard emoji="📅" label="Upcoming" value={stats?.upcomingCount ?? 0} color="#6366f1" sub="appointments" />
          </View>
          <View style={s.statsGrid}>
            <StatCard emoji="💰" label="Revenue" value={`$${stats?.totalRevenue?.toFixed(0) ?? 0}`} color="#22c55e" sub="total earned" />
            <StatCard emoji="🕐" label="Open Slots" value={stats?.openSlotsCount ?? 0} color="#f59e0b" sub="available" />
          </View>

          <TouchableOpacity style={s.bankBtn} onPress={() => { Haptics.selectionAsync(); router.push('/(owner)/bank-accounts'); }}>
            <View style={s.bankEmojiWrap}>
              <Text style={s.bankEmoji}>🏦</Text>
            </View>
            <Text style={s.bankBtnText}>Manage Bank Accounts</Text>
            {unpaidCount > 0 && (
              <View style={{ backgroundColor: '#f59e0b', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' }}>{unpaidCount}</Text>
              </View>
            )}
            <Text style={s.bankChevron}>›</Text>
          </TouchableOpacity>

          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => router.push('/(owner)/appointments')}>
              <Text style={s.seeAll}>See all ›</Text>
            </TouchableOpacity>
          </View>

          {recentAppointments.length === 0 ? (
            <>
              <Text style={s.emptyEmoji}>📭</Text>
              <Text style={s.emptyText}>No upcoming appointments</Text>
            </>
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
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.priceText}>${appt.servicePrice}</Text>
                  {appt.paymentStatus !== 'paid' && (
                    <View style={s.unpaidBadge}>
                      <Text style={s.unpaidText}>Unpaid</Text>
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
