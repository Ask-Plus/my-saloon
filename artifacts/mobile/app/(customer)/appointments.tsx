import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Appointment } from '@/types';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetAppointments,
  useUpdateAppointment,
  getGetAppointmentsQueryKey,
} from '@workspace/api-client-react';

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#22c55e', pending: '#f59e0b', cancelled: '#ef4444', completed: '#6366f1',
};
const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled', completed: 'Completed',
};

function AppointmentCard({ appointment, onCancel }: { appointment: Appointment; onCancel: (id: number, name: string) => void }) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[appointment.status] ?? colors.primary;

  const s = StyleSheet.create({
    card: {
      backgroundColor: colors.card, borderRadius: colors.radius + 4,
      marginHorizontal: 20, marginBottom: 12,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    statusBar: { height: 3, backgroundColor: statusColor },
    body: { padding: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    serviceName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.foreground, flex: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${statusColor}1A` },
    statusText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: statusColor },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    infoText: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    price: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.foreground },
    paidBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: '#22c55e1A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
    },
    paidText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#22c55e' },
    pendingBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: '#f59e0b1A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
    },
    pendingText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#f59e0b' },
    cancelBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 10, paddingVertical: 6, borderRadius: colors.radius,
      borderWidth: 1, borderColor: colors.destructive,
    },
    cancelText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.destructive },
  });

  const formatDate = (date: string) => new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <View style={s.card}>
      <View style={s.statusBar} />
      <View style={s.body}>
        <View style={s.row}>
          <Text style={s.serviceName}>{appointment.serviceName}</Text>
          <View style={s.statusBadge}><Text style={s.statusText}>{STATUS_LABELS[appointment.status] ?? appointment.status}</Text></View>
        </View>
        <View style={s.infoRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
          <Text style={s.infoText}>{formatDate(appointment.date)}</Text>
          <Text style={[s.infoText, { color: colors.border }]}>|</Text>
          <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
          <Text style={s.infoText}>{appointment.startTime} – {appointment.endTime}</Text>
        </View>
        <View style={s.infoRow}>
          <Ionicons name="person-outline" size={14} color={colors.mutedForeground} />
          <Text style={s.infoText}>{appointment.stylistName}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.footer}>
          <Text style={s.price}>${appointment.servicePrice}</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {appointment.paymentStatus === 'paid' ? (
              <View style={s.paidBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                <Text style={s.paidText}>Paid</Text>
              </View>
            ) : (
              <View style={s.pendingBadge}>
                <Ionicons name="time-outline" size={12} color="#f59e0b" />
                <Text style={s.pendingText}>Awaiting Confirm</Text>
              </View>
            )}
            {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
              <TouchableOpacity style={s.cancelBtn} onPress={() => onCancel(appointment.id, appointment.serviceName)}>
                <Feather name="x" size={12} color={colors.destructive} />
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function CustomerAppointmentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  const { data: appointments = [] } = useGetAppointments(
    user?.id ? { customerId: user.id } : undefined,
    { query: { enabled: !!user?.id } },
  );

  const cancelMutation = useUpdateAppointment({
    mutation: {
      onSuccess: (_, vars) => {
        queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
        showNotification('info', 'Appointment cancelled', 'Your booking has been cancelled.');
      },
    },
  });

  const sorted = useMemo(() => {
    return [...appointments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [appointments]);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    if (filter === 'upcoming') {
      return sorted.filter((a) => a.date >= today && a.status !== 'cancelled');
    }
    return sorted.filter((a) => a.date < today || a.status === 'cancelled' || a.status === 'completed');
  }, [sorted, filter]);

  const handleCancel = (id: number, serviceName: string) => {
    Alert.alert('Cancel Appointment', `Cancel your ${serviceName} appointment?`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel Appointment',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          cancelMutation.mutate({ id, data: { status: 'cancelled' } });
        },
      },
    ]);
  };

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16,
      backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: colors.foreground, letterSpacing: -0.5 },
    filterRow: { flexDirection: 'row', marginTop: 14, backgroundColor: colors.muted, borderRadius: colors.radius, padding: 3 },
    filterBtn: { flex: 1, paddingVertical: 8, borderRadius: colors.radius - 1, alignItems: 'center' },
    filterBtnActive: { backgroundColor: colors.primary },
    filterText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground },
    filterTextActive: { color: '#fff' },
    listContent: { paddingTop: 16, paddingBottom: bottomPad },
    emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 16, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
    emptySubText: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>My Bookings</Text>
        <View style={s.filterRow}>
          {(['upcoming', 'past'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.filterBtn, filter === f && s.filterBtnActive]}
              onPress={() => { setFilter(f); Haptics.selectionAsync(); }}
            >
              <Text style={[s.filterText, filter === f && s.filterTextActive]}>
                {f === 'upcoming' ? 'Upcoming' : 'Past'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <AppointmentCard appointment={item} onCancel={handleCancel} />}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Ionicons name="calendar-outline" size={48} color={colors.border} />
            <Text style={s.emptyText}>No {filter} appointments</Text>
            <Text style={s.emptySubText}>
              {filter === 'upcoming' ? 'Book a service to get started' : 'Your past bookings will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
