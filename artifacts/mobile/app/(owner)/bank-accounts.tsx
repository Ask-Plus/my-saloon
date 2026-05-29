import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { BankAccount } from '@/types';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return '';
}

function useBankAccounts(ownerId: number | undefined) {
  const [accounts, setAccounts] = React.useState<BankAccount[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetch_ = React.useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/api/bank-accounts?ownerId=${ownerId}`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  React.useEffect(() => { fetch_(); }, [fetch_]);

  return { accounts, loading, refetch: fetch_ };
}

export default function BankAccountsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { accounts, loading, refetch } = useBankAccounts(user?.id);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [iban, setIban] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = Platform.OS === 'android'
    ? insets.bottom + 16
    : insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 72;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!bankName.trim()) e.bankName = 'Bank name is required';
    if (!accountName.trim()) e.accountName = 'Account holder name is required';
    if (!iban.trim()) e.iban = 'IBAN is required';
    else if (iban.replace(/\s/g, '').length < 10) e.iban = 'Enter a valid IBAN';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate() || !user) return;
    setSaving(true);
    try {
      const res = await fetch(`${getApiBase()}/api/bank-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: user.id, bankName: bankName.trim(), accountName: accountName.trim(), iban: iban.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save');
      await refetch();
      setModalVisible(false);
      setBankName(''); setAccountName(''); setIban(''); setErrors({});
      showNotification('success', 'Bank account added', 'Customers can now pay via bank transfer.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      showNotification('error', 'Failed to add account', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (account: BankAccount) => {
    Alert.alert('Remove Account', `Remove ${account.bankName} account?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await fetch(`${getApiBase()}/api/bank-accounts/${account.id}`, { method: 'DELETE' });
            await refetch();
            showNotification('info', 'Bank account removed');
          } catch {
            showNotification('error', 'Failed to remove account');
          }
        },
      },
    ]);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.foreground, letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 4 },
    infoBox: {
      margin: 20, padding: 14, borderRadius: colors.radius,
      backgroundColor: `${colors.primary}10`, borderWidth: 1, borderColor: `${colors.primary}30`,
      flexDirection: 'row', gap: 10,
    },
    infoText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.foreground, flex: 1, lineHeight: 19 },
    card: {
      marginHorizontal: 20, marginBottom: 12, padding: 16,
      backgroundColor: colors.card, borderRadius: colors.radius + 4,
      borderWidth: 1, borderColor: colors.border,
    },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    bankName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.foreground },
    ibanText: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 4 },
    accountNameText: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 },
    deleteBtn: { padding: 4 },
    addBtn: {
      margin: 20, marginTop: 8, backgroundColor: colors.primary, borderRadius: colors.radius,
      paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
    },
    addBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
    listContent: { paddingTop: 4, paddingBottom: bottomPad },
    empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
    emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.foreground, marginTop: 12, textAlign: 'center' },
    emptySub: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 6, textAlign: 'center' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: insets.bottom + 24 },
    sheetTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 20 },
    inputLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
    inputWrap: { borderWidth: 1.5, borderColor: colors.border, borderRadius: colors.radius, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card },
    inputWrapError: { borderColor: colors.destructive },
    input: { flex: 1, fontSize: 15, color: colors.foreground, fontFamily: 'Inter_400Regular' },
    errorText: { fontSize: 11, color: colors.destructive, fontFamily: 'Inter_400Regular', marginBottom: 8 },
    saveBtn: { backgroundColor: colors.primary, borderRadius: colors.radius, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    saveBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
    cancelBtn: { borderRadius: colors.radius, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
    cancelBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground },
  });

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.header}>
        <Text style={s.title}>Bank Accounts</Text>
        <Text style={s.subtitle}>Customers will pay directly to these accounts</Text>
      </View>

      <View style={s.infoBox}>
        <Text style={{ fontSize: 16, color: colors.primary }}>ℹ</Text>
        <Text style={s.infoText}>
          Add your bank account so customers can transfer payment before their appointment. You'll see the transfer reference in each booking.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={s.listContent}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.bankName}>{item.bankName}</Text>
                  <Text style={s.accountNameText}>{item.accountName}</Text>
                  <Text style={s.ibanText}>IBAN: {item.iban}</Text>
                </View>
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)}>
                  <Text style={{ fontSize: 17, color: colors.destructive }}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48 }}>🏦</Text>
              <Text style={s.emptyText}>No bank accounts yet</Text>
              <Text style={s.emptySub}>Add your bank account to enable bank transfer payments from customers.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={{ fontSize: 20, color: '#fff' }}>+</Text>
        <Text style={s.addBtnText}>Add Bank Account</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.sheet} keyboardShouldPersistTaps="handled">
            <Text style={s.sheetTitle}>Add Bank Account</Text>

            <Text style={s.inputLabel}>Bank Name</Text>
            <View style={[s.inputWrap, errors.bankName ? s.inputWrapError : undefined]}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>🏦</Text>
              <TextInput style={s.input} value={bankName} onChangeText={setBankName} placeholder="e.g. Al Rajhi Bank" placeholderTextColor={colors.mutedForeground} autoCapitalize="words" />
            </View>
            {errors.bankName ? <Text style={s.errorText}>{errors.bankName}</Text> : null}

            <Text style={s.inputLabel}>Account Holder Name</Text>
            <View style={[s.inputWrap, errors.accountName ? s.inputWrapError : undefined]}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>👤</Text>
              <TextInput style={s.input} value={accountName} onChangeText={setAccountName} placeholder="e.g. Lumina Beauty LLC" placeholderTextColor={colors.mutedForeground} autoCapitalize="words" />
            </View>
            {errors.accountName ? <Text style={s.errorText}>{errors.accountName}</Text> : null}

            <Text style={s.inputLabel}>IBAN</Text>
            <View style={[s.inputWrap, errors.iban ? s.inputWrapError : undefined]}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>💳</Text>
              <TextInput style={s.input} value={iban} onChangeText={(v) => setIban(v.toUpperCase())} placeholder="e.g. SA1234567890123456789012" placeholderTextColor={colors.mutedForeground} autoCapitalize="characters" />
            </View>
            {errors.iban ? <Text style={s.errorText}>{errors.iban}</Text> : null}

            <TouchableOpacity style={s.saveBtn} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save Account</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setModalVisible(false); setBankName(''); setAccountName(''); setIban(''); setErrors({}); }}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
