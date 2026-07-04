import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { useAuthStore } from '@/store/authStore';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { followUser, unfollowUser, subscribeIsFollowing } from '@/lib/firestore';
import { UserProfile } from '@/lib/firebase';

export function UserRow({ user }: { user: UserProfile }) {
  const theme = useTheme();
  const myUid = useAuthStore((s) => s.uid);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    if (!myUid || user.uid === myUid) return;
    return subscribeIsFollowing(myUid, user.uid, setIsFollowing);
  }, [myUid, user.uid]);

  const handleToggleFollow = async () => {
    if (!myUid) return;
    setFollowBusy(true);
    try {
      if (isFollowing) await unfollowUser(myUid, user.uid);
      else await followUser(myUid, user.uid);
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: withAlpha(theme.card, 0.7), borderColor: withAlpha(theme.border, 0.3) },
      ]}
    >
      <TouchableOpacity
        style={styles.info}
        onPress={() => router.push(`/user/${user.uid}`)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: withAlpha(theme.accent, 0.15), borderColor: withAlpha(theme.accent, 0.35) },
          ]}
        >
          <Ionicons name="person" size={20} color={theme.accent} />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.username, { color: theme.text }]}>{user.username}</Text>
          {user.bio && (
            <Text style={[styles.bio, { color: theme.textMuted }]} numberOfLines={1}>
              {user.bio}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {user.uid !== myUid && (
        <ThemedButton
          label={isFollowing ? 'Seguindo' : 'Seguir'}
          variant={isFollowing ? 'secondary' : 'primary'}
          onPress={handleToggleFollow}
          loading={followBusy}
          style={styles.followButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 2 },
  username: { fontSize: 15, fontWeight: '700' },
  bio: { fontSize: 12 },
  followButton: { height: 38, paddingHorizontal: 14 },
});
