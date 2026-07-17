import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { withAlpha } from '@/lib/theme';
import { FONTS } from '@/constants/typography';
import { updateUserProfile } from '@/lib/firestore';
import { uploadUserAvatar } from '@/lib/photos';

export default function SettingsScreen() {
  const theme = useTheme();
  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const signOut = useAuthStore((s) => s.signOut);

  const [username, setUsername] = useState(profile?.username ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handlePickAvatar = async () => {
    if (!uid || avatarUploading) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;
    setAvatarUploading(true);
    try {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const avatarUrl = await uploadUserAvatar(uid, blob);
      await updateUserProfile(uid, { avatarUrl });
      if (profile) setProfile({ ...profile, avatarUrl });
    } catch {
      // upload de avatar é opcional — falha silenciosa não trava a tela
    } finally {
      setAvatarUploading(false);
    }
  };

  const inputStyle = {
    backgroundColor: withAlpha(theme.surface, 0.8),
    borderColor: withAlpha(theme.border, 0.7),
    color: theme.text,
  };

  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      await updateUserProfile(uid, { username, bio: bio || null });
      if (profile) setProfile({ ...profile, username, bio: bio || null });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    router.replace('/(auth)/login');
  };

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Configurações</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>CONTA</Text>
          <View
            style={[
              styles.section,
              { backgroundColor: withAlpha(theme.card, 0.8), borderColor: withAlpha(theme.border, 0.4) },
            ]}
          >
            <View style={styles.avatarRow}>
              <View
                style={[
                  styles.avatarPreview,
                  { backgroundColor: withAlpha(theme.accent, 0.12), borderColor: withAlpha(theme.accent, 0.3) },
                ]}
              >
                {avatarUploading ? (
                  <ActivityIndicator color={theme.accent} />
                ) : profile?.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="person" size={30} color={theme.accent} />
                )}
              </View>
              <TouchableOpacity onPress={handlePickAvatar} disabled={avatarUploading}>
                <Text style={[styles.avatarAction, { color: theme.accent }]}>
                  {profile?.avatarUrl ? 'Alterar foto' : 'Adicionar foto'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Username</Text>
              <TextInput
                style={[styles.input, inputStyle]}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Bio</Text>
              <TextInput
                style={[styles.input, inputStyle]}
                value={bio}
                onChangeText={setBio}
                placeholder="Explorador de charutos e whiskies premium"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <ThemedButton label="Salvar" onPress={handleSave} loading={saving} variant="secondary" />
          </View>

          <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: 24 }]}>APARÊNCIA</Text>
          <View
            style={[
              styles.section,
              { backgroundColor: withAlpha(theme.card, 0.8), borderColor: withAlpha(theme.border, 0.4) },
            ]}
          >
            <ThemeSwitcher />
          </View>

          {profile?.isAdmin && (
            <>
              <Text style={[styles.sectionLabel, { color: theme.textMuted, marginTop: 24 }]}>ADMIN</Text>
              <View
                style={[
                  styles.section,
                  { backgroundColor: withAlpha(theme.card, 0.8), borderColor: withAlpha(theme.border, 0.4) },
                ]}
              >
                <ThemedButton
                  label="Moderação de vitolas"
                  onPress={() => router.push('/admin/contributions')}
                  variant="secondary"
                  icon="shield-checkmark-outline"
                />
              </View>
            </>
          )}

          <ThemedButton
            label="Sair da conta"
            onPress={handleSignOut}
            variant="outline"
            icon="log-out-outline"
            style={{ marginTop: 28 }}
          />
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
  headerTitle: { fontSize: 18, fontFamily: FONTS.display },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarPreview: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 72, height: 72 },
  avatarAction: { fontSize: 14, fontWeight: '700' },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
});
