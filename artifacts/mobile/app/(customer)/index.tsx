import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { Service } from '@/types';
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

const CATEGORY_EMOJI: Record<string, string> = {
  All: '◈', Hair: '✂', Nails: '💅', Skin: '✨', Beauty: '💄',
};

const CATEGORY_COLOR: Record<string, string> = {
  Hair: '#B5566A', Nails: '#C9934A', Skin: '#7B9E87', Beauty: '#9B7EC8',
};

function ServiceCard({ service }: { service: Service }) {
  const colors = useColors();
  const accent = CATEGORY_COLOR[service.category] ?? colors.primary;

  const s = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginHorizontal: 16,
      marginBottom: 14,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    accentBar: { height: 5, backgroundColor: accent },
    body: { padding: 16 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    name: { fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.foreground, flex: 1, marginRight: 12, lineHeight: 22 },
    priceWrap: { backgroundColor: `${accent}18`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    price: { fontSize: 18, fontFamily: 'Inter_700Bold', color: accent },
    desc: { fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', lineHeight: 19, marginBottom: 14 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaEmoji: { fontSize: 13 },
    metaText: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
    catBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: `${accent}15` },
    catText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: accent },
    bookBtn: {
      backgroundColor: accent,
      borderRadius: 10,
      paddingVertical: 9,
      paddingHorizontal: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    bookText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  });

  return (
    <TouchableOpacity
      style={s.card}
      onPress={() => { Haptics.selectionAsync(); router.push(`/book/${service.id}`); }}
      activeOpacity={0.93}
    >
      <View style={s.accentBar} />
      <View style={s.body}>
        <View style={s.topRow}>
          <Text style={s.name}>{service.name}</Text>
          <View style={s.priceWrap}>
            <Text style={s.price}>${service.price}</Text>
          </View>
        </View>
        <Text style={s.desc} numberOfLines={2}>{service.description}</Text>
        <View style={s.footer}>
          <View style={s.meta}>
            <View style={s.metaItem}>
              <Text style={s.metaEmoji}>⏱</Text>
              <Text style={s.metaText}>{service.duration} min</Text>
            </View>
            <View style={s.catBadge}>
              <Text style={s.catText}>{CATEGORY_EMOJI[service.category] ?? '◈'} {service.category}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.bookBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(`/book/${service.id}`); }}>
            <Text style={s.bookText}>Book  →</Text>
          </TouchableOpacity>
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
  const bottomPad = Platform.OS === 'android'
    ? insets.bottom + 16
    : insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 72;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: 20,
      backgroundColor: colors.primary,
    },
    greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter_500Medium', marginBottom: 2 },
    title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.5 },
    searchWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12,
      paddingHorizontal: 14, marginTop: 16, height: 46,
    },
    searchEmoji: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15, color: '#1a1a1a', fontFamily: 'Inter_400Regular' },
    clearBtn: { padding: 4 },
    clearText: { fontSize: 16, color: colors.mutedForeground },
    catScroll: { paddingHorizontal: 16, paddingVertical: 14 },
    catBtn: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      marginRight: 8, backgroundColor: colors.muted,
      flexDirection: 'row', alignItems: 'center', gap: 5,
    },
    catBtnActive: { backgroundColor: colors.primary },
    catEmoji: { fontSize: 13 },
    catText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.mutedForeground },
    catTextActive: { color: '#fff' },
    listContent: { paddingTop: 4, paddingBottom: bottomPad },
    emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
    emptyEmoji: { fontSize: 48 },
    emptyText: { fontSize: 16, color: colors.mutedForeground, fontFamily: 'Inter_500Medium' },
    countText: { fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular', paddingHorizontal: 20, paddingBottom: 8 },
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.greeting}>Welcome back, {user?.name?.split(' ')[0]} 👋</Text>
        <Text style={s.title}>Our Services</Text>
        <View style={s.searchWrap}>
          <Text style={s.searchEmoji}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search services..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity style={s.clearBtn} onPress={() => setSearch('')}>
              <Text style={s.clearText}>✕</Text>
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
            <Text style={s.catEmoji}>{CATEGORY_EMOJI[cat] ?? '◈'}</Text>
            <Text style={[s.catText, selectedCat === cat && s.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!isLoading && filtered.length > 0 && (
        <Text style={s.countText}>{filtered.length} service{filtered.length !== 1 ? 's' : ''} available</Text>
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <ServiceCard service={item} />}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyEmoji}>🔍</Text>
              <Text style={s.emptyText}>No services found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
