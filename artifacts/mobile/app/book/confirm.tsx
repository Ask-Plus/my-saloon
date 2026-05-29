import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetAppointment } from '@workspace/api-client-react';

export default function ConfirmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { appointmentId: apptIdStr } = useLocalSearchParams<{ appointmentId: string }>();
  const appointmentId = parseInt(apptIdStr ?? '0');

  const { data: appt } = useGetAppointment(appointmentId, { query: { enabled: appointmentId > 0 } });

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
    checkCircle: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: `${colors.primary}15`,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 3, borderColor: `${colors.primary}30`, marginBottom: 24,
    },
    title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: colors.foreground, textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 },
    subtitle: { fontSize: 15, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    card: { width: '100%', backgroundColor: colors.card, borderRadius: colors.radius + 4, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 32 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLabel: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    rowValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.foreground, flex: 1, textAlign: 'right' },
    paidRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    paidText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#22c55e' },
    homeBtn: { width: '100%', backgroundColor: colors.primary, borderRadius: colors.radius, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
    homeBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
    bookMoreBtn: { width: '100%', borderWidth: 1.5, borderColor: colors.border, borderRadius: colors.radius, paddingVertical: 15, alignItems: 'center' },
    bookMoreText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    bottomPad: { height: bottomPad },
  });

  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={s.checkCircle}>
          <Text style={{ fontSize: 52, color: colors.primary }}>✓</Text>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
        <Text style={s.title}>Booking Confirmed!</Text>
        <Text style={s.subtitle}>Your appointment has been confirmed.{'\n'}We look forward to seeing you!</Text>

        {appt && (
          <View style={s.card}>
            <View style={[s.row, s.rowBorder]}><Text style={s.rowLabel}>Service</Text><Text style={s.rowValue}>{appt.serviceName}</Text></View>
            <View style={[s.row, s.rowBorder]}><Text style={s.rowLabel}>Stylist</Text><Text style={s.rowValue}>{appt.stylistName}</Text></View>
            <View style={[s.row, s.rowBorder]}><Text style={s.rowLabel}>Date</Text><Text style={s.rowValue}>{formatDate(appt.date)}</Text></View>
            <View style={[s.row, s.rowBorder]}><Text style={s.rowLabel}>Time</Text><Text style={s.rowValue}>{appt.startTime} – {appt.endTime}</Text></View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Amount Paid</Text>
              <View style={s.paidRow}>
                <Text style={{ fontSize: 14, color: '#22c55e' }}>✓</Text>
                <Text style={s.paidText}>${appt.servicePrice}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={s.homeBtn} onPress={() => { Haptics.selectionAsync(); router.replace('/(customer)/appointments'); }}>
          <Text style={s.homeBtnText}>View My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.bookMoreBtn} onPress={() => router.replace('/(customer)')}>
          <Text style={s.bookMoreText}>Book Another Service</Text>
        </TouchableOpacity>
      </Animated.View>
      <View style={s.bottomPad} />
    </View>
  );
}
