import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ListRenderItem,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { AnilhaRating } from '@/components/ui/AnilhaRating';
import { withAlpha } from '@/lib/theme';
import { useCatalog, CatalogItem } from '@/hooks/useCatalog';

function DiscoverCard({ item }: { item: CatalogItem }) {
  const theme = useTheme();
  const isWhisky = item.itemType === 'whisky';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: withAlpha(theme.border, 0.4),
          shadowColor: theme.accent,
        },
      ]}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: withAlpha(theme.accent, 0.5) }]} />

      <View style={[styles.iconBox, { backgroundColor: withAlpha(theme.accent, 0.1) }]}>
        <Text style={styles.iconText}>{isWhisky ? '🥃' : '🍃'}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.brand, { color: theme.accent }]}>
          {isWhisky ? (item as any).brand : (item as any).brand}
        </Text>
        <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>
          {isWhisky
            ? `${(item as any).region}${(item as any).age ? ` · ${(item as any).age} anos` : ''}`
            : `${(item as any).origin} · ${(item as any).strength}`}
        </Text>
        <AnilhaRating rating={item.communityRating} size={24} readonly />
        <View style={styles.tags}>
          {item.flavorNotes.slice(0, 3).map((n) => (
            <View
              key={n}
              style={[
                styles.tag,
                {
                  backgroundColor: withAlpha(theme.accent, 0.07),
                  borderColor: withAlpha(theme.accent, 0.15),
                },
              ]}
            >
              <Text style={[styles.tagText, { color: theme.textMuted }]}>{n}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function DiscoverScreen() {
  const theme = useTheme();
  const { items, loading } = useCatalog();
  const [query, setQuery] = useState('');

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.brand.toLowerCase().includes(query.toLowerCase()),
  );

  const renderItem: ListRenderItem<CatalogItem> = ({ item }) => (
    <DiscoverCard item={item} />
  );

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Discover</Text>
        </View>

        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: withAlpha(theme.surface, 0.9),
                borderColor: withAlpha(theme.border, 0.5),
              },
            ]}
          >
            <Ionicons name="search" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Buscar charutos e whiskies…"
              placeholderTextColor={theme.textMuted}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyIcon, { color: withAlpha(theme.accent, 0.4) }]}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {query ? 'Sem resultados' : 'Catálogo vazio'}
            </Text>
            {!query && (
              <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
                Use o botão Seed no Perfil para adicionar produtos ao catálogo.
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </VideoBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  searchContainer: { padding: 16, paddingBottom: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  list: { padding: 16, paddingTop: 8, gap: 10, paddingBottom: 24 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  accentBar: { width: 3 },
  iconBox: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 22 },
  cardContent: { flex: 1, padding: 12, gap: 6 },
  brand: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontSize: 11 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyHint: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
