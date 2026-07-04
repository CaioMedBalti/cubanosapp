import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { AnilhaRating } from '@/components/ui/AnilhaRating';
import { CigarCatalog } from '@/lib/firebase';

export function CompactCatalogCard({ item }: { item: CigarCatalog }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: withAlpha(theme.border, 0.4) },
      ]}
    >
      <Text style={[styles.brand, { color: theme.accent }]} numberOfLines={1}>
        {item.brand.toUpperCase()}
      </Text>
      <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[styles.meta, { color: theme.textMuted }]} numberOfLines={1}>
        {item.origin} · {item.strength}
      </Text>
      <AnilhaRating rating={item.communityRating} size={16} readonly />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  brand: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  name: { fontSize: 13, fontWeight: '700', minHeight: 32 },
  meta: { fontSize: 11 },
});
