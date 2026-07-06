import React, { useMemo } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ListRenderItem,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/store/themeStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { PostCard } from '@/components/feed/PostCard';
import { withAlpha } from '@/lib/theme';
import { usePosts } from '@/hooks/usePosts';
import { useCatalog } from '@/hooks/useCatalog';
import { FeedPost, CigarCatalog, WhiskyCatalog } from '@/lib/firebase';
import {
  getCigarOfTheDay,
  getBrandSpotlight,
  getCuratedCollections,
  getPairingOfTheDay,
} from '@/lib/discoveryCuration';
import { CigarOfTheDayCard } from '@/components/discovery/CigarOfTheDayCard';
import { BrandSpotlightCard } from '@/components/discovery/BrandSpotlightCard';
import { CuratedCollectionRow } from '@/components/discovery/CuratedCollectionRow';
import { PairingOfTheDayCard } from '@/components/discovery/PairingOfTheDayCard';

// Chave estável do dia (fuso local) usada como dependência do useMemo — a
// curadoria em si é recalculada apenas quando o dia ou o catálogo mudam.
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function DiscoveryHeader() {
  const { items: catalogItems } = useCatalog();

  const cigars = useMemo(
    () => catalogItems.filter((i) => i.itemType === 'cigar') as (CigarCatalog & { itemType: 'cigar' })[],
    [catalogItems],
  );
  const whiskies = useMemo(
    () => catalogItems.filter((i) => i.itemType === 'whisky') as (WhiskyCatalog & { itemType: 'whisky' })[],
    [catalogItems],
  );

  const key = todayKey();
  const cigarOfDay = useMemo(() => getCigarOfTheDay(cigars), [cigars, key]);
  const brandSpotlight = useMemo(() => getBrandSpotlight(cigars), [cigars, key]);
  const curatedCollections = useMemo(() => getCuratedCollections(cigars), [cigars]);
  const pairingOfDay = useMemo(
    () => getPairingOfTheDay(cigars, whiskies),
    [cigars, whiskies, key],
  );

  if (!cigarOfDay && !brandSpotlight && curatedCollections.length === 0 && !pairingOfDay) {
    return null;
  }

  return (
    <View style={styles.discoverySection}>
      {cigarOfDay && <CigarOfTheDayCard cigar={cigarOfDay} />}
      {pairingOfDay && <PairingOfTheDayCard pairing={pairingOfDay} />}
      {brandSpotlight && <BrandSpotlightCard spotlight={brandSpotlight} />}
      {curatedCollections.map((collection) => (
        <CuratedCollectionRow key={collection.title} collection={collection} />
      ))}
    </View>
  );
}

export default function FeedScreen() {
  const theme = useTheme();
  const { posts, loading } = usePosts();
  const username = useAuthStore((s) => s.profile?.username);
  const greeting = `${greetingForHour(new Date().getHours())}, ${username ?? 'Aficionado'}`;

  const renderItem: ListRenderItem<FeedPost> = ({ item }) => (
    <PostCard post={item} />
  );

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <Image
            source={require('@/assets/cubanos_logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={styles.headerText}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: theme.accent }]}>CUBANOS</Text>
              <View style={[styles.headerRule, { backgroundColor: withAlpha(theme.accent, 0.35) }]} />
              <Text style={[styles.headerSub, { color: theme.textMuted }]}>Feed</Text>
            </View>
            <Text style={[styles.headerGreeting, { color: theme.textMuted }]}>{greeting}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : (
          <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={<DiscoveryHeader />}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={[styles.emptyIcon, { color: withAlpha(theme.accent, 0.4) }]}>🍃</Text>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhum post ainda</Text>
                <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
                  Registre uma degustação pública ou siga outros colecionadores para ver posts aqui.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </VideoBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  discoverySection: { paddingTop: 12, paddingBottom: 4 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  headerText: {
    gap: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerGreeting: {
    fontSize: 12,
    letterSpacing: 0.5,
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
