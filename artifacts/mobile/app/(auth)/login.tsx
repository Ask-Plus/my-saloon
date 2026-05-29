import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Role = 'customer' | 'owner';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [role, setRole] = useState<Role>('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!phone.trim()) e.phone = 'Phone is required';
    else if (phone.replace(/\D/g, '').length < 8) e.phone = 'Enter a valid phone number';
    if (role === 'owner') {
      if (!businessName.trim()) e.businessName = 'Business name is required';
      if (!licenseNumber.trim()) e.licenseNumber = 'Trade license / CR number is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await login(name.trim(), phone.trim(), role, role === 'owner' ? {
        businessName: businessName.trim(),
        licenseUrl: licenseNumber.trim(),
      } : undefined);
      if (role === 'owner') {
        router.replace('/(owner)');
      } else {
        router.replace('/(customer)');
      }
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1 },
    hero: {
      height: 220,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 28,
      paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0),
    },
    heroImage: { position: 'absolute', width: '100%', height: '100%', opacity: 0.3 },
    logoCircle: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 12,
      borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    },
    logoEmoji: { fontSize: 32 },
    heroTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.5 },
    heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontFamily: 'Inter_400Regular' },
    body: { padding: 24 },
    roleRow: {
      flexDirection: 'row', gap: 10, marginBottom: 24,
      backgroundColor: colors.muted, borderRadius: colors.radius,
      padding: 4,
    },
    roleBtn: {
      flex: 1, paddingVertical: 12, borderRadius: colors.radius - 2,
      alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
    },
    roleBtnActive: { backgroundColor: colors.primary },
    roleEmoji: { fontSize: 16 },
    roleBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground },
    roleBtnTextActive: { color: '#fff' },
    label: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.border,
      borderRadius: colors.radius, paddingHorizontal: 14,
      marginBottom: 16, backgroundColor: colors.card, height: 52,
    },
    inputWrapError: { borderColor: colors.destructive },
    inputEmoji: { fontSize: 18, marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: colors.foreground, fontFamily: 'Inter_400Regular' },
    errorText: { fontSize: 12, color: colors.destructive, marginTop: -12, marginBottom: 10, fontFamily: 'Inter_400Regular' },
    sectionHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: `${colors.primary}10`, borderRadius: colors.radius,
      padding: 14, marginBottom: 16, borderWidth: 1, borderColor: `${colors.primary}25`,
    },
    sectionEmoji: { fontSize: 20 },
    sectionHeaderText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.primary, flex: 1 },
    verifyNote: {
      fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular',
      lineHeight: 18, marginBottom: 16, paddingHorizontal: 2,
    },
    btn: {
      backgroundColor: colors.primary, borderRadius: colors.radius,
      paddingVertical: 16, alignItems: 'center', marginTop: 4,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    btnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.3 },
    footerNote: { textAlign: 'center', marginTop: 20, fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', lineHeight: 18 },
    logoFooter: { alignItems: 'center', marginTop: 28, marginBottom: 8 },
    logoFooterImage: { width: 120, height: 48 },
    bottomPad: { height: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 16 },
  });

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Image source={require('@/assets/images/hero_salon.png')} style={s.heroImage} contentFit="cover" />
          <View style={s.logoCircle}>
            <Text style={s.logoEmoji}>✂</Text>
          </View>
          <Text style={s.heroTitle}>My Saloon</Text>
          <Text style={s.heroSub}>Your beauty, perfected</Text>
        </View>

        <View style={s.body}>
          <View style={s.roleRow}>
            {(['customer', 'owner'] as Role[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[s.roleBtn, role === r && s.roleBtnActive]}
                onPress={() => { setRole(r); setErrors({}); Haptics.selectionAsync(); }}
                activeOpacity={0.8}
              >
                <Text style={s.roleEmoji}>{r === 'customer' ? '👤' : '💼'}</Text>
                <Text style={[s.roleBtnText, role === r && s.roleBtnTextActive]}>
                  {r === 'customer' ? 'Customer' : 'Salon Owner'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Your Name</Text>
          <View style={[s.inputWrap, errors.name ? s.inputWrapError : undefined]}>
            <Text style={s.inputEmoji}>👤</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Lina Ahmed"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
          {errors.name ? <Text style={s.errorText}>{errors.name}</Text> : null}

          <Text style={s.label}>Phone Number</Text>
          <View style={[s.inputWrap, errors.phone ? s.inputWrapError : undefined]}>
            <Text style={s.inputEmoji}>📞</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. +966 5X XXX XXXX"
              placeholderTextColor={colors.mutedForeground}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType={role === 'owner' ? 'next' : 'done'}
              onSubmitEditing={role === 'customer' ? handleContinue : undefined}
            />
          </View>
          {errors.phone ? <Text style={s.errorText}>{errors.phone}</Text> : null}

          {role === 'owner' && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionEmoji}>🛡</Text>
                <Text style={s.sectionHeaderText}>Business Verification</Text>
              </View>
              <Text style={s.verifyNote}>
                To register your salon, please provide your business details and trade license number. This information will be reviewed for verification.
              </Text>

              <Text style={s.label}>Business / Salon Name</Text>
              <View style={[s.inputWrap, errors.businessName ? s.inputWrapError : undefined]}>
                <Text style={s.inputEmoji}>🏪</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. My Beauty Salon"
                  placeholderTextColor={colors.mutedForeground}
                  value={businessName}
                  onChangeText={setBusinessName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              {errors.businessName ? <Text style={s.errorText}>{errors.businessName}</Text> : null}

              <Text style={s.label}>Trade License / CR Number</Text>
              <View style={[s.inputWrap, errors.licenseNumber ? s.inputWrapError : undefined]}>
                <Text style={s.inputEmoji}>📋</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. CR-1234567890"
                  placeholderTextColor={colors.mutedForeground}
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  autoCapitalize="characters"
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                />
              </View>
              {errors.licenseNumber ? <Text style={s.errorText}>{errors.licenseNumber}</Text> : null}
            </>
          )}

          <TouchableOpacity style={s.btn} onPress={handleContinue} activeOpacity={0.85} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.btnText}>
                {role === 'customer' ? 'Continue as Customer  →' : 'Register Salon  →'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={s.footerNote}>
            By continuing, you agree to our Terms of Service{'\n'}and Privacy Policy.
          </Text>

          <View style={s.logoFooter}>
            <Image
              source={require('@/assets/images/askplus_logo.png')}
              style={s.logoFooterImage}
              contentFit="contain"
            />
          </View>
        </View>
        <View style={s.bottomPad} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
