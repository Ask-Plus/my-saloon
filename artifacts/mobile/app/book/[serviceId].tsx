import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetService, useGetStylists, useGetTimeSlots } from '@workspace/api-client-react';

function next14Days(): string[] {
  const days: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 0) days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

export default function BookServiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { serviceId: serviceIdStr } = useLocalSearchParams<{ serviceId: string }>();
  const serviceId = parseInt(serviceIdStr ?? '0');

  const days = useMemo(() => next14Days(), []);
  const [selectedDate, setSelectedDate] = useState(days[0] ?? '');
  const [selectedStylistId, setSelectedStylistId] = useState<number | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

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
    Haptics.selectionAsync();
  };

  const handleContinue = () => {
    if (!selectedSlotId || !selectedStylistId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/book/payment?serviceId=${serviceId}&slotId=${selectedSlotId}&stylistId=${selectedStylistId}`);
  };

  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);
  const catColor: Record<string, string> = { Hair: '#B5566A', Nails: '#C9934A', Skin: '#7B9E87', Beauty: '#9B7EC8', Other: '#6B7280' };
  const serviceColor = service ? (catColor[service.category] ?? colors.primary) : colors.primary;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    serviceCard: { margin: 20, padding: 20, borderRadius: colors.radius + 4, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    colorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: 4, backgroundColor: serviceColor },
    serviceName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.foreground, marginLeft: 8 },
    serviceDesc: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', lineHeight: 18, marginLeft: 8, marginTop: 4 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginLeft: 8, marginTop: 12 },
    price: { fontSize: 24, fontFamily: 'Inter_700Bold', color: serviceColor },
    durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    durationText: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
    sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.foreground, marginHorizontal: 20, marginBottom: 12, letterSpacing: 0.3 },
    dateScroll: { paddingLeft: 20, marginBottom: 20 },
    dateChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: colors.radius, borderWidth: 1.5, borderColor: colors.border, marginRight: 8, alignItems: 'center', minWidth: 70 },
    dateChipActive: { backgroundColor: serviceColor, borderColor: serviceColor },
    dayLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground, textTransform: 'uppercase' },
    dayLabelActive: { color: 'rgba(255,255,255,0.8)' },
    dateNum: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.foreground, marginTop: 2 },
    dateNumActive: { color: '#fff' },
    stylistCard: { borderRadius: colors.radius + 2, borderWidth: 1.5, borderColor: colors.border, padding: 12, marginRight: 12, alignItems: 'center', minWidth: 90 },
    stylistCardActive: { borderColor: serviceColor, backgroundColor: `${serviceColor}0F` },
    stylistAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    stylistAvatarActive: { backgroundColor: `${serviceColor}20` },
    stylistInitial: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.mutedForeground },
    stylistInitialActive: { color: serviceColor },
    stylistName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.foreground, textAlign: 'center' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 },
    ratingText: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
    slotChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: colors.radius, borderWidth: 1.5, borderColor: colors.border, minWidth: 80, alignItems: 'center' },
    slotChipActive: { backgroundColor: serviceColor, borderColor: serviceColor },
    slotText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    slotTextActive: { color: '#fff' },
    hint: { textAlign: 'center', color: colors.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 13, paddingHorizontal: 20, marginBottom: 20 },
    footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: bottomPad + 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
    continueBtn: { backgroundColor: serviceColor, borderRadius: colors.radius, paddingVertical: 15, alignItems: 'center' },
    continueBtnDisabled: { opacity: 0.4 },
    continueText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  });

  const formatDayLabel = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const formatDayNum = (d: string) => new Date(d + 'T00:00:00').getDate().toString();

  if (loadingService) {
    return <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (!service) {
    return <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}><Text style={{ color: colors.mutedForeground }}>Service not found</Text></View>;
  }

  return (
    <View style={s.container}>
      <Stack.Screen options={{ title: 'Book Appointment', headerBackTitle: 'Services' }} />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.serviceCard}>
          <View style={s.colorBar} />
          <Text style={s.serviceName}>{service.name}</Text>
          <Text style={s.serviceDesc}>{service.description}</Text>
          <View style={s.priceRow}>
            <Text style={s.price}>${service.price}</Text>
            <View style={s.durationRow}>
              <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
              <Text style={s.durationText}>{service.duration} min</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dateScroll}>
          {days.map((d) => (
            <TouchableOpacity key={d} style={[s.dateChip, selectedDate === d && s.dateChipActive]} onPress={() => handleDateSelect(d)}>
              <Text style={[s.dayLabel, selectedDate === d && s.dayLabelActive]}>{formatDayLabel(d)}</Text>
              <Text style={[s.dateNum, selectedDate === d && s.dateNumActive]}>{formatDayNum(d)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.sectionTitle}>Choose Stylist</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, paddingBottom: 4, marginBottom: 24 }}>
          {stylists.map((st) => (
            <TouchableOpacity key={st.id} style={[s.stylistCard, selectedStylistId === st.id && s.stylistCardActive]} onPress={() => handleStylistSelect(st.id)}>
              <View style={[s.stylistAvatar, selectedStylistId === st.id && s.stylistAvatarActive]}>
                <Text style={[s.stylistInitial, selectedStylistId === st.id && s.stylistInitialActive]}>{st.name.charAt(0)}</Text>
              </View>
              <Text style={s.stylistName}>{st.name.split(' ')[0]}</Text>
              <View style={s.ratingRow}>
                <Ionicons name="star" size={11} color="#f59e0b" />
                <Text style={s.ratingText}>{st.rating.toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
              >
                <Text style={[s.slotText, selectedSlotId === slot.id && s.slotTextActive]}>{slot.startTime}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{ height: 120 }} />
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
    </View>
  );
}
