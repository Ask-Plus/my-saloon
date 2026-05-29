import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetService, useGetStylists, useGetTimeSlots } from '@workspace/api-client-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function buildValidDateSet(): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 0) set.add(d.toISOString().split('T')[0]);
  }
  return set;
}

function getFirstValidDate(): string {
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 0) return d.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

export default function BookServiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { serviceId: serviceIdStr } = useLocalSearchParams<{ serviceId: string }>();
  const serviceId = parseInt(serviceIdStr ?? '0');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const validDates = useMemo(() => buildValidDateSet(), []);

  const [selectedDate, setSelectedDate] = useState(getFirstValidDate);
  const [selectedStylistId, setSelectedStylistId] = useState<number | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  // Calendar modal state
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const { data: service, isLoading: loadingService } = useGetService(serviceId, { query: { enabled: serviceId > 0 } });
  const { data: stylists = [] } = useGetStylists();
  const { data: availableSlots = [] } = useGetTimeSlots(
    { date: selectedDate, stylistId: selectedStylistId ?? undefined, available: true },
    { query: { enabled: !!selectedStylistId && !!selectedDate } },
  );

  const sortedSlots = useMemo(() => {
    return [...availableSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [availableSlots]);

  const handleStylistSelect = (id: number) => {
    setSelectedStylistId(id);
    setSelectedSlotId(null);
    Haptics.selectionAsync();
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlotId(null);
    setCalendarVisible(false);
    Haptics.selectionAsync();
  };

  const handleContinue = () => {
    if (!selectedSlotId || !selectedStylistId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const notesParam = notes.trim() ? `&notes=${encodeURIComponent(notes.trim())}` : '';
    router.push(`/book/payment?serviceId=${serviceId}&slotId=${selectedSlotId}&stylistId=${selectedStylistId}${notesParam}`);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const formatSelectedDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const bottomPad = Math.max(insets.bottom, 20) + (Platform.OS === 'web' ? 34 : 0);
  const catColor: Record<string, string> = { Hair: '#B5566A', Nails: '#C9934A', Skin: '#7B9E87', Beauty: '#9B7EC8', Other: '#6B7280' };
  const serviceColor = service ? (catColor[service.category] ?? colors.primary) : colors.primary;

  // Build calendar grid
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const calCells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calCells.length % 7 !== 0) calCells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calCells.length; i += 7) weeks.push(calCells.slice(i, i + 7));

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    serviceCard: {
      margin: 20, padding: 20, borderRadius: colors.radius + 4,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
    },
    colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: 4, backgroundColor: serviceColor },
    serviceName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.foreground, marginLeft: 8 },
    serviceDesc: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', lineHeight: 18, marginLeft: 8, marginTop: 4 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 8, marginTop: 12 },
    price: { fontSize: 24, fontFamily: 'Inter_700Bold', color: serviceColor },
    durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    durationText: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
    sectionTitle: {
      fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.foreground,
      marginHorizontal: 20, marginBottom: 12, letterSpacing: 0.3,
    },
    dateBtn: {
      marginHorizontal: 20, marginBottom: 20, padding: 16,
      borderRadius: colors.radius + 2, borderWidth: 1.5, borderColor: serviceColor,
      backgroundColor: `${serviceColor}10`, flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    dateBtnEmoji: { fontSize: 22 },
    dateBtnLabel: { flex: 1 },
    dateBtnSub: { fontSize: 11, fontFamily: 'Inter_500Medium', color: serviceColor, opacity: 0.7, marginBottom: 1 },
    dateBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: serviceColor },
    dateBtnArrow: { fontSize: 18, color: serviceColor, opacity: 0.7 },
    stylistCard: {
      borderRadius: colors.radius + 2, borderWidth: 1.5, borderColor: colors.border,
      padding: 12, marginRight: 12, alignItems: 'center', minWidth: 90,
    },
    stylistCardActive: { borderColor: serviceColor, backgroundColor: `${serviceColor}0F` },
    stylistAvatar: {
      width: 48, height: 48, borderRadius: 24, backgroundColor: colors.muted,
      alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    },
    stylistAvatarActive: { backgroundColor: `${serviceColor}20` },
    stylistInitial: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.mutedForeground },
    stylistInitialActive: { color: serviceColor },
    stylistName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.foreground, textAlign: 'center', marginBottom: 2 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    ratingText: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10, marginBottom: 28 },
    slotChip: {
      paddingHorizontal: 14, paddingVertical: 11, borderRadius: colors.radius,
      borderWidth: 1.5, borderColor: colors.border, minWidth: 82, alignItems: 'center',
    },
    slotChipActive: { backgroundColor: serviceColor, borderColor: serviceColor },
    slotText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    slotTextActive: { color: '#fff' },
    hint: {
      textAlign: 'center', color: colors.mutedForeground, fontFamily: 'Inter_400Regular',
      fontSize: 13, paddingHorizontal: 20, marginBottom: 28,
    },
    notesInput: {
      marginHorizontal: 20, borderRadius: colors.radius + 2, borderWidth: 1.5,
      borderColor: colors.border, backgroundColor: colors.card,
      padding: 14, fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.foreground, minHeight: 100, textAlignVertical: 'top', marginBottom: 32,
    },
    footer: {
      paddingHorizontal: 20, paddingTop: 14, paddingBottom: bottomPad + 16,
      borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background,
    },
    continueBtn: { backgroundColor: serviceColor, borderRadius: colors.radius, paddingVertical: 16, alignItems: 'center' },
    continueBtnDisabled: { opacity: 0.4 },
    continueText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
    // Calendar modal
    calOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    calSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingBottom: Math.max(insets.bottom, 16) + 8,
    },
    calHandle: {
      width: 40, height: 4, backgroundColor: colors.border,
      borderRadius: 2, alignSelf: 'center', marginTop: 14, marginBottom: 4,
    },
    calTitle: {
      textAlign: 'center', fontSize: 13, fontFamily: 'Inter_600SemiBold',
      color: colors.mutedForeground, letterSpacing: 0.5, marginTop: 4,
    },
    calHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 14,
    },
    calMonthText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.foreground },
    calNavBtn: {
      width: 38, height: 38, borderRadius: 19, backgroundColor: colors.muted,
      alignItems: 'center', justifyContent: 'center',
    },
    calNavText: { fontSize: 20, color: colors.foreground, fontWeight: '700', lineHeight: 24 },
    calDayRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
    calDayLabel: {
      flex: 1, textAlign: 'center', fontSize: 12,
      fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground,
    },
    calGrid: { paddingHorizontal: 12, paddingBottom: 8 },
    calWeekRow: { flexDirection: 'row', marginBottom: 4 },
    calCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, margin: 2 },
    calCellSelected: { backgroundColor: serviceColor },
    calCellToday: { borderWidth: 2, borderColor: serviceColor },
    calCellValid: { backgroundColor: `${serviceColor}12` },
    calCellText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.foreground },
    calCellTextSelected: { color: '#fff', fontFamily: 'Inter_700Bold' },
    calCellTextDisabled: { color: colors.border },
    calCellTextToday: { color: serviceColor, fontFamily: 'Inter_700Bold' },
    calLegend: {
      flexDirection: 'row', justifyContent: 'center', gap: 20,
      paddingTop: 8, paddingBottom: 4,
    },
    calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    calLegendDot: { width: 10, height: 10, borderRadius: 5 },
    calLegendText: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
  });

  if (loadingService) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.mutedForeground }}>Service not found</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Stack.Screen options={{ title: 'Book Appointment', headerBackTitle: 'Services' }} />

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Service info */}
        <View style={s.serviceCard}>
          <View style={s.colorBar} />
          <Text style={s.serviceName}>{service.name}</Text>
          <Text style={s.serviceDesc}>{service.description}</Text>
          <View style={s.priceRow}>
            <Text style={s.price}>${service.price}</Text>
            <View style={s.durationRow}>
              <Text style={{ fontSize: 13 }}>⏱</Text>
              <Text style={s.durationText}>{service.duration} min</Text>
            </View>
          </View>
        </View>

        {/* Date picker */}
        <Text style={s.sectionTitle}>Select Date</Text>
        <TouchableOpacity
          style={s.dateBtn}
          onPress={() => { setCalendarVisible(true); Haptics.selectionAsync(); }}
          activeOpacity={0.8}
        >
          <Text style={s.dateBtnEmoji}>📅</Text>
          <View style={s.dateBtnLabel}>
            <Text style={s.dateBtnSub}>SELECTED DATE</Text>
            <Text style={s.dateBtnText}>{formatSelectedDate(selectedDate)}</Text>
          </View>
          <Text style={s.dateBtnArrow}>▾</Text>
        </TouchableOpacity>

        {/* Stylist picker */}
        <Text style={s.sectionTitle}>Choose Stylist</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20, paddingRight: 8, paddingBottom: 4, marginBottom: 24 }}
        >
          {stylists.map((st) => (
            <TouchableOpacity
              key={st.id}
              style={[s.stylistCard, selectedStylistId === st.id && s.stylistCardActive]}
              onPress={() => handleStylistSelect(st.id)}
              activeOpacity={0.8}
            >
              <View style={[s.stylistAvatar, selectedStylistId === st.id && s.stylistAvatarActive]}>
                <Text style={[s.stylistInitial, selectedStylistId === st.id && s.stylistInitialActive]}>
                  {st.name.charAt(0)}
                </Text>
              </View>
              <Text style={s.stylistName}>{st.name.split(' ')[0]}</Text>
              <View style={s.ratingRow}>
                <Text style={{ fontSize: 11 }}>⭐</Text>
                <Text style={s.ratingText}>{st.rating.toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time slots */}
        <Text style={s.sectionTitle}>Available Times</Text>
        {!selectedStylistId ? (
          <Text style={s.hint}>Select a stylist to see available times</Text>
        ) : sortedSlots.length === 0 ? (
          <Text style={s.hint}>No available slots for this date and stylist</Text>
        ) : (
          <View style={s.slotsGrid}>
            {sortedSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[s.slotChip, selectedSlotId === slot.id && s.slotChipActive]}
                onPress={() => { setSelectedSlotId(slot.id); Haptics.selectionAsync(); }}
                activeOpacity={0.8}
              >
                <Text style={[s.slotText, selectedSlotId === slot.id && s.slotTextActive]}>
                  {slot.startTime}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Notes / Special Requests */}
        <Text style={s.sectionTitle}>Special Requests</Text>
        <TextInput
          style={s.notesInput}
          placeholder="Any special requests or notes for your stylist... (optional)"
          placeholderTextColor={colors.mutedForeground}
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={500}
          returnKeyType="done"
          blurOnSubmit
        />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.continueBtn, (!selectedSlotId || !selectedStylistId) && s.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selectedSlotId || !selectedStylistId}
          activeOpacity={0.85}
        >
          <Text style={s.continueText}>Continue to Payment — ${service.price}</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={calendarVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <TouchableOpacity
          style={s.calOverlay}
          activeOpacity={1}
          onPress={() => setCalendarVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={s.calSheet}>
              <View style={s.calHandle} />
              <Text style={s.calTitle}>SELECT DATE</Text>

              <View style={s.calHeader}>
                <TouchableOpacity style={s.calNavBtn} onPress={prevMonth} activeOpacity={0.7}>
                  <Text style={s.calNavText}>‹</Text>
                </TouchableOpacity>
                <Text style={s.calMonthText}>{MONTH_NAMES[calMonth]} {calYear}</Text>
                <TouchableOpacity style={s.calNavBtn} onPress={nextMonth} activeOpacity={0.7}>
                  <Text style={s.calNavText}>›</Text>
                </TouchableOpacity>
              </View>

              <View style={s.calDayRow}>
                {DAY_LABELS.map((d) => (
                  <Text key={d} style={[s.calDayLabel, d === 'Su' && { color: colors.destructive }]}>{d}</Text>
                ))}
              </View>

              <View style={s.calGrid}>
                {weeks.map((week, wi) => (
                  <View key={wi} style={s.calWeekRow}>
                    {week.map((day, di) => {
                      if (!day) return <View key={di} style={s.calCell} />;
                      const dateStr = toDateStr(calYear, calMonth, day);
                      const isValid = validDates.has(dateStr);
                      const isSelected = dateStr === selectedDate;
                      const isToday = dateStr === todayStr;
                      const isSunday = di === 0;
                      return (
                        <TouchableOpacity
                          key={di}
                          style={[
                            s.calCell,
                            isSelected && s.calCellSelected,
                            !isSelected && isToday && s.calCellToday,
                            !isSelected && isValid && !isToday && s.calCellValid,
                          ]}
                          onPress={() => isValid ? handleDateSelect(dateStr) : null}
                          disabled={!isValid}
                          activeOpacity={0.75}
                        >
                          <Text style={[
                            s.calCellText,
                            isSelected && s.calCellTextSelected,
                            !isValid && s.calCellTextDisabled,
                            !isSelected && isToday && s.calCellTextToday,
                            !isSelected && !isValid && isSunday && s.calCellTextDisabled,
                            !isSelected && isValid && !isToday && { color: colors.foreground },
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>

              <View style={s.calLegend}>
                <View style={s.calLegendItem}>
                  <View style={[s.calLegendDot, { backgroundColor: serviceColor }]} />
                  <Text style={s.calLegendText}>Available</Text>
                </View>
                <View style={s.calLegendItem}>
                  <View style={[s.calLegendDot, { backgroundColor: colors.border }]} />
                  <Text style={s.calLegendText}>Unavailable</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
