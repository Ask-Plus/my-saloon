import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';
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
      height: 200,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: 28,
      paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0),
    },
    heroImage: { position: 'absolute', width: '100%', height: '100%', opacity: 0.35 },
    logoCircle: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 10,
      borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    },
    heroTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.5 },
    heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontFamily: 'Inter_400Regular' },
    body: { padding: 24 },
    roleRow: {
      flexDirection: 'row', gap: 12, marginBottom: 24,
      backgroundColor: colors.muted, borderRadius: colors.radius,
      padding: 4,
    },
    roleBtn: {
      flex: 1, paddingVertical: 11, borderRadius: colors.radius - 2,
      alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
    },
    roleBtnActive: { backgroundColor: colors.primary },
    roleBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground },
    roleBtnTextActive: { color: '#fff' },
    label: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.border,
      borderRadius: colors.radius, paddingHorizontal: 16,
      marginBottom: 16, backgroundColor: colors.card,
    },
    inputWrapError: { borderColor: colors.destructive },
    input: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.foreground, fontFamily: 'Inter_400Regular' },
    errorText: { fontSize: 12, color: colors.destructive, marginTop: -12, marginBottom: 10, fontFamily: 'Inter_400Regular' },
    sectionHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: `${colors.primary}12`, borderRadius: colors.radius,
      padding: 12, marginBottom: 16, borderWidth: 1, borderColor: `${colors.primary}30`,
    },
    sectionHeaderText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary, flex: 1 },
    verifyNote: {
      fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular',
      lineHeight: 18, marginBottom: 16, paddingHorizontal: 4,
    },
    btn: {
      backgroundColor: colors.primary, borderRadius: colors.radius,
      paddingVertical: 15, alignItems: 'center', marginTop: 4,
    },
    btnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.3 },
    footerNote: { textAlign: 'center', marginTop: 18, fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', lineHeight: 18 },
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
            <Ionicons name="cut" size={28} color="#fff" />
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
                <Ionicons
                  name={r === 'customer' ? 'person' : 'briefcase'}
                  size={16}
                  color={role === r ? '#fff' : colors.mutedForeground}
                />
                <Text style={[s.roleBtnText, role === r && s.roleBtnTextActive]}>
                  {r === 'customer' ? 'Customer' : 'Salon Owner'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Your Name</Text>
          <View style={[s.inputWrap, errors.name ? s.inputWrapError : undefined]}>
            <Ionicons name="person-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
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
            <Ionicons name="call-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
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
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
                <Text style={s.sectionHeaderText}>Business Verification</Text>
              </View>
              <Text style={s.verifyNote}>
                To register your salon, please provide your business details and trade license number. This information will be reviewed for verification.
              </Text>

              <Text style={s.label}>Business / Salon Name</Text>
              <View style={[s.inputWrap, errors.businessName ? s.inputWrapError : undefined]}>
                <Ionicons name="storefront-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  style={s.input}
                  placeholder="e.g. Lumina Beauty Salon"
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
                <Ionicons name="document-text-outline" size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
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
                {role === 'customer' ? 'Continue as Customer' : 'Register Salon'}
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
