import React from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { useActiveTheme, useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';

interface TexturedPanelProps {
  children?: React.ReactNode;
  /** Textura de fundo; default: mármore escuro da marca. */
  source?: ImageSourcePropType;
  /** Opacidade do véu de cor do tema por cima da textura (legibilidade). */
  overlayOpacity?: number;
  style?: StyleProp<ViewStyle>;
}

// Painel com textura premium — SÓ no tema dark-luxury; vintage/modern mantêm
// superfície sólida para não brigar com suas paletas claras/minimais.
export function TexturedPanel({
  children,
  source = require('@/assets/textures/marble-dark.jpg'),
  overlayOpacity = 0.5,
  style,
}: TexturedPanelProps) {
  const theme = useTheme();
  const activeTheme = useActiveTheme();

  if (activeTheme !== 'dark-luxury') {
    return <View style={style}>{children}</View>;
  }

  return (
    <ImageBackground source={source} style={style} imageStyle={styles.image}>
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(theme.background, overlayOpacity) }]}
      />
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
});
