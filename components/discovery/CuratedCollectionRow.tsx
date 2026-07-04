import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '@/store/themeStore';
import { CompactCatalogCard } from '@/components/discovery/CompactCatalogCard';
import type { CuratedCollection } from '@/lib/discoveryCuration';

export function CuratedCollectionRow({ collection }: { collection: CuratedCollection }) {
  const theme = useTheme();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { color: theme.text }]}>{collection.title}</Text>
      <FlatList
        data={collection.items}
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
  title: { fontSize: 16, fontWeight: '800', paddingHorizontal: 16, marginBottom: 10 },
  list: { paddingHorizontal: 16 },
});
