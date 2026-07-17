import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { AnilhaRating } from '@/components/ui/AnilhaRating';
import { STRENGTH_FELT_OPTIONS } from '@/constants/flavorNotes';
import type { TastingPhase } from '@/lib/firebase';

interface TastingCardProps {
  cigarName: string;
  brand?: string;
  rating: number;
  // Escala 0–10 do fluxo novo — quando presente, exibida junto às anilhas.
  rating10?: number;
  notes?: string;
  flavorNotes?: string[];
  date?: string;
  // Degustação ao vivo: timeline dos três terços (smokeMode 'live').
  phases?: TastingPhase[];
  durationSec?: number;
  style?: ViewStyle;
}

const THIRD_LABELS = ['1º terço', '2º terço', '3º terço'] as const;

function strengthLabel(value: TastingPhase['strengthFelt']): string | null {
  return STRENGTH_FELT_OPTIONS.find((o) => o.value === value)?.label ?? null;
}

export function TastingCard({
  cigarName,
  brand,
  rating,
  rating10,
  notes,
  flavorNotes = [],
  date,
  phases,
  durationSec,
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

      <View style={styles.ratingRow}>
        <AnilhaRating rating={rating} size={30} readonly />
        {rating10 != null && (
          <Text style={[styles.rating10, { color: theme.accent }]}>{rating10}/10</Text>
        )}
      </View>

      {phases && phases.length > 0 && (
        <View style={[styles.phases, { borderColor: withAlpha(theme.border, 0.35) }]}>
          {durationSec != null && (
            <Text style={[styles.phasesDuration, { color: theme.textMuted }]}>
              Degustação ao vivo · {Math.round(durationSec / 60)} min
            </Text>
          )}
          {phases.map((phase) => (
            <View key={phase.third} style={styles.phaseRow}>
              <Text style={[styles.phaseLabel, { color: theme.accent }]}>
                {THIRD_LABELS[phase.third - 1]}
              </Text>
              <Text style={[styles.phaseDetail, { color: theme.textMuted }]} numberOfLines={2}>
                {[
                  phase.flavorNotes.join(', ') || null,
                  strengthLabel(phase.strengthFelt),
                  phase.comment,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </Text>
            </View>
          ))}
        </View>
      )}

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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rating10: {
    fontSize: 14,
    fontWeight: '800',
  },
  phases: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    gap: 6,
  },
  phasesDuration: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  phaseRow: {
    gap: 1,
  },
  phaseLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  phaseDetail: {
    fontSize: 12,
    lineHeight: 17,
  },
});
