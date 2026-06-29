import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { getBadgeForTastings } from '@/constants/themes';
import { withAlpha } from '@/lib/theme';

interface HierarchyBadgeProps {
  tastingCount: number;
  size?: 'sm' | 'md' | 'lg';
}

export function HierarchyBadge({ tastingCount, size = 'md' }: HierarchyBadgeProps) {
  const theme = useTheme();
  const badge = getBadgeForTastings(tastingCount);

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 28 : 20;
  const containerSize = size === 'sm' ? 32 : size === 'lg' ? 60 : 44;
  const fontSize = size === 'sm' ? 10 : size === 'lg' ? 14 : 12;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.iconContainer,
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            backgroundColor: withAlpha(theme.accent, 0.15),
            borderColor: withAlpha(theme.accent, 0.4),
          },
        ]}
      >
        <Ionicons name={badge.icon as any} size={iconSize} color={theme.accent} />
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: theme.text, fontSize }]}>
          {badge.label}
        </Text>
        {badge.subtitle && (
          <Text style={[styles.subtitle, { color: theme.accent, fontSize: fontSize - 1 }]}>
            {badge.subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: {
    alignItems: 'center',
    gap: 1,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontWeight: '500',
    fontStyle: 'italic',
  },
});
