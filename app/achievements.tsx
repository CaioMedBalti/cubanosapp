import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { HierarchyBadge } from '@/components/ui/HierarchyBadge';
import { withAlpha } from '@/lib/theme';
import { useProfileStats } from '@/hooks/useProfileStats';
import { BADGES, getBadgeForTastings } from '@/constants/themes';

export default function AchievementsScreen() {
  const theme = useTheme();
  const uid = useAuthStore((s) => s.uid);
  const { tastingCount } = useProfileStats(uid);
  const currentBadge = getBadgeForTastings(tastingCount);
  const nextBadge = BADGES.find((b) => b.minTastings > tastingCount);

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Conquistas</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <HierarchyBadge tastingCount={tastingCount} size="lg" />
            {nextBadge ? (
              <Text style={[styles.progressText, { color: theme.textMuted }]}>
                {tastingCount} / {nextBadge.minTastings} degustações para {nextBadge.label}
              </Text>
            ) : (
              <Text style={[styles.progressText, { color: theme.textMuted }]}>
                Você atingiu o nível máximo
              </Text>
            )}
          </View>

          {BADGES.map((badge) => {
            const unlocked = tastingCount >= badge.minTastings;
            const isCurrent = badge.level === currentBadge.level;
            return (
              <View
                key={badge.level}
                style={[
                  styles.tierRow,
                  {
                    backgroundColor: isCurrent ? withAlpha(theme.accent, 0.12) : withAlpha(theme.card, 0.7),
                    borderColor: isCurrent ? theme.accent : withAlpha(theme.border, 0.3),
                  },
                ]}
              >
                <View
                  style={[
                    styles.tierIcon,
                    {
                      backgroundColor: unlocked ? withAlpha(theme.accent, 0.15) : withAlpha(theme.border, 0.15),
                      borderColor: unlocked ? withAlpha(theme.accent, 0.4) : withAlpha(theme.border, 0.4),
                    },
                  ]}
                >
                  <Ionicons
                    name={(unlocked ? badge.icon : 'lock-closed') as any}
                    size={20}
                    color={unlocked ? theme.accent : theme.textMuted}
                  />
                </View>
                <View style={styles.tierInfo}>
                  <Text style={[styles.tierLabel, { color: unlocked ? theme.text : theme.textMuted }]}>
                    {badge.label}
                    {badge.subtitle ? ` ${badge.subtitle}` : ''}
                  </Text>
                  <Text style={[styles.tierHint, { color: theme.textMuted }]}>
                    {badge.minTastings === 0 ? 'Ponto de partida' : `${badge.minTastings}+ degustações`}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </VideoBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 20, gap: 12, paddingBottom: 40 },
  hero: { alignItems: 'center', gap: 10, marginBottom: 12 },
  progressText: { fontSize: 13 },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  tierIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierInfo: { flex: 1, gap: 2 },
  tierLabel: { fontSize: 15, fontWeight: '700' },
  tierHint: { fontSize: 12 },
});
