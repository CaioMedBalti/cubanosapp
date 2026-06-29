import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { HierarchyBadge } from '@/components/ui/HierarchyBadge';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { withAlpha } from '@/lib/theme';
import { useHumidor } from '@/hooks/useHumidor';
import { seedCatalog, seedPosts, seedHumidor } from '@/lib/firestore';

function StatItem({ label, value }: { label: string; value: number | string }) {
  const theme = useTheme();
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const signOut = useAuthStore((s) => s.signOut);
  const profile = useAuthStore((s) => s.profile);
  const uid = useAuthStore((s) => s.uid);
  const { items: humidorItems } = useHumidor();
  const [seeding, setSeeding] = useState(false);

  const cigarsInHumidor = humidorItems.reduce((s, i) => s + i.quantity, 0);

  const handleSignOut = () => {
    signOut();
    router.replace('/(auth)/login');
  };

  const handleSeed = async () => {
    if (!uid) return;
    setSeeding(true);
    try {
      const name = profile?.username ?? 'Aficionado';
      await Promise.all([
        seedCatalog(),
        seedPosts(uid, name),
        seedHumidor(uid),
      ]);
      Alert.alert('Seed concluído', 'Catálogo, posts e humidor populados com sucesso!');
    } catch (e) {
      Alert.alert('Erro', 'Falha ao popular o banco de dados.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Perfil</Text>
            <TouchableOpacity onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Avatar + Badge */}
          <View style={styles.heroSection}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: withAlpha(theme.accent, 0.15),
                  borderColor: withAlpha(theme.accent, 0.35),
                },
              ]}
            >
              <Ionicons name="person" size={40} color={theme.accent} />
            </View>
            <Text style={[styles.username, { color: theme.text }]}>
              {profile?.username ?? 'Aficionado'}
            </Text>
            <Text style={[styles.bio, { color: theme.textMuted }]}>
              {profile?.bio ?? 'Explorador de charutos e whiskies premium'}
            </Text>
            <HierarchyBadge tastingCount={0} size="lg" />
          </View>

          {/* Stats */}
          <View
            style={[
              styles.statsRow,
              {
                backgroundColor: withAlpha(theme.surface, 0.7),
                borderTopColor: withAlpha(theme.border, 0.3),
                borderBottomColor: withAlpha(theme.border, 0.3),
              },
            ]}
          >
            <StatItem label="Degustações" value={0} />
            <View style={[styles.statDivider, { backgroundColor: withAlpha(theme.border, 0.4) }]} />
            <StatItem label="Humidor" value={cigarsInHumidor} />
            <View style={[styles.statDivider, { backgroundColor: withAlpha(theme.border, 0.4) }]} />
            <StatItem label="Seguidores" value={0} />
            <View style={[styles.statDivider, { backgroundColor: withAlpha(theme.border, 0.4) }]} />
            <StatItem label="Seguindo" value={0} />
          </View>

          {/* Theme Switcher */}
          <View
            style={[
              styles.section,
              {
                backgroundColor: withAlpha(theme.card, 0.8),
                borderColor: withAlpha(theme.border, 0.4),
              },
            ]}
          >
            <ThemeSwitcher />
          </View>

          {/* Menu Items */}
          {[
            { icon: 'bookmark-outline', label: 'Minhas Degustações' },
            { icon: 'trophy-outline', label: 'Conquistas' },
            { icon: 'settings-outline', label: 'Configurações' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                {
                  backgroundColor: withAlpha(theme.card, 0.7),
                  borderColor: withAlpha(theme.border, 0.3),
                },
              ]}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon as any} size={20} color={theme.textMuted} />
              <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          ))}

          {/* Dev: Seed */}
          <TouchableOpacity
            onPress={handleSeed}
            disabled={seeding}
            style={[
              styles.seedBtn,
              {
                backgroundColor: withAlpha(theme.accent, 0.12),
                borderColor: withAlpha(theme.accent, 0.3),
              },
            ]}
            activeOpacity={0.7}
          >
            {seeding ? (
              <ActivityIndicator color={theme.accent} size="small" />
            ) : (
              <Ionicons name="leaf-outline" size={18} color={theme.accent} />
            )}
            <Text style={[styles.seedLabel, { color: theme.accent }]}>
              {seeding ? 'Populando…' : 'Seed — Popular banco de dados'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
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
  headerTitle: { fontSize: 22, fontWeight: '700' },
  heroSection: {
    alignItems: 'center',
    padding: 28,
    gap: 10,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  username: { fontSize: 20, fontWeight: '700' },
  bio: { fontSize: 13, textAlign: 'center', maxWidth: 260 },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, letterSpacing: 0.3 },
  statDivider: { width: StyleSheet.hairlineWidth },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  seedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  seedLabel: { fontSize: 14, fontWeight: '600' },
});
