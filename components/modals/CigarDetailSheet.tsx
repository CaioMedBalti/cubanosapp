import React, { useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import type { HumidorEntry } from '@/lib/firebase';

const STATUS_LABEL: Record<HumidorEntry['status'], string> = {
  intact: 'Intacto',
  smoking: 'Em uso',
  finished: 'Finalizado',
};

const STATUS_COLOR: Record<HumidorEntry['status'], string> = {
  intact: '#4CAF50',
  smoking: '#EF9F27',
  finished: '#888',
};

interface Props {
  item: HumidorEntry | null;
  onClose: () => void;
}

export function CigarDetailSheet({ item, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(700)).current;
  const visible = item !== null;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = useCallback(() => {
    Animated.spring(slideAnim, {
      toValue: 700,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [slideAnim, onClose]);

  if (!item) return null;

  const sheetPaddingBottom = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              paddingBottom: sheetPaddingBottom,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: withAlpha(theme.border, 0.5) }]} />

          {/* Hero image or gradient */}
          <View style={styles.heroWrapper}>
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.heroImage} />
            ) : (
              <LinearGradient
                colors={[withAlpha(theme.accent, 0.25), withAlpha(theme.accent, 0.05)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              >
                <Text style={styles.heroEmoji}>🍃</Text>
              </LinearGradient>
            )}
            {/* Close button overlay */}
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: withAlpha('#000', 0.5) }]}
              onPress={handleClose}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* Header */}
            <View style={styles.titleBlock}>
              <Text style={[styles.brand, { color: theme.accent }]}>
                {item.brand.toUpperCase()}
              </Text>
              <Text style={[styles.name, { color: theme.text }]}>{item.cigarName}</Text>
              {(item.origin || item.strength) && (
                <Text style={[styles.meta, { color: theme.textMuted }]}>
                  {[item.origin, item.strength].filter(Boolean).join(' · ')}
                </Text>
              )}
            </View>

            {/* Flavor tags */}
            {item.flavorNotes && item.flavorNotes.length > 0 && (
              <View style={styles.tagsRow}>
                {item.flavorNotes.map((note) => (
                  <View
                    key={note}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: withAlpha(theme.accent, 0.07),
                        borderColor: withAlpha(theme.accent, 0.18),
                      },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: theme.textMuted }]}>{note}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Status + qty row */}
            <View style={[styles.statsRow, { borderColor: withAlpha(theme.border, 0.25) }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Quantidade</Text>
                <Text style={[styles.statValue, { color: theme.text }]}>{item.quantity}</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: withAlpha(theme.border, 0.3) }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Status</Text>
                <Text style={[styles.statValue, { color: STATUS_COLOR[item.status] }]}>
                  {STATUS_LABEL[item.status]}
                </Text>
              </View>
            </View>

            {/* Curiosidades */}
            {!!item.curiosities && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.accent }]}>Curiosidades</Text>
                <Text style={[styles.sectionText, { color: theme.text }]}>
                  {item.curiosities}
                </Text>
              </View>
            )}

            {/* História */}
            {!!item.history && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: theme.accent }]}>História</Text>
                <Text style={[styles.sectionText, { color: theme.text }]}>
                  {item.history}
                </Text>
              </View>
            )}

            {/* No enrichment fallback */}
            {!item.curiosities && !item.history && (
              <View style={styles.section}>
                <Text style={[styles.noInfoText, { color: theme.textMuted }]}>
                  Adicione este charuto via IA para ver a história e curiosidades completas.
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 0,
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  heroWrapper: {
    height: 200,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 60,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  titleBlock: {
    gap: 4,
    marginBottom: 14,
  },
  brand: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  noInfoText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
