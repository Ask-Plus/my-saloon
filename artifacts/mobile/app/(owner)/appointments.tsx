import { useColors } from '@/hooks/useColors';
import { useNotification } from '@/context/NotificationContext';
import { Appointment } from '@/types';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetAppointments, useUpdateAppointment, getGetAppointmentsQueryKey, getGetDashboardStatsQueryKey,
} from '@workspace/api-client-react';

const STATUS_COLORS: Record<string, string> = { confirmed: '#22c55e', pending: '#f59e0b', cancelled: '#ef4444', completed: '#6366f1' };

export default function OwnerAppointmentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('upcoming');
  const today = new Date().toISOString().split('T')[0];

  const { data: appointments = [] } = useGetAppointments();

  const updateMutation = useUpdateAppointment({
    mutation: {
      onSuccess: (_, vars) => {
        queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        const status = (vars.data as { status: string }).status;
        if (status === 'completed') showNotification('success', 'Appointment completed');
        else if (status === 'cancelled') showNotification('info', 'Appointment cancelled');
      },
    },
  });

  const filtered = useMemo(() => {
    const list = [...appointments].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    if (filter === 'today') return list.filter((a) => a.date === today);
    if (filter === 'upcoming') return list.filter((a) => a.date >= today && a.status !== 'cancelled');
    return list;
  }, [appointments, filter, today]);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = Platform.OS === 'android'
    ? insets.bottom + 16
    : insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 72;
  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: colors.foreground, letterSpacing: -0.5 },
    filterRow: { flexDirection: 'row', marginTop: 12, backgroundColor: colors.muted, borderRadius: colors.radius, padding: 3 },
    filterBtn: { flex: 1, paddingVertical: 8, borderRadius: colors.radius - 1, alignItems: 'center' },
    filterBtnActive: { backgroundColor: colors.primary },
    filterText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground },
    filterTextActive: { color: '#fff' },
    card: { backgroundColor: colors.card, borderRadius: colors.radius + 2, marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    statusStripe: { height: 3 },
    cardBody: { padding: 14 },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    serviceName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.foreground, flex: 1 },
    priceText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.foreground },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    infoText: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBtns: { flexDirection: 'row', gap: 6 },
    statusBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    statusBtnText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
    payBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    listContent: { paddingTop: 16, paddingBottom: bottomPad },
  });

  const handleStatus = (appt: Appointment, status: string) => {
    Haptics.selectionAsync();
    updateMutation.mutate({ id: appt.id, data: { status } });
  };

  const handleMarkPaid = (appt: Appointment) => {
    Haptics.selectionAsync();
    updateMutation.mutate({ id: appt.id, data: { status: appt.status, paymentStatus: 'paid' } });
    showNotification('success', 'Payment confirmed', `${appt.customerName}'s payment marked as received.`);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>All Bookings</Text>
        <View style={s.filterRow}>
          {(['today', 'upcoming', 'all'] as const).map((f) => (
            <TouchableOpacity key={f} style={[s.filterBtn, filter === f && s.filterBtnActive]} onPress={() => { setFilter(f); Haptics.selectionAsync(); }}>
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => {
          const statusColor = STATUS_COLORS[item.status] ?? colors.primary;
          const isPending = item.paymentStatus !== 'paid';
          return (
            <View style={s.card}>
              <View style={[s.statusStripe, { backgroundColor: statusColor }]} />
              <View style={s.cardBody}>
                <View style={s.cardTop}>
                  <Text style={s.serviceName}>{item.serviceName}</Text>
                  <Text style={s.priceText}>${item.servicePrice}</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={{ fontSize: 12 }}>👤</Text>
                  <Text style={s.infoText}>{item.customerName} · {item.customerPhone}</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={{ fontSize: 12 }}>📅</Text>
                  <Text style={s.infoText}>{formatDate(item.date)} at {item.startTime}</Text>
                </View>
                <View style={s.infoRow}>
                  <Text style={{ fontSize: 12 }}>✂</Text>
                  <Text style={s.infoText}>{item.stylistName}</Text>
                </View>
                <View style={s.divider} />
                <View style={s.footer}>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${statusColor}1A` }}>
                      <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: statusColor }}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Text>
                    </View>
                    <View style={[s.payBadge, { backgroundColor: isPending ? '#f59e0b18' : '#22c55e18' }]}>
                      <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: isPending ? '#f59e0b' : '#22c55e' }}>
                        {isPending ? 'Unpaid' : 'Paid'}
                      </Text>
                    </View>
                  </View>
                  <View style={s.statusBtns}>
                    {item.status === 'confirmed' && isPending && (
                      <TouchableOpacity style={[s.statusBtn, { borderColor: '#22c55e' }]} onPress={() => handleMarkPaid(item)}>
                        <Text style={[s.statusBtnText, { color: '#22c55e' }]}>Mark Paid</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'confirmed' && (
                      <>
                        <TouchableOpacity style={[s.statusBtn, { borderColor: '#6366f1' }]} onPress={() => handleStatus(item, 'completed')}>
                          <Text style={[s.statusBtnText, { color: '#6366f1' }]}>Complete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.statusBtn, { borderColor: colors.destructive }]} onPress={() => handleStatus(item, 'cancelled')}>
                          <Text style={[s.statusBtnText, { color: colors.destructive }]}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: 'Inter_500Medium' }}>No appointments found</Text>
          </View>
        }
      />
    </View>
  );
}
