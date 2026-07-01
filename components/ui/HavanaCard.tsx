import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';

interface CubanosCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  image?: ImageSourcePropType | null;
  imageSize?: number;
  imageResizeMode?: 'cover' | 'contain';
  // Renderizado no lugar da imagem quando nem `image` nem `imageUrl` são fornecidos
  // (ex: <GenericCigarPlaceholder />) — garante que o card nunca fique sem thumbnail.
  imagePlaceholder?: React.ReactNode;
  badge?: string;
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function CubanosCard({
  title,
  subtitle,
  imageUrl,
  image,
  imageSize = 80,
  imageResizeMode = 'cover',
  imagePlaceholder,
  badge,
  onPress,
  style,
  children,
}: CubanosCardProps) {
  const theme = useTheme();
  const resolvedImage = image ?? (imageUrl ? { uri: imageUrl } : null);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: withAlpha(theme.border, 0.6),
        },
        style,
      ]}
    >
      {resolvedImage ? (
        <Image
          source={resolvedImage}
          resizeMode={imageResizeMode}
          style={[
            styles.image,
            { width: imageSize, height: imageSize, backgroundColor: theme.surface },
          ]}
        />
      ) : (
        imagePlaceholder && (
          <View
            style={[
              styles.imagePlaceholder,
              { width: imageSize, height: imageSize, backgroundColor: withAlpha(theme.accent, 0.08) },
            ]}
          >
            {imagePlaceholder}
          </View>
        )
      )}
      <View style={styles.content}>
        {badge && (
          <Text style={[styles.badge, { color: theme.accent }]}>{badge}</Text>
        )}
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {children}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  image: {},
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
  },
});
