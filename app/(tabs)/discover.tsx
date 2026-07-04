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
import { withAlpha } from '@/lib/theme';
import { useCatalog, CatalogItem } from '@/hooks/useCatalog';
import { DiscoverCard } from '@/components/discovery/DiscoverCard';

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
                O catálogo ainda não tem produtos cadastrados.
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
