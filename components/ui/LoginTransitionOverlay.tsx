import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  cancelAnimation,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { useTransitionStore } from '@/store/transitionStore';
import { useTheme } from '@/store/themeStore';
import { SmokeVeil } from '@/components/ui/SmokeVeil';

// Coreografia (progress 0→1): a escuridão sobe rápido, a fumaça atravessa
// densa no meio e dissolve revelando a Home já montada por baixo.
const DURATION_MS = 2400;
// Se a animação não completar (ex.: aba em background), encerra sozinho.
const FAILSAFE_MS = 4000;

export function LoginTransitionOverlay() {
  const active = useTransitionStore((s) => s.active);
  const finish = useTransitionStore((s) => s.finish);
  const theme = useTheme();
  const { width, height } = useWindowDimensions();

  const progress = useSharedValue(0);

  // Fumaça: entra com força, pico em ~40% e dissolve até o fim.
  const smokeIntensity = useDerivedValue(() =>
    interpolate(progress.value, [0, 0.12, 0.4, 0.85, 1], [0, 0.75, 1, 0.35, 0]),
  );

  const finishOnJS = useCallback(() => finish(), [finish]);

  const run = useCallback(
    (from: number, duration: number) => {
      progress.value = from;
      progress.value = withTiming(
        1,
        { duration, easing: Easing.inOut(Easing.quad) },
        (finished) => {
          if (finished) runOnJS(finishOnJS)();
        },
      );
    },
    [progress, finishOnJS],
  );

  useEffect(() => {
    if (!active) return;
    run(0, DURATION_MS);
    const failsafe = setTimeout(finishOnJS, FAILSAFE_MS);
    return () => {
      clearTimeout(failsafe);
      cancelAnimation(progress);
    };
  }, [active, run, finishOnJS, progress]);

  // Toque em qualquer lugar: salta para a dissolução final.
  const skip = useCallback(() => {
    cancelAnimation(progress);
    run(Math.max(progress.value, 0.7), 500);
  }, [progress, run]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.1, 0.55, 1], [0, 1, 1, 0]),
  }));

  if (!active) return null;

  return (
    <Animated.View style={styles.container}>
      <Pressable style={StyleSheet.absoluteFill} onPress={skip}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.background },
            backdropStyle,
          ]}
        />
        <SmokeVeil intensity={smokeIntensity} width={width} height={height} />
      </Pressable>
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
    zIndex: 90,
  },
});
