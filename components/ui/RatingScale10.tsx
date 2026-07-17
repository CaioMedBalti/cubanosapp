import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';

interface Props {
  value: number | null;
  onChange: (v: number) => void;
}

// Escala 0–10 do fluxo pós-scan/degustação ao vivo. As telas antigas seguem
// com AnilhaRating (1–5); a conversão para o feed acontece no logTasting.
export function RatingScale10({ value, onChange }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {Array.from({ length: 11 }, (_, n) => {
        const active = value === n;
        return (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? theme.accent : withAlpha(theme.accent, 0.07),
                borderColor: active ? theme.accent : withAlpha(theme.accent, 0.25),
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                { color: active ? theme.background : theme.textMuted },
              ]}
            >
              {n}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 15, fontWeight: '700' },
});
