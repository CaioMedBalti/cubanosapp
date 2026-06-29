import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { AnilhaRating } from '@/components/ui/AnilhaRating';

interface TastingCardProps {
  cigarName: string;
  brand?: string;
  rating: number;
  notes?: string;
  flavorNotes?: string[];
  date?: string;
  style?: ViewStyle;
}

export function TastingCard({
  cigarName,
  brand,
  rating,
  notes,
  flavorNotes = [],
  date,
  style,
}: TastingCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: withAlpha(theme.border, 0.5),
        },
        style,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          {brand && (
            <Text style={[styles.brand, { color: theme.accent }]}>{brand}</Text>
          )}
          <Text style={[styles.name, { color: theme.text }]}>{cigarName}</Text>
        </View>
        {date && (
          <Text style={[styles.date, { color: theme.textMuted }]}>{date}</Text>
        )}
      </View>

      <AnilhaRating rating={rating} size={30} readonly />

      {flavorNotes.length > 0 && (
        <View style={styles.tags}>
          {flavorNotes.map((note) => (
            <View
              key={note}
              style={[
                styles.tag,
                { backgroundColor: withAlpha(theme.accent, 0.1), borderColor: withAlpha(theme.accent, 0.2) },
              ]}
            >
              <Text style={[styles.tagText, { color: theme.accentDim }]}>{note}</Text>
            </View>
          ))}
        </View>
      )}

      {notes && (
        <Text style={[styles.notes, { color: theme.textMuted }]} numberOfLines={3}>
          {notes}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    marginLeft: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notes: {
    fontSize: 13,
    lineHeight: 19,
  },
});
