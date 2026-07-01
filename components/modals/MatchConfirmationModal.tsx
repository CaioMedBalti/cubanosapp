import React, { useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import type { CigarCatalogEntry } from '@/lib/cigarImages';

interface Props {
  visible: boolean;
  candidate: CigarCatalogEntry | null;
  confidence: number;
  onConfirm: () => void;
  onReject: () => void;
  onAddWithoutCatalog: () => void;
}

export function MatchConfirmationModal({
  visible,
  candidate,
  confidence,
  onConfirm,
  onReject,
  onAddWithoutCatalog,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(700)).current;

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

  const animateOutThen = useCallback(
    (action: () => void) => {
      Animated.spring(slideAnim, {
        toValue: 700,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start(() => action());
    },
    [slideAnim],
  );

  if (!candidate) return null;

  const sheetPaddingBottom = Math.max(insets.bottom, 16);
  const confidencePct = Math.round(confidence * 100);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => animateOutThen(onReject)}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={() => animateOutThen(onReject)} />

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
          <View style={[styles.handle, { backgroundColor: withAlpha(theme.border, 0.5) }]} />

          <Text style={[styles.title, { color: theme.text }]}>Encontramos no catálogo</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            É esse o seu charuto? ({confidencePct}% de confiança)
          </Text>

          <View
            style={[
              styles.candidateCard,
              { backgroundColor: theme.card, borderColor: withAlpha(theme.border, 0.4) },
            ]}
          >
            <Image source={candidate.image} style={styles.candidateImage} resizeMode="contain" />
            <View style={styles.candidateBody}>
              <Text style={[styles.candidateBrand, { color: theme.accent }]}>
                {candidate.brand.toUpperCase()}
              </Text>
              <Text style={[styles.candidateName, { color: theme.text }]}>{candidate.name}</Text>
              <Text style={[styles.candidateOrigin, { color: theme.textMuted }]}>
                {candidate.origin}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
            onPress={() => animateOutThen(onConfirm)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Sim, é esse</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: withAlpha(theme.border, 0.5) }]}
            onPress={() => animateOutThen(onReject)}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>Não, é outro</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tertiaryBtn}
            onPress={() => animateOutThen(onAddWithoutCatalog)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tertiaryBtnText, { color: theme.textMuted }]}>
              Adicionar sem catálogo
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
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
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 8,
  },
  candidateCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  candidateImage: {
    width: 64,
    height: 64,
  },
  candidateBody: {
    flex: 1,
    gap: 3,
  },
  candidateBrand: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '700',
  },
  candidateOrigin: {
    fontSize: 12,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
  },
  secondaryBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  tertiaryBtn: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryBtnText: {
    fontSize: 13,
  },
});
