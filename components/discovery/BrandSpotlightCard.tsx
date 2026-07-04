import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { CompactCatalogCard } from '@/components/discovery/CompactCatalogCard';
import type { BrandSpotlight } from '@/lib/discoveryCuration';

export function BrandSpotlightCard({ spotlight }: { spotlight: BrandSpotlight }) {
  const theme = useTheme();
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={[styles.eyebrow, { color: theme.accent }]}>MARCA EM DESTAQUE</Text>
        <Text style={[styles.title, { color: theme.text }]}>{spotlight.brand}</Text>
      </View>
      <FlatList
        data={spotlight.items}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CompactCatalogCard item={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  headerRow: { paddingHorizontal: 16, marginBottom: 10, gap: 2 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: 18, fontWeight: '800' },
  list: { paddingHorizontal: 16 },
});
