import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { useAuthStore } from '@/store/authStore';
import { subscribeComments, addComment } from '@/lib/firestore';
import { CommentRow } from '@/components/feed/CommentRow';
import type { Comment } from '@/lib/firebase';

interface Props {
  postId: string | null;
  onClose: () => void;
}

export function CommentsSheet({ postId, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);
  const slideAnim = useRef(new Animated.Value(700)).current;
  const visible = postId !== null;

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

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

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    const unsub = subscribeComments(postId, (list) => {
      setComments(list);
      setLoading(false);
    });
    return unsub;
  }, [postId]);

  const handleClose = useCallback(() => {
    Animated.spring(slideAnim, {
      toValue: 700,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start(() => {
      setText('');
      onClose();
    });
  }, [slideAnim, onClose]);

  const handleSend = async () => {
    if (!postId || !uid || !text.trim() || sending) return;
    setSending(true);
    try {
      await addComment(postId, uid, text.trim(), profile?.username, profile?.avatarUrl);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const sheetPaddingBottom = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

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

          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Comentários</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                Nenhum comentário ainda. Seja o primeiro.
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => <CommentRow comment={item} />}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: withAlpha(theme.border, 0.2) }]} />
              )}
              showsVerticalScrollIndicator={false}
            />
          )}

          <View style={[styles.inputRow, { borderTopColor: withAlpha(theme.border, 0.25) }]}>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: withAlpha(theme.card, 0.8),
                  borderColor: withAlpha(theme.border, 0.5),
                },
              ]}
              placeholder="Escreva um comentário…"
              placeholderTextColor={theme.textMuted}
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: text.trim() ? theme.accent : withAlpha(theme.accent, 0.3) },
              ]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name="send" size={16} color="#000" />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
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
    height: '75%',
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: { fontSize: 13, textAlign: 'center' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 8 },
  separator: { height: StyleSheet.hairlineWidth },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
