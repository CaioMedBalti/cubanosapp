import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';

interface VideoBackgroundProps extends ViewProps {
  videoSource?: number | { uri: string } | null;
  children?: React.ReactNode;
  overlayOpacity?: number;
}

export function VideoBackground({
  videoSource,
  children,
  overlayOpacity = 0.65,
  style,
  ...props
}: VideoBackgroundProps) {
  const theme = useTheme();

  const player = useVideoPlayer(videoSource ?? null, (p) => {
    p.loop = true;
    p.muted = true;
    if (videoSource) p.play();
  });

  return (
    <View style={[styles.container, style]} {...props}>
      {videoSource ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]} />
      )}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: withAlpha(theme.background, overlayOpacity) },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
