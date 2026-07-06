import React, { useEffect } from 'react';
import { StyleSheet, Image, Text, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/store/themeStore';
import { FONTS } from '@/constants/typography';
import { SmokeVeil } from '@/components/ui/SmokeVeil';

// Tempo total com a intro visível antes do fade-out. A intro roda em paralelo
// à resolução de auth/navegação — não bloqueia nada, só cobre a tela.
const HOLD_MS = 1500;
const FADE_OUT_MS = 450;

interface AppIntroAnimationProps {
  onDone: () => void;
}

export function AppIntroAnimation({ onDone }: AppIntroAnimationProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const containerOpacity = useSharedValue(1);
  const smokeBase = useSharedValue(0);

  useEffect(() => {
    // Névoa sobe suave atrás do logo…
    smokeBase.value = withTiming(0.4, { duration: 900, easing: Easing.out(Easing.quad) });
    // …e a intro inteira dissolve depois do hold.
    containerOpacity.value = withDelay(
      HOLD_MS,
      withTiming(0, { duration: FADE_OUT_MS, easing: Easing.in(Easing.quad) }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
    // Failsafe: no web, rAF congela com a aba oculta e o callback da animação
    // pode nunca disparar — o timer garante que a intro sai de qualquer jeito.
    const failsafe = setTimeout(onDone, HOLD_MS + FADE_OUT_MS + 600);
    return () => clearTimeout(failsafe);
  }, [containerOpacity, smokeBase, onDone]);

  // A fumaça acompanha o fade do container para dissolver junto.
  const smokeIntensity = useDerivedValue(() => smokeBase.value * containerOpacity.value);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: theme.background }, containerStyle]}
      pointerEvents="none"
    >
      <SmokeVeil
        intensity={smokeIntensity}
        width={width}
        height={height}
        speed={1.4}
        style={StyleSheet.absoluteFill}
      />
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
  logo: {
    width: 140,
    height: 140,
    borderRadius: 30,
  },
  title: {
    marginTop: 20,
    fontSize: 28,
    fontFamily: FONTS.displayBlack,
    letterSpacing: 7,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
