import React from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ListRenderItem,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/store/themeStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { PostCard } from '@/components/feed/PostCard';
import { withAlpha } from '@/lib/theme';
import { usePosts } from '@/hooks/usePosts';
import { FeedPost } from '@/lib/firebase';

export default function FeedScreen() {
  const theme = useTheme();
  const { posts, loading } = usePosts();

  const renderItem: ListRenderItem<FeedPost> = ({ item }) => (
    <PostCard post={item} />
  );

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: theme.accent }]}>CUBANOS</Text>
            <View style={[styles.headerRule, { backgroundColor: withAlpha(theme.accent, 0.35) }]} />
            <Text style={[styles.headerSub, { color: theme.textMuted }]}>Feed</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyIcon, { color: withAlpha(theme.accent, 0.4) }]}>🍃</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhum post ainda</Text>
            <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
              Use o botão Seed no Perfil para adicionar dados de exemplo.
            </Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 5,
  },
  headerRule: {
    width: 1,
    height: 16,
  },
  headerSub: {
    fontSize: 13,
    letterSpacing: 1,
    fontWeight: '500',
  },
  list: { paddingVertical: 10, paddingBottom: 24 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyHint: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
