import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Service } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetServices } from '@workspace/api-client-react';

const CATEGORY_ICONS: Record<string, string> = {
  All: 'grid-outline',
  Hair: 'cut-outline',
  Nails: 'color-palette-outline',
  Skin: 'sparkles-outline',
  Beauty: 'star-outline',
};

function ServiceCard({ service }: { service: Service }) {
  const colors = useColors();
  const categoryColor = {
    Hair: '#B5566A',
    Nails: '#C9934A',
    Skin: '#7B9E87',
    Beauty: '#9B7EC8',
  }[service.category] ?? colors.primary;

  const s = StyleSheet.create({
    card: {
      backgroundColor: colors.card, borderRadius: colors.radius + 4,
      marginHorizontal: 20, marginBottom: 12, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.border,
    },
    colorBar: { height: 4, backgroundColor: categoryColor },
    body: { padding: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    name: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.foreground, flex: 1, marginRight: 8 },
    price: { fontSize: 20, fontFamily: 'Inter_700Bold', color: categoryColor },
    desc: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 12 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    durationText: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${categoryColor}18` },
    badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: categoryColor },
    bookBtn: {
      backgroundColor: categoryColor, borderRadius: colors.radius,
      paddingVertical: 10, paddingHorizontal: 18,
      flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    bookText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  });

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => { Haptics.selectionAsync(); router.push(`/book/${service.id}`); }}
      activeOpacity={0.92}
    >
      <View style={s.colorBar} />
      <View style={s.body}>
        <View style={s.header}>
          <Text style={s.name}>{service.name}</Text>
          <Text style={s.price}>${service.price}</Text>
        </View>
        <Text style={s.desc} numberOfLines={2}>{service.description}</Text>
        <View style={s.footer}>
          <View style={s.durationRow}>
            <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
            <Text style={s.durationText}>{service.duration} min</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={s.badge}><Text style={s.badgeText}>{service.category}</Text></View>
            <TouchableOpacity style={s.bookBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/book/${service.id}`); }}>
              <Text style={s.bookText}>Book</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CustomerHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: services = [], isLoading } = useGetServices();
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map((s) => s.category)));
    return ['All', ...cats];
  }, [services]);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchCat = selectedCat === 'All' || s.category === selectedCat;
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [services, selectedCat, search]);

  const topPad = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 80;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 16,
      backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    greeting: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginBottom: 2 },
    title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: colors.foreground, letterSpacing: -0.5 },
    searchWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.muted, borderRadius: colors.radius,
      paddingHorizontal: 12, marginTop: 16, height: 44,
    },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: colors.foreground, fontFamily: 'Inter_400Regular' },
    catScroll: { paddingHorizontal: 20, paddingVertical: 16 },
    catBtn: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      marginRight: 8, backgroundColor: colors.muted,
      flexDirection: 'row', alignItems: 'center', gap: 5,
    },
    catBtnActive: { backgroundColor: colors.primary },
    catText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground },
    catTextActive: { color: '#fff' },
    listContent: { paddingBottom: bottomPad },
    emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 16, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.greeting}>Welcome back, {user?.name?.split(' ')[0]}</Text>
        <Text style={s.title}>Our Services</Text>
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
          <TextInput
            style={s.searchInput}
            placeholder="Search services..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.catBtn, selectedCat === cat && s.catBtnActive]}
            onPress={() => { setSelectedCat(cat); Haptics.selectionAsync(); }}
          >
            <Ionicons
              name={(CATEGORY_ICONS[cat] ?? 'ellipse-outline') as any}
              size={14}
              color={selectedCat === cat ? '#fff' : colors.mutedForeground}
            />
            <Text style={[s.catText, selectedCat === cat && s.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ServiceCard service={item} />}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Ionicons name="search-outline" size={48} color={colors.border} />
              <Text style={s.emptyText}>No services found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
