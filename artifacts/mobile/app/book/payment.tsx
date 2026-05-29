import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { BankAccount } from '@/types';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetService, useGetStylist, useGetTimeSlot, useCreateAppointment,
  getGetAppointmentsQueryKey, getGetTimeSlotsQueryKey, getGetDashboardStatsQueryKey,
} from '@workspace/api-client-react';

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return '';
}

export default function PaymentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { serviceId: sid, slotId: slid, stylistId: stid, notes } = useLocalSearchParams<{ serviceId: string; slotId: string; stylistId: string; notes?: string }>();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const serviceId = parseInt(sid ?? '0');
  const slotId = parseInt(slid ?? '0');
  const stylistId = parseInt(stid ?? '0');

  const { data: service } = useGetService(serviceId, { query: { enabled: serviceId > 0 } });
  const { data: stylist } = useGetStylist(stylistId, { query: { enabled: stylistId > 0 } });
  const { data: slot } = useGetTimeSlot(slotId, { query: { enabled: slotId > 0 } });

  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [bankLoading, setBankLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${getApiBase()}/api/bank-accounts/public`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setBankAccount(data); })
      .catch(() => { setBankAccount(null); })
      .finally(() => setBankLoading(false));
  }, []);

  const createAppointment = useCreateAppointment({
    mutation: {
      onSuccess: (appt) => {
        queryClient.invalidateQueries({ queryKey: getGetAppointmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTimeSlotsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        showNotification('success', 'Booking Confirmed!', `${service?.name} on ${slot?.date} is booked.`);
        router.replace(`/book/confirm?appointmentId=${appt.id}`);
      },
      onError: () => {
        showNotification('error', 'Booking failed', 'Please try again.');
        setLoading(false);
      },
    },
  });

  const handleConfirmPayment = async () => {
    if (!service || !stylist || !slot || !user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    createAppointment.mutate({
      data: {
        customerId: user.id,
        customerName: user.name,
        customerPhone: user.phone,
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price,
        stylistId: stylist.id,
        stylistName: stylist.name,
        slotId: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'confirmed',
        paymentStatus: 'pending',
        notes: notes || undefined,
      },
    });
  };

  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);
  const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    section: { margin: 20, marginBottom: 0 },
    sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
    summaryCard: { backgroundColor: colors.card, borderRadius: colors.radius + 4, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    summaryLabel: { fontSize: 14, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    summaryValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
    totalLabel: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.foreground },
    totalValue: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.primary },
    bankCard: { backgroundColor: colors.card, borderRadius: colors.radius + 4, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 20 },
    bankHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    bankHeaderText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.foreground },
    bankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    bankRowLast: { borderBottomWidth: 0 },
    bankLabel: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    bankValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.foreground, flex: 1, textAlign: 'right' },
    instructionBox: {
      backgroundColor: `${colors.primary}10`, borderRadius: colors.radius,
      padding: 14, marginBottom: 20, borderWidth: 1, borderColor: `${colors.primary}25`,
    },
    instructionText: { fontSize: 13, color: colors.foreground, fontFamily: 'Inter_400Regular', lineHeight: 20 },
    noBankBox: {
      backgroundColor: '#f59e0b18', borderRadius: colors.radius,
      padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#f59e0b40',
      flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    },
    noBankText: { fontSize: 13, color: colors.foreground, fontFamily: 'Inter_400Regular', lineHeight: 20, flex: 1 },
    checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
    checkbox: {
      width: 22, height: 22, borderRadius: 6, borderWidth: 2,
      borderColor: colors.primary, alignItems: 'center', justifyContent: 'center',
      marginTop: 1,
    },
    checkboxChecked: { backgroundColor: colors.primary },
    checkboxLabel: { flex: 1, fontSize: 13, color: colors.foreground, fontFamily: 'Inter_400Regular', lineHeight: 20 },
    footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: bottomPad + 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
    payBtn: { backgroundColor: colors.primary, borderRadius: colors.radius, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
    payBtnDisabled: { backgroundColor: colors.muted },
    payText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
    payTextDisabled: { color: colors.mutedForeground },
  });

  if (!service || !stylist || !slot) {
    return <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  const canConfirm = confirmed && !loading && !createAppointment.isPending;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Stack.Screen options={{ title: 'Payment', headerBackTitle: 'Back' }} />
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={s.section}>
          <Text style={s.sectionTitle}>Booking Summary</Text>
          <View style={s.summaryCard}>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Service</Text><Text style={s.summaryValue}>{service.name}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Stylist</Text><Text style={s.summaryValue}>{stylist.name}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Date</Text><Text style={s.summaryValue}>{formatDate(slot.date)}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Time</Text><Text style={s.summaryValue}>{slot.startTime} – {slot.endTime}</Text></View>
            {notes ? (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Notes</Text>
                <Text style={[s.summaryValue, { flex: 1, textAlign: 'right', maxWidth: '65%' }]} numberOfLines={2}>{notes}</Text>
              </View>
            ) : null}
            <View style={s.divider} />
            <View style={s.summaryRow}><Text style={s.totalLabel}>Total</Text><Text style={s.totalValue}>${service.price}</Text></View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Bank Transfer Payment</Text>

          {bankLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
          ) : bankAccount ? (
            <>
              <View style={s.bankCard}>
                <View style={s.bankHeader}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>🏦</Text>
                  </View>
                  <Text style={s.bankHeaderText}>{bankAccount.bankName}</Text>
                </View>
                <View style={s.bankRow}>
                  <Text style={s.bankLabel}>Account Name</Text>
                  <Text style={s.bankValue}>{bankAccount.accountName}</Text>
                </View>
                <View style={[s.bankRow, s.bankRowLast]}>
                  <Text style={s.bankLabel}>IBAN</Text>
                  <Text style={s.bankValue}>{bankAccount.iban}</Text>
                </View>
              </View>

              <View style={s.instructionBox}>
                <Text style={s.instructionText}>
                  {'1. Transfer '}
                  <Text style={{ fontFamily: 'Inter_700Bold' }}>${service.price}</Text>
                  {' to the account above.\n2. Use your phone number as the transfer reference.\n3. Tap "Confirm Booking" — the salon will verify your payment.'}
                </Text>
              </View>
            </>
          ) : (
            <View style={s.noBankBox}>
              <Text style={{ fontSize: 18 }}>⚠</Text>
              <Text style={s.noBankText}>
                The salon hasn't set up bank transfer details yet. You can still confirm the booking and arrange payment at the salon.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={s.checkRow}
            onPress={() => { setConfirmed((v) => !v); Haptics.selectionAsync(); }}
            activeOpacity={0.8}
          >
            <View style={[s.checkbox, confirmed && s.checkboxChecked]}>
              {confirmed && <Text style={{ fontSize: 13, color: '#fff', fontWeight: 'bold' }}>✓</Text>}
            </View>
            <Text style={s.checkboxLabel}>
              I have transferred the payment (or will pay at the salon) and agree to the booking terms.
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.payBtn, !canConfirm && s.payBtnDisabled]}
          onPress={handleConfirmPayment}
          disabled={!canConfirm}
          activeOpacity={0.85}
        >
          {loading || createAppointment.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={{ fontSize: 18, color: canConfirm ? '#fff' : colors.mutedForeground }}>✓</Text>
              <Text style={[s.payText, !canConfirm && s.payTextDisabled]}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
