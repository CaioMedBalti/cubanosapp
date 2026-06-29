import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/store/themeStore';

interface AnilhaRatingProps {
  rating: number;
  size?: number;
  color?: string;
  onRate?: (value: number) => void;
  readonly?: boolean;
}

export function AnilhaRating({
  rating,
  size = 36,
  color,
  onRate,
  readonly = false,
}: AnilhaRatingProps) {
  const theme = useTheme();
  const resolvedColor = color ?? theme.accent;

  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }, (_, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => !readonly && onRate?.(i + 1)}
          activeOpacity={readonly ? 1 : 0.7}
          disabled={readonly}
        >
          <View
            style={[
              styles.star,
              { width: size, height: size },
              i < rating
                ? { backgroundColor: resolvedColor }
                : { backgroundColor: theme.border, opacity: 0.25 },
            ]}
          >
            <Text style={styles.starText}>{i < rating ? '★' : '☆'}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const { Text } = require('react-native');

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: {
    fontSize: 16,
    color: '#fff',
  },
});
