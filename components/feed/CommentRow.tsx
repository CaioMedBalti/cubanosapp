import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { Comment } from '@/lib/firebase';
import { timeAgo } from '@/lib/time';

export function CommentRow({ comment }: { comment: Comment }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: withAlpha(theme.accent, 0.15) }]}>
        {comment.avatarUrl ? (
          <Image source={{ uri: comment.avatarUrl }} style={styles.avatarImg} />
        ) : (
          <Ionicons name="person" size={14} color={theme.accent} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={[styles.author, { color: theme.text }]}>
            {comment.authorName || 'Anônimo'}
          </Text>
          <Text style={[styles.time, { color: theme.textMuted }]}>
            {timeAgo(comment.createdAt)}
          </Text>
        </View>
        <Text style={[styles.content, { color: theme.text }]}>{comment.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 28, height: 28 },
  body: { flex: 1, gap: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  author: { fontSize: 13, fontWeight: '700' },
  time: { fontSize: 11 },
  content: { fontSize: 13, lineHeight: 19 },
});
