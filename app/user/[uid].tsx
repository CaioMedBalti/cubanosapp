import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { HierarchyBadge } from '@/components/ui/HierarchyBadge';
import { TastingCard } from '@/components/feed/TastingCard';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { withAlpha } from '@/lib/theme';
import { timeAgo } from '@/lib/time';
import { useProfileStats } from '@/hooks/useProfileStats';
import { getUserProfile, subscribePublicTastings, followUser, unfollowUser, subscribeIsFollowing } from '@/lib/firestore';
import { UserProfile, Tasting } from '@/lib/firebase';

export default function PublicProfileScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const theme = useTheme();
  const myUid = useAuthStore((s) => s.uid);
  const { tastingCount, followers, following } = useProfileStats(uid ?? null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [tastings, setTastings] = useState<Tasting[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!uid) return;
    getUserProfile(uid).then((p) => {
      setProfile(p);
      setLoadingProfile(false);
    });
    return subscribePublicTastings(uid, setTastings);
  }, [uid]);

  useEffect(() => {
    if (!myUid || !uid) return;
    return subscribeIsFollowing(myUid, uid, setIsFollowing);
  }, [myUid, uid]);

  const handleToggleFollow = async () => {
    if (!myUid || !uid) return;
    setFollowBusy(true);
    try {
      if (isFollowing) await unfollowUser(myUid, uid);
      else await followUser(myUid, uid);
    } finally {
      setFollowBusy(false);
    }
  };

  const renderItem: ListRenderItem<Tasting> = ({ item }) => (
    <TastingCard
      cigarName={item.itemName ?? 'Sem nome'}
      brand={item.itemBrand}
      rating={item.rating}
      notes={item.notes ?? undefined}
      flavorNotes={item.flavorNotes}
      date={timeAgo(item.date)}
    />
  );

  if (loadingProfile) {
    return (
      <VideoBackground style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <ActivityIndicator color={theme.accent} />
          </View>
        </SafeAreaView>
      </VideoBackground>
    );
  }

  if (!profile) {
    return (
      <VideoBackground style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.center}>
            <Text style={{ color: theme.textMuted }}>Usuário não encontrado.</Text>
          </View>
        </SafeAreaView>
      </VideoBackground>
    );
  }

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{profile.username}</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={tastings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <View style={styles.heroSection}>
                <View style={[styles.avatar, { backgroundColor: withAlpha(theme.accent, 0.15), borderColor: withAlpha(theme.accent, 0.35) }]}>
                  <Ionicons name="person" size={40} color={theme.accent} />
                </View>
                <Text style={[styles.username, { color: theme.text }]}>{profile.username}</Text>
                {profile.bio && (
                  <Text style={[styles.bio, { color: theme.textMuted }]}>{profile.bio}</Text>
                )}
                <HierarchyBadge tastingCount={tastingCount} size="lg" />
              </View>

              <View
                style={[
                  styles.statsRow,
                  { backgroundColor: withAlpha(theme.surface, 0.7), borderTopColor: withAlpha(theme.border, 0.3), borderBottomColor: withAlpha(theme.border, 0.3) },
                ]}
              >
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text }]}>{tastingCount}</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>Degustações</Text>
                </View>
                <TouchableOpacity
                  style={styles.statItem}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/connections/${uid}?type=followers`)}
                >
                  <Text style={[styles.statValue, { color: theme.text }]}>{followers}</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>Seguidores</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.statItem}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/connections/${uid}?type=following`)}
                >
                  <Text style={[styles.statValue, { color: theme.text }]}>{following}</Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }]}>Seguindo</Text>
                </TouchableOpacity>
              </View>

              {uid !== myUid && (
                <ThemedButton
                  label={isFollowing ? 'Seguindo' : 'Seguir'}
                  variant={isFollowing ? 'secondary' : 'primary'}
                  onPress={handleToggleFollow}
                  loading={followBusy}
                  style={styles.followButton}
                />
              )}

              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>DEGUSTAÇÕES PÚBLICAS</Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={[styles.emptyHint, { color: theme.textMuted }]}>Nenhuma degustação pública ainda.</Text>
          }
        />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  heroSection: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  username: { fontSize: 20, fontWeight: '700' },
  bio: { fontSize: 13, textAlign: 'center', maxWidth: 260 },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, letterSpacing: 0.3 },
  followButton: { marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  emptyHint: { fontSize: 13, textAlign: 'center', marginTop: 20 },
});
