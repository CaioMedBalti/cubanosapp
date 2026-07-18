import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { HierarchyBadge } from '@/components/ui/HierarchyBadge';
import { withAlpha } from '@/lib/theme';
import { FONTS } from '@/constants/typography';
import { useHumidor } from '@/hooks/useHumidor';
import { useProfileStats } from '@/hooks/useProfileStats';

function StatItem({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number | string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const content = (
    <>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity style={styles.statItem} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={styles.statItem}>{content}</View>;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const uid = useAuthStore((s) => s.uid);
  const { items: humidorItems } = useHumidor();
  const { tastingCount, followers, following } = useProfileStats(uid);

  const cigarsInHumidor = humidorItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Perfil</Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Ionicons name="person-add-outline" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Avatar + Badge */}
          <View style={styles.heroSection}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: withAlpha(theme.accent, 0.15),
                  borderColor: withAlpha(theme.accent, 0.35),
                },
              ]}
            >
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person" size={40} color={theme.accent} />
              )}
            </View>
            <Text style={[styles.username, { color: theme.text }]}>
              {profile?.username ?? 'Aficionado'}
            </Text>
            <Text style={[styles.bio, { color: theme.textMuted }]}>
              {profile?.bio ?? 'Explorador de charutos e whiskies premium'}
            </Text>
            <HierarchyBadge tastingCount={tastingCount} size="lg" />
          </View>

          {/* Stats */}
          <View
            style={[
              styles.statsRow,
              {
                backgroundColor: withAlpha(theme.surface, 0.7),
                borderTopColor: withAlpha(theme.border, 0.3),
                borderBottomColor: withAlpha(theme.border, 0.3),
              },
            ]}
          >
            <StatItem label="Degustações" value={tastingCount} />
            <View style={[styles.statDivider, { backgroundColor: withAlpha(theme.border, 0.4) }]} />
            <StatItem label="Humidor" value={cigarsInHumidor} />
            <View style={[styles.statDivider, { backgroundColor: withAlpha(theme.border, 0.4) }]} />
            <StatItem
              label="Seguidores"
              value={followers}
              onPress={() => uid && router.push(`/connections/${uid}?type=followers`)}
            />
            <View style={[styles.statDivider, { backgroundColor: withAlpha(theme.border, 0.4) }]} />
            <StatItem
              label="Seguindo"
              value={following}
              onPress={() => uid && router.push(`/connections/${uid}?type=following`)}
            />
          </View>

          {/* Menu Items */}
          {[
            { icon: 'bookmark-outline', label: 'Minhas Degustações', route: '/tastings' },
            { icon: 'trophy-outline', label: 'Conquistas', route: '/achievements' },
            { icon: 'location-outline', label: 'Lounges', route: '/lounges' },
            { icon: 'settings-outline', label: 'Configurações', route: '/settings' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                {
                  backgroundColor: withAlpha(theme.card, 0.7),
                  borderColor: withAlpha(theme.border, 0.3),
                },
              ]}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
            >
              <Ionicons name={item.icon as any} size={20} color={theme.textMuted} />
              <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          ))}

          <View style={{ height: 40 }} />
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
  headerTitle: { fontSize: 22, fontFamily: FONTS.display },
  heroSection: {
    alignItems: 'center',
    padding: 28,
    gap: 10,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  avatarImg: { width: 88, height: 88 },
  username: { fontSize: 20, fontWeight: '700' },
  bio: { fontSize: 13, textAlign: 'center', maxWidth: 260 },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, letterSpacing: 0.3 },
  statDivider: { width: StyleSheet.hairlineWidth },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
});
