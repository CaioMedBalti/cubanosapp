import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { TastingCard } from '@/components/feed/TastingCard';
import { withAlpha } from '@/lib/theme';
import { FONTS } from '@/constants/typography';
import { timeAgo } from '@/lib/time';
import { useTastings } from '@/hooks/useTastings';
import { Tasting } from '@/lib/firebase';

export default function TastingsScreen() {
  const theme = useTheme();
  const { tastings, loading } = useTastings();

  const renderItem: ListRenderItem<Tasting> = ({ item }) => (
    <TastingCard
      cigarName={item.itemName ?? 'Sem nome'}
      brand={item.itemBrand}
      rating={item.rating}
      rating10={item.rating10}
      notes={item.notes ?? undefined}
      flavorNotes={item.flavorNotes}
      date={timeAgo(item.date)}
      phases={item.phases}
      durationSec={item.durationSec}
      style={styles.card}
    />
  );

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Minhas Degustações</Text>
          <TouchableOpacity onPress={() => router.push('/tastings/new')}>
            <Ionicons name="add" size={26} color={theme.accent} />
          </TouchableOpacity>
        </View>

        {!loading && tastings.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyIcon, { color: withAlpha(theme.accent, 0.4) }]}>🥃</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhuma degustação ainda</Text>
            <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
              Toque no + para registrar sua primeira degustação.
            </Text>
          </View>
        ) : (
          <FlatList
            data={tastings}
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
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 18, fontFamily: FONTS.display },
  list: { padding: 16, gap: 10, paddingBottom: 24 },
  card: {},
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
