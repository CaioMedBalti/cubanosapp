import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { AnilhaRating } from '@/components/ui/AnilhaRating';
import { GenericCigarPlaceholder } from '@/components/ui/GenericCigarPlaceholder';
import { getCatalogItemImage } from '@/lib/images';
import { getStrengthBucket, STRENGTH_GRADIENTS } from '@/constants/strength';
import { CigarCatalog } from '@/lib/firebase';

export function CigarOfTheDayCard({ cigar }: { cigar: CigarCatalog }) {
  const theme = useTheme();
  const gradientColors = STRENGTH_GRADIENTS[getStrengthBucket(cigar.strength)];

  const cigarImage = useMemo(
    () => getCatalogItemImage(cigar),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cigar.id],
  );

  return (
    <View style={[styles.wrapper, { shadowColor: theme.accent }]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* PNG transparente da vitola como hero, sobre o gradiente de força */}
        {cigarImage && (
          <Image source={cigarImage} style={styles.heroImage} resizeMode="contain" />
        )}
        <View style={styles.overlay}>
          {!cigarImage && (
            <View style={styles.iconRow}>
              <GenericCigarPlaceholder size={40} color="#fff" />
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: withAlpha('#000', 0.35) }]}>
            <Text style={styles.badgeText}>CHARUTO DO DIA</Text>
          </View>
          <Text style={styles.brand}>{cigar.brand.toUpperCase()}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {cigar.name}
          </Text>
          <Text style={styles.meta}>
            {cigar.origin} · {cigar.strength}
          </Text>
          <AnilhaRating rating={cigar.communityRating} size={22} readonly />
          {cigar.flavorNotes.length > 0 && (
            <View style={styles.tagsRow}>
              {cigar.flavorNotes.slice(0, 3).map((n) => (
                <View key={n} style={[styles.tag, { backgroundColor: withAlpha('#000', 0.25) }]}>
                  <Text style={styles.tagText}>{n}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    overflow: 'hidden',
  },
  overlay: { gap: 6 },
  iconRow: { alignItems: 'flex-end', marginBottom: -8 },
  heroImage: {
    position: 'absolute',
    right: 4,
    top: 8,
    width: 120,
    height: 130,
    transform: [{ rotate: '12deg' }],
    opacity: 0.95,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brand: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, opacity: 0.9 },
  name: { color: '#fff', fontSize: 22, fontWeight: '800' },
  meta: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
