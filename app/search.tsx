import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { withAlpha } from '@/lib/theme';
import { FONTS } from '@/constants/typography';
import { findUserByUsername, followUser, unfollowUser, subscribeIsFollowing } from '@/lib/firestore';
import { UserProfile } from '@/lib/firebase';

export default function SearchScreen() {
  const theme = useTheme();
  const myUid = useAuthStore((s) => s.uid);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<UserProfile | null | undefined>(undefined);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!myUid || !result) return;
    return subscribeIsFollowing(myUid, result.uid, setIsFollowing);
  }, [myUid, result]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResult(undefined);
    try {
      const found = await findUserByUsername(query.trim());
      setResult(found);
    } finally {
      setSearching(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!myUid || !result) return;
    setFollowBusy(true);
    try {
      if (isFollowing) await unfollowUser(myUid, result.uid);
      else await followUser(myUid, result.uid);
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Buscar Pessoas</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View
            style={[styles.searchBar, { backgroundColor: withAlpha(theme.surface, 0.9), borderColor: withAlpha(theme.border, 0.5) }]}
          >
            <Ionicons name="search" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Username exato"
              placeholderTextColor={theme.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch}>
              <Text style={{ color: theme.accent, fontWeight: '700' }}>Buscar</Text>
            </TouchableOpacity>
          </View>

          {searching && (
            <View style={styles.center}>
              <ActivityIndicator color={theme.accent} />
            </View>
          )}

          {!searching && result === null && (
            <EmptyState
              title="Nenhum usuário encontrado"
              hint="Confira se o username está exato — a busca não aceita variações."
            />
          )}

          {!searching && result && (
            <View
              style={[styles.resultCard, { backgroundColor: withAlpha(theme.card, 0.8), borderColor: withAlpha(theme.border, 0.4) }]}
            >
              <TouchableOpacity style={styles.resultInfo} onPress={() => router.push(`/user/${result.uid}`)}>
                <View style={[styles.avatar, { backgroundColor: withAlpha(theme.accent, 0.15), borderColor: withAlpha(theme.accent, 0.35) }]}>
                  {result.avatarUrl ? (
                    <Image source={{ uri: result.avatarUrl }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name="person" size={22} color={theme.accent} />
                  )}
                </View>
                <View>
                  <Text style={[styles.resultName, { color: theme.text }]}>{result.username}</Text>
                  {result.bio && (
                    <Text style={[styles.resultBio, { color: theme.textMuted }]} numberOfLines={1}>
                      {result.bio}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              {result.uid !== myUid && (
                <ThemedButton
                  label={isFollowing ? 'Seguindo' : 'Seguir'}
                  variant={isFollowing ? 'secondary' : 'primary'}
                  onPress={handleToggleFollow}
                  loading={followBusy}
                  style={styles.followButton}
                />
              )}
            </View>
          )}
        </View>
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
  headerTitle: { fontSize: 18, fontFamily: FONTS.display },
  content: { padding: 20, gap: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  center: { paddingVertical: 20, alignItems: 'center' },
  emptyHint: { textAlign: 'center', fontSize: 13, marginTop: 12 },
  resultCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  resultInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 48, height: 48 },
  resultName: { fontSize: 16, fontWeight: '700' },
  resultBio: { fontSize: 12, maxWidth: 220 },
  followButton: { height: 44 },
});
