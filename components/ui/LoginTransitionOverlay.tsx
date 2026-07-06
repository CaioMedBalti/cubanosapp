import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTransitionStore } from '@/store/transitionStore';

const VIDEO_SOURCE = require('@/assets/videos/login-transition.mp4');
// O clipe tem ~10s; começamos perto do final para a transição ficar curta e
// aproveitar só o trecho do fade com fumaça. Ajuste fino aqui.
const START_AT_SECONDS = 6.5;
const FADE_OUT_MS = 700;
// Se o vídeo não disparar playToEnd (falha de codec/carregamento), o overlay
// se encerra sozinho — o usuário nunca fica preso na transição.
const FAILSAFE_MS = 6000;

export function LoginTransitionOverlay() {
  const active = useTransitionStore((s) => s.active);
  const finish = useTransitionStore((s) => s.finish);
  const opacity = useSharedValue(1);

  const player = useVideoPlayer(VIDEO_SOURCE, (p) => {
    p.loop = false;
    p.muted = true;
  });

  const fadeOut = useCallback(() => {
    opacity.value = withTiming(
      0,
      { duration: FADE_OUT_MS, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(finish)();
      },
    );
  }, [opacity, finish]);

  useEffect(() => {
    const subscription = player.addListener('playToEnd', fadeOut);
    return () => subscription.remove();
  }, [player, fadeOut]);

  useEffect(() => {
    if (!active) return;
    opacity.value = 1;
    player.currentTime = START_AT_SECONDS;
    player.play();
    const failsafe = setTimeout(fadeOut, FAILSAFE_MS);
    return () => clearTimeout(failsafe);
  }, [active, player, opacity, fadeOut]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!active) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Toque em qualquer lugar pula a transição. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={fadeOut}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
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
    backgroundColor: '#000',
  },
});
