import { useColors } from '@/hooks/useColors';
import { Stylist } from '@/types';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetStylists, useCreateStylist, useUpdateStylist, useDeleteStylist,
  getGetStylistsQueryKey,
} from '@workspace/api-client-react';

function StylistModal({ visible, onClose, onSave, initial }: {
  visible: boolean; onClose: () => void;
  onSave: (s: Omit<Stylist, 'id' | 'createdAt'>) => void;
  initial?: Stylist | null;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initial?.name ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [specialtiesStr, setSpecialtiesStr] = useState(initial?.specialties.join(', ') ?? '');

  React.useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setTitle(initial?.title ?? '');
      setSpecialtiesStr(initial?.specialties.join(', ') ?? '');
    }
  }, [visible, initial]);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Required', 'Stylist name is required.'); return; }
    const specialties = specialtiesStr.split(',').map((s) => s.trim()).filter(Boolean);
    onSave({ name: name.trim(), title: title.trim() || 'Stylist', specialties, rating: initial?.rating ?? 5.0, reviewCount: initial?.reviewCount ?? 0 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 20 },
    handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.foreground },
    body: { padding: 20 },
    label: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
    input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: colors.radius, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.foreground, fontFamily: 'Inter_400Regular', backgroundColor: colors.card },
    hint: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 6 },
    saveBtn: { marginTop: 24, backgroundColor: colors.primary, borderRadius: colors.radius, paddingVertical: 15, alignItems: 'center' },
    saveText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={s.headerTitle}>{initial ? 'Edit Stylist' : 'Add Stylist'}</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 20, color: colors.foreground }}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={s.body} keyboardShouldPersistTaps="handled">
            <Text style={s.label}>Full Name *</Text>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. Sarah Al-Hassan" placeholderTextColor={colors.mutedForeground} autoCapitalize="words" />
            <Text style={s.label}>Title / Role</Text>
            <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g. Senior Hair Stylist" placeholderTextColor={colors.mutedForeground} />
            <Text style={s.label}>Specialties</Text>
            <TextInput style={s.input} value={specialtiesStr} onChangeText={setSpecialtiesStr} placeholder="e.g. Hair Color, Balayage, Haircuts" placeholderTextColor={colors.mutedForeground} />
            <Text style={s.hint}>Separate specialties with commas</Text>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveText}>{initial ? 'Save Changes' : 'Add Stylist'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function OwnerStylistsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Stylist | null>(null);

  const { data: stylists = [] } = useGetStylists();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetStylistsQueryKey() });
  const createMutation = useCreateStylist({ mutation: { onSuccess: invalidate } });
  const updateMutation = useUpdateStylist({ mutation: { onSuccess: invalidate } });
  const deleteMutation = useDeleteStylist({ mutation: { onSuccess: invalidate } });

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = Platform.OS === 'android'
    ? insets.bottom + 16
    : insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 72;

  const handleSave = (data: Omit<Stylist, 'id' | 'createdAt'>) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate({ data });
    setModalVisible(false);
    setEditing(null);
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Remove Stylist', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: colors.foreground },
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    card: { backgroundColor: colors.card, borderRadius: colors.radius + 4, marginHorizontal: 20, marginBottom: 10, borderWidth: 1, borderColor: colors.border, padding: 16 },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.primary },
    nameCol: { flex: 1 },
    stylistName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.foreground },
    stylistTitle: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    reviewText: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' },
    specialtiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
    specialtyChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${colors.primary}15` },
    specialtyText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.primary },
    actions: { flexDirection: 'row', gap: 10, marginTop: 12, justifyContent: 'flex-end' },
    listContent: { paddingTop: 16, paddingBottom: bottomPad },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Stylists</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => { setEditing(null); setModalVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
          <Text style={{ fontSize: 24, color: '#fff', lineHeight: 28 }}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={stylists}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View style={s.avatar}><Text style={s.avatarText}>{item.name.charAt(0)}</Text></View>
              <View style={s.nameCol}>
                <Text style={s.stylistName}>{item.name}</Text>
                <Text style={s.stylistTitle}>{item.title}</Text>
              </View>
              <View>
                <View style={s.ratingRow}>
                  <Text style={{ fontSize: 12 }}>⭐</Text>
                  <Text style={s.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
                <Text style={s.reviewText}>{item.reviewCount} reviews</Text>
              </View>
            </View>
            <View style={s.specialtiesWrap}>
              {item.specialties.map((sp) => (
                <View key={sp} style={s.specialtyChip}><Text style={s.specialtyText}>{sp}</Text></View>
              ))}
            </View>
            <View style={s.actions}>
              <TouchableOpacity onPress={() => { setEditing(item); setModalVisible(true); }}>
                <Text style={{ fontSize: 16, color: colors.mutedForeground }}>✏</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
                <Text style={{ fontSize: 16, color: colors.destructive }}>🗑</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48 }}>💇</Text>
            <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: 'Inter_500Medium' }}>No stylists yet</Text>
          </View>
        }
      />
      <StylistModal visible={modalVisible} onClose={() => { setModalVisible(false); setEditing(null); }} onSave={handleSave} initial={editing} />
    </View>
  );
}
