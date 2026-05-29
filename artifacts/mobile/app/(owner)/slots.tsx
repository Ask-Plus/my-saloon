import { useColors } from '@/hooks/useColors';
import { TimeSlot } from '@/types';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetTimeSlots, useGetStylists, useCreateTimeSlot, useDeleteTimeSlot,
  getGetTimeSlotsQueryKey,
} from '@workspace/api-client-react';

const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

function next14Days(): string[] {
  const days: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 0) days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function AddSlotModal({ visible, onClose, onSave, stylists }: {
  visible: boolean; onClose: () => void;
  onSave: (slot: Omit<TimeSlot, 'id' | 'isBooked' | 'createdAt'>) => void;
  stylists: Array<{ id: number; name: string }>;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const days = useMemo(() => next14Days(), []);
  const [date, setDate] = useState(days[0] ?? '');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [stylistId, setStylistId] = useState<number | null>(stylists[0]?.id ?? null);

  const handleSave = () => {
    if (!stylistId) { Alert.alert('Select stylist'); return; }
    if (startTime >= endTime) { Alert.alert('Invalid time', 'End time must be after start time'); return; }
    onSave({ date, startTime, endTime, stylistId });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatDay = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 20, maxHeight: '90%' },
    handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.foreground },
    body: { padding: 20 },
    label: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    chipTextActive: { color: '#fff' },
    saveBtn: { marginTop: 24, backgroundColor: colors.primary, borderRadius: colors.radius, paddingVertical: 15, alignItems: 'center' },
    saveText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={s.headerTitle}>Add Time Slot</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 20, color: colors.foreground }}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={s.body} keyboardShouldPersistTaps="handled">
            <Text style={s.label}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {days.map((d) => (
                  <TouchableOpacity key={d} style={[s.chip, date === d && s.chipActive]} onPress={() => setDate(d)}>
                    <Text style={[s.chipText, date === d && s.chipTextActive]}>{formatDay(d)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={s.label}>Start Time</Text>
            <View style={s.chipRow}>
              {TIMES.slice(0, -1).map((t) => (
                <TouchableOpacity key={t} style={[s.chip, startTime === t && s.chipActive]} onPress={() => setStartTime(t)}>
                  <Text style={[s.chipText, startTime === t && s.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.label}>End Time</Text>
            <View style={s.chipRow}>
              {TIMES.slice(1).map((t) => (
                <TouchableOpacity key={t} style={[s.chip, endTime === t && s.chipActive]} onPress={() => setEndTime(t)}>
                  <Text style={[s.chipText, endTime === t && s.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.label}>Stylist</Text>
            <View style={s.chipRow}>
              {stylists.map((st) => (
                <TouchableOpacity key={st.id} style={[s.chip, stylistId === st.id && s.chipActive]} onPress={() => setStylistId(st.id)}>
                  <Text style={[s.chipText, stylistId === st.id && s.chipTextActive]}>{st.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveText}>Add Slot</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function OwnerSlotsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [filterDate, setFilterDate] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const days = useMemo(() => next14Days(), []);

  const { data: timeSlots = [] } = useGetTimeSlots();
  const { data: stylists = [] } = useGetStylists();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetTimeSlotsQueryKey() });
  const createMutation = useCreateTimeSlot({ mutation: { onSuccess: invalidate } });
  const deleteMutation = useDeleteTimeSlot({ mutation: { onSuccess: invalidate } });

  const filteredSlots = useMemo(() => {
    return timeSlots
      .filter((s) => s.date >= today && (!filterDate || s.date === filterDate))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [timeSlots, filterDate, today]);

  const getStylistName = (id: number) => stylists.find((s) => s.id === id)?.name ?? 'Unknown';

  const formatDay = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = Platform.OS === 'android'
    ? insets.bottom + 16
    : insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 72;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: colors.foreground },
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    filterScroll: { paddingHorizontal: 20, paddingVertical: 12 },
    dayChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
    dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    dayChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    dayChipTextActive: { color: '#fff' },
    listContent: { paddingHorizontal: 20, paddingBottom: bottomPad },
    slotCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.card, borderRadius: colors.radius + 2,
      borderWidth: 1, borderColor: colors.border,
      padding: 14, marginBottom: 8,
    },
    slotBooked: { opacity: 0.5 },
    timeCol: { minWidth: 80 },
    timeText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.foreground },
    dateText: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 1 },
    stylistText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.foreground },
    bookedBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: `${colors.primary}20`, borderRadius: 20 },
    bookedText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.primary },
    freeBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#22c55e1A', borderRadius: 20 },
    freeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#22c55e' },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Time Slots</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => { setModalVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
          <Text style={{ fontSize: 24, color: '#fff', lineHeight: 28 }}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
        <TouchableOpacity style={[s.dayChip, !filterDate && s.dayChipActive]} onPress={() => setFilterDate(null)}>
          <Text style={[s.dayChipText, !filterDate && s.dayChipTextActive]}>All</Text>
        </TouchableOpacity>
        {days.map((d) => (
          <TouchableOpacity key={d} style={[s.dayChip, filterDate === d && s.dayChipActive]} onPress={() => setFilterDate(d === filterDate ? null : d)}>
            <Text style={[s.dayChipText, filterDate === d && s.dayChipTextActive]}>{formatDay(d)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredSlots}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <View style={[s.slotCard, item.isBooked && s.slotBooked]}>
            <View style={s.timeCol}>
              <Text style={s.timeText}>{item.startTime}–{item.endTime}</Text>
              <Text style={s.dateText}>{formatDay(item.date)}</Text>
            </View>
            <Text style={s.stylistText}>{getStylistName(item.stylistId)}</Text>
            {item.isBooked ? (
              <View style={s.bookedBadge}><Text style={s.bookedText}>Booked</Text></View>
            ) : (
              <View style={s.freeBadge}><Text style={s.freeText}>Free</Text></View>
            )}
            {!item.isBooked && (
              <TouchableOpacity onPress={() => Alert.alert('Delete Slot', 'Delete this time slot?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate({ id: item.id }) },
              ])}>
                <Text style={{ fontSize: 16, color: colors.destructive }}>🗑</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48 }}>🕐</Text>
            <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: 'Inter_500Medium' }}>No time slots available</Text>
          </View>
        }
      />

      <AddSlotModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={(slot) => { createMutation.mutate({ data: slot }); setModalVisible(false); }}
        stylists={stylists}
      />
    </View>
  );
}
