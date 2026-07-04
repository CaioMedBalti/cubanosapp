import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { AnilhaRating } from '@/components/ui/AnilhaRating';
import { FeedPost } from '@/lib/firebase';
import { timeAgo } from '@/lib/time';
import { useAuthStore } from '@/store/authStore';
import { likePost, unlikePost, subscribeIsLiked } from '@/lib/firestore';
import { CommentsSheet } from '@/components/modals/CommentsSheet';

interface PostCardProps {
  post: FeedPost;
  onPress?: () => void;
}

export function PostCard({ post, onPress }: PostCardProps) {
  const theme = useTheme();
  const uid = useAuthStore((s) => s.uid);
  const [isLiked, setIsLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    if (!uid) return;
    return subscribeIsLiked(post.id, uid, setIsLiked);
  }, [uid, post.id]);

  const handleToggleLike = async () => {
    if (!uid || likeBusy) return;
    setLikeBusy(true);
    try {
      if (isLiked) await unlikePost(post.id, uid);
      else await likePost(post.id, uid);
    } finally {
      setLikeBusy(false);
    }
  };

  return (
    <>
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.wrapper, { shadowColor: theme.accent }]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: withAlpha(theme.border, 0.4),
          },
        ]}
      >
        {/* Left gold accent bar */}
        <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />

        <View style={styles.body}>
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: withAlpha(theme.accent, 0.15) },
              ]}
            >
              {post.avatarUrl ? (
                <Image source={{ uri: post.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person" size={17} color={theme.accent} />
              )}
            </View>
            <View style={styles.authorInfo}>
              <Text style={[styles.authorName, { color: theme.text }]}>
                {post.authorName}
              </Text>
              <Text style={[styles.timeText, { color: theme.textMuted }]}>
                {timeAgo(post.createdAt)}
              </Text>
            </View>
          </View>

          {/* Pairing pill */}
          {(post.cigarName || post.whiskyName) && (
            <View
              style={[
                styles.pairing,
                {
                  backgroundColor: withAlpha(theme.accent, 0.06),
                  borderColor: withAlpha(theme.accent, 0.18),
                },
              ]}
            >
              {post.cigarName && (
                <Text style={[styles.pairingText, { color: theme.accent }]}>
                  🍃 {post.cigarName}
                </Text>
              )}
              {post.cigarName && post.whiskyName && (
                <Text style={[styles.pairingSep, { color: withAlpha(theme.accent, 0.35) }]}>
                  ⬥
                </Text>
              )}
              {post.whiskyName && (
                <Text style={[styles.pairingText, { color: theme.accentDim }]}>
                  🥃 {post.whiskyName}
                </Text>
              )}
            </View>
          )}

          {/* Caption */}
          <Text style={[styles.caption, { color: theme.text }]}>{post.caption}</Text>

          {/* Rating */}
          <AnilhaRating rating={post.rating} size={26} readonly />

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: withAlpha(theme.border, 0.25) }]}>
            <TouchableOpacity style={styles.action} onPress={handleToggleLike} disabled={!uid}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={isLiked ? '#e0453f' : theme.textMuted}
              />
              <Text style={[styles.actionCount, { color: theme.textMuted }]}>
                {post.likesCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={() => setCommentsOpen(true)}>
              <Ionicons name="chatbubble-outline" size={15} color={theme.textMuted} />
              <Text style={[styles.actionCount, { color: theme.textMuted }]}>
                {post.commentsCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action}>
              <Ionicons name="share-outline" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>

    <CommentsSheet
      postId={commentsOpen ? post.id : null}
      onClose={() => setCommentsOpen(false)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 36, height: 36 },
  authorInfo: { flex: 1, gap: 1 },
  authorName: { fontSize: 14, fontWeight: '700' },
  timeText: { fontSize: 11 },
  pairing: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  pairingText: { fontSize: 12, fontWeight: '600' },
  pairingSep: { fontSize: 9 },
  caption: { fontSize: 14, lineHeight: 21 },
  footer: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { fontSize: 12 },
});
