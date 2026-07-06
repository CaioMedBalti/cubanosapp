import React from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { useTheme } from '@/store/themeStore';

interface EmptyStateProps {
  title: string;
  hint?: string;
  image?: ImageSourcePropType;
  size?: number;
  children?: React.ReactNode;
}

// Estado vazio padrão da marca: emblema do charuto + título + dica.
export function EmptyState({
  title,
  hint,
  image = require('@/assets/emblema.png'),
  size = 96,
  children,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Image
        source={image}
        style={{ width: size, height: size, opacity: 0.85 }}
        resizeMode="contain"
      />
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {hint ? <Text style={[styles.hint, { color: theme.textMuted }]}>{hint}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 32,
  },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  hint: { fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
});
