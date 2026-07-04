import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { AnilhaRating } from '@/components/ui/AnilhaRating';
import type { CatalogItem } from '@/hooks/useCatalog';

export function DiscoverCard({ item }: { item: CatalogItem }) {
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

const styles = StyleSheet.create({
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
});
