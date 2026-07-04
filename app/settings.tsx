import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { withAlpha } from '@/lib/theme';
import { updateUserProfile } from '@/lib/firestore';

export default function SettingsScreen() {
  const theme = useTheme();
  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const signOut = useAuthStore((s) => s.signOut);

  const [username, setUsername] = useState(profile?.username ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);

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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
});
