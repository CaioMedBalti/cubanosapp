import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import type { PairingOfTheDay } from '@/lib/discoveryCuration';

export function PairingOfTheDayCard({ pairing }: { pairing: PairingOfTheDay }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: withAlpha(theme.card, 0.8), borderColor: withAlpha(theme.border, 0.4) },
      ]}
    >
      <Text style={[styles.eyebrow, { color: theme.accent }]}>HARMONIZAÇÃO DO DIA</Text>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.emoji}>🍃</Text>
          <Text style={[styles.itemBrand, { color: theme.accent }]} numberOfLines={1}>
            {pairing.cigar.brand}
          </Text>
          <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
            {pairing.cigar.name}
          </Text>
        </View>
        <Text style={[styles.plus, { color: theme.textMuted }]}>+</Text>
        <View style={styles.item}>
          <Text style={styles.emoji}>🥃</Text>
          <Text style={[styles.itemBrand, { color: theme.accentDim }]} numberOfLines={1}>
            {pairing.whisky.brand}
          </Text>
          <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
            {pairing.whisky.name}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  emoji: { fontSize: 26 },
  itemBrand: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  itemName: { fontSize: 13, fontWeight: '700' },
  plus: { fontSize: 16, fontWeight: '800', marginHorizontal: 4 },
});
