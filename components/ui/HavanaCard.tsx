import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';

interface CubanosCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  badge?: string;
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function CubanosCard({
  title,
  subtitle,
  imageUrl,
  badge,
  onPress,
  style,
  children,
}: CubanosCardProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: withAlpha(theme.border, 0.6),
        },
        style,
      ]}
    >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { backgroundColor: theme.surface }]}
        />
      )}
      <View style={styles.content}>
        {badge && (
          <Text style={[styles.badge, { color: theme.accent }]}>{badge}</Text>
        )}
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {children}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  image: {
    width: 80,
    height: 80,
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
  },
});
