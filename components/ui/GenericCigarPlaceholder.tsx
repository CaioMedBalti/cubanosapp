import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';

interface Props {
  size?: number;
  color?: string;
}

// Substitui o emoji 🍃 usado como placeholder onde não há imagem
// (nem do catálogo local, nem foto do usuário).
export function GenericCigarPlaceholder({ size = 28, color }: Props) {
  const theme = useTheme();
  return <Ionicons name="leaf-outline" size={size} color={color ?? theme.accent} />;
}
