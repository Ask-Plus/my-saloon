import { useColors } from '@/hooks/useColors';
import { Service } from '@/types';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetServices, useCreateService, useUpdateService, useDeleteService,
  getGetServicesQueryKey,
} from '@workspace/api-client-react';

const CATEGORIES = ['Hair', 'Nails', 'Skin', 'Beauty', 'Other'];

function ServiceModal({ visible, onClose, onSave, initial }: {
  visible: boolean; onClose: () => void;
  onSave: (service: Omit<Service, 'id' | 'createdAt'>) => void;
  initial?: Service | null;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [duration, setDuration] = useState(initial ? String(initial.duration) : '');
  const [category, setCategory] = useState(initial?.category ?? 'Hair');

  React.useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setDescription(initial?.description ?? '');
      setPrice(initial ? String(initial.price) : '');
      setDuration(initial ? String(initial.duration) : '');
      setCategory(initial?.category ?? 'Hair');
    }
  }, [visible, initial]);

  const handleSave = () => {
    if (!name.trim() || !price || !duration) { Alert.alert('Missing fields', 'Please fill in all required fields.'); return; }
    onSave({ name: name.trim(), description: description.trim(), price: parseFloat(price), duration: parseInt(duration), category });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 20, maxHeight: '92%' },
    handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.foreground },
    label: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.mutedForeground, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
    input: { borderWidth: 1.5, borderColor: colors.border, borderRadius: colors.radius, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.foreground, fontFamily: 'Inter_400Regular', backgroundColor: colors.card },
    row2: { flexDirection: 'row', gap: 12 },
    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border },
    catBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    catTextActive: { color: '#fff' },
    saveBtn: { margin: 20, marginBottom: 0, backgroundColor: colors.primary, borderRadius: colors.radius, paddingVertical: 15, alignItems: 'center' },
    saveText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
    bodyScroll: { paddingHorizontal: 20 },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.header}>
            <Text style={s.headerTitle}>{initial ? 'Edit Service' : 'New Service'}</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={colors.foreground} /></TouchableOpacity>
          </View>
          <ScrollView style={s.bodyScroll} keyboardShouldPersistTaps="handled">
            <Text style={s.label}>Service Name *</Text>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder="e.g. Haircut & Styling" placeholderTextColor={colors.mutedForeground} />
            <Text style={s.label}>Description</Text>
            <TextInput style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Describe this service..." placeholderTextColor={colors.mutedForeground} multiline />
            <View style={s.row2}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Price ($) *</Text>
                <TextInput style={s.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Duration (min) *</Text>
                <TextInput style={s.input} value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholder="60" placeholderTextColor={colors.mutedForeground} />
              </View>
            </View>
            <Text style={s.label}>Category</Text>
            <View style={s.catRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} style={[s.catBtn, category === c && s.catBtnActive]} onPress={() => setCategory(c)}>
                  <Text style={[s.catText, category === c && s.catTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveText}>{initial ? 'Save Changes' : 'Add Service'}</Text>
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function OwnerServicesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const { data: services = [] } = useGetServices();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetServicesQueryKey() });

  const createMutation = useCreateService({ mutation: { onSuccess: invalidate } });
  const updateMutation = useUpdateService({ mutation: { onSuccess: invalidate } });
  const deleteMutation = useDeleteService({ mutation: { onSuccess: invalidate } });

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80;

  const handleSave = (data: Omit<Service, 'id' | 'createdAt'>) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate({ data });
    }
    setModalVisible(false);
    setEditing(null);
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Service', `Delete "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate({ id }) },
    ]);
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: colors.foreground, letterSpacing: -0.5 },
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    card: {
      backgroundColor: colors.card, borderRadius: colors.radius + 2,
      marginHorizontal: 20, marginBottom: 10,
      borderWidth: 1, borderColor: colors.border,
      flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
    },
    categoryDot: { width: 10, height: 10, borderRadius: 5 },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.foreground },
    cardMeta: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', marginTop: 2 },
    priceText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.foreground, marginRight: 8 },
    actionRow: { flexDirection: 'row', gap: 8 },
    listContent: { paddingTop: 16, paddingBottom: bottomPad },
  });

  const catColor: Record<string, string> = { Hair: '#B5566A', Nails: '#C9934A', Skin: '#7B9E87', Beauty: '#9B7EC8', Other: '#6B7280' };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Services</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => { setEditing(null); setModalVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
          <Feather name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.listContent}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={[s.categoryDot, { backgroundColor: catColor[item.category] ?? '#6B7280' }]} />
            <View style={s.cardInfo}>
              <Text style={s.cardName}>{item.name}</Text>
              <Text style={s.cardMeta}>{item.category} · {item.duration} min</Text>
            </View>
            <Text style={s.priceText}>${item.price}</Text>
            <View style={s.actionRow}>
              <TouchableOpacity onPress={() => { setEditing(item); setModalVisible(true); }}>
                <Feather name="edit-2" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
                <Feather name="trash-2" size={18} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="cut-outline" size={48} color={colors.border} />
            <Text style={{ color: colors.mutedForeground, marginTop: 12, fontFamily: 'Inter_500Medium' }}>No services yet</Text>
          </View>
        }
      />

      <ServiceModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
      />
    </View>
  );
}
