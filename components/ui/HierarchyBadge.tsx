import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
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

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(100, withSpring(1, { mass: 0.7, stiffness: 180, damping: 12 }));
    opacity.value = withDelay(100, withSpring(1));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 28 : 20;
  const containerSize = size === 'sm' ? 32 : size === 'lg' ? 60 : 44;
  const fontSize = size === 'sm' ? 10 : size === 'lg' ? 14 : 12;

  return (
    <Animated.View style={[styles.wrapper, animStyle]}>
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
        <Ionicons
          name={badge.icon as any}
          size={iconSize}
          color={theme.accent}
        />
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
    </Animated.View>
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
