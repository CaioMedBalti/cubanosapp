import React, { useEffect } from 'react';
import { StyleSheet, Image, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';

// Tempo total com a intro visível antes do fade-out. A intro roda em paralelo
// à resolução de auth/navegação — não bloqueia nada, só cobre a tela.
const HOLD_MS = 1500;
const FADE_OUT_MS = 450;
const PUFF_CYCLE_MS = 1400;

interface AppIntroAnimationProps {
  onDone: () => void;
}

interface SmokePuffProps {
  delay: number;
  offsetX: number;
  size: number;
  color: string;
}

function SmokePuff({ delay, offsetX, size, color }: SmokePuffProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: PUFF_CYCLE_MS, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.25, 1], [0, 0.5, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -90]) },
      { translateX: interpolate(progress.value, [0, 1], [offsetX, offsetX * 1.8]) },
      { scale: interpolate(progress.value, [0, 1], [0.5, 1.7]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.puff,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

export function AppIntroAnimation({ onDone }: AppIntroAnimationProps) {
  const theme = useTheme();
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    containerOpacity.value = withDelay(
      HOLD_MS,
      withTiming(0, { duration: FADE_OUT_MS, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
  }, [containerOpacity, onDone]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const smokeColor = withAlpha(theme.textMuted, 1);

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: theme.background }, containerStyle]}
      pointerEvents="none"
    >
      <View style={styles.smokeArea}>
        <SmokePuff delay={0} offsetX={-8} size={22} color={smokeColor} />
        <SmokePuff delay={350} offsetX={10} size={16} color={smokeColor} />
        <SmokePuff delay={700} offsetX={-2} size={26} color={smokeColor} />
        <SmokePuff delay={1050} offsetX={16} size={13} color={smokeColor} />
      </View>
      <Image
        source={require('@/assets/cubanos_logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.title, { color: theme.accent }]}>CUBANOS</Text>
      <Text style={[styles.subtitle, { color: theme.textMuted }]}>Colecionadores Premium</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smokeArea: {
    // As baforadas nascem logo acima do canto superior direito do logo, onde
    // fica a ponta acesa do charuto na arte.
    height: 100,
    width: 60,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -30,
    marginLeft: 90,
  },
  puff: {
    position: 'absolute',
    bottom: 0,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 30,
  },
  title: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 7,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
