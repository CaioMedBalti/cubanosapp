import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Canvas, Circle } from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';

interface AnilhaProps {
  filled: boolean;
  size: number;
  color: string;
  border: string;
  delay: number;
}

function Anilha({ filled, size, color, border, delay }: AnilhaProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { mass: 0.8, stiffness: 200, damping: 14 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 3;
  const midR = outerR * 0.65;
  const dotR = 3;

  const strokeOuter = filled ? color : withAlpha(border, 0.25);
  const strokeMid = filled ? withAlpha(color, 0.4) : withAlpha(border, 0.25);
  const fillInner = filled ? withAlpha(color, 0.13) : withAlpha(border, 0.07);
  const dotColor = filled ? color : withAlpha(border, 0.25);

  return (
    <Animated.View style={[{ width: size, height: size }, animStyle]}>
      <Canvas style={{ width: size, height: size }}>
        {/* background fill */}
        <Circle cx={cx} cy={cy} r={outerR} color={fillInner} />
        {/* outer ring */}
        <Circle cx={cx} cy={cy} r={outerR} color={strokeOuter} style="stroke" strokeWidth={2.5} />
        {/* mid ring */}
        <Circle cx={cx} cy={cy} r={midR} color={strokeMid} style="stroke" strokeWidth={1.5} />
        {/* center dot */}
        <Circle cx={cx} cy={cy} r={dotR} color={dotColor} />
      </Canvas>
    </Animated.View>
  );
}

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
      {Array.from({ length: 5 }, (_, i) => {
        const node = (
          <Anilha
            key={i}
            filled={i < rating}
            size={size}
            color={resolvedColor}
            border={theme.border}
            delay={i * 80}
          />
        );

        if (readonly || !onRate) return <View key={i}>{node}</View>;

        return (
          <TouchableOpacity
            key={i}
            onPress={() => onRate(i + 1)}
            activeOpacity={0.7}
          >
            {node}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
