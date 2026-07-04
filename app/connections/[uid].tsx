import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { UserRow } from '@/components/social/UserRow';
import { withAlpha } from '@/lib/theme';
import { subscribeFollowersList, subscribeFollowingList } from '@/lib/firestore';
import { UserProfile } from '@/lib/firebase';

export default function ConnectionsScreen() {
  const { uid, type } = useLocalSearchParams<{ uid: string; type: 'followers' | 'following' }>();
  const theme = useTheme();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const isFollowers = type !== 'following';

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const subscribe = isFollowers ? subscribeFollowersList : subscribeFollowingList;
    const unsub = subscribe(uid, (list) => {
      setUsers(list);
      setLoading(false);
    });
    return unsub;
  }, [uid, isFollowers]);

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isFollowers ? 'Seguidores' : 'Seguindo'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : users.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
              {isFollowers ? 'Nenhum seguidor ainda.' : 'Ainda não segue ninguém.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(u) => u.uid}
            renderItem={({ item }) => <UserRow user={item} />}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            showsVerticalScrollIndicator={false}
          />
        )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyHint: { fontSize: 13, textAlign: 'center' },
  list: { padding: 20 },
});
