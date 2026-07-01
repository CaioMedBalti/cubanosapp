import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ListRenderItem,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { withAlpha } from '@/lib/theme';
import { useHumidor } from '@/hooks/useHumidor';
import { HumidorEntry } from '@/lib/firebase';
import { AddCigarModal } from '@/components/modals/AddCigarModal';
import { CigarDetailSheet } from '@/components/modals/CigarDetailSheet';
import { getCigarImage } from '@/lib/images';
import { GenericCigarPlaceholder } from '@/components/ui/GenericCigarPlaceholder';
import { ViewModeSwitcher } from '@/components/ui/ViewModeSwitcher';
import { HumidorListRow } from '@/components/ui/HumidorListRow';
import { HumidorShelf } from '@/components/ui/HumidorShelf';
import { useHumidorViewStore } from '@/store/humidorStore';

const STATUS_LABEL: Record<HumidorEntry['status'], string> = {
  intact: 'Intacto',
  smoking: 'Em uso',
  finished: 'Finalizado',
};

const STATUS_COLOR: Record<HumidorEntry['status'], string> = {
  intact: '#4CAF50',
  smoking: '#EF9F27',
  finished: '#888',
};

function HumidorCard({ item, onPress }: { item: HumidorEntry; onPress: () => void }) {
  const theme = useTheme();
  const cigarImage = getCigarImage(item);
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: withAlpha(theme.border, 0.4),
          shadowColor: theme.accent,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {cigarImage ? (
        <View
          style={[styles.cardImageWrapper, { backgroundColor: withAlpha(theme.accent, 0.08) }]}
        >
          <Image
            source={cigarImage.source}
            style={styles.cardImage}
            resizeMode={cigarImage.isCatalogImage ? 'contain' : 'cover'}
          />
          <View style={[styles.cardQtyBadge, { backgroundColor: withAlpha('#000', 0.55) }]}>
            <Text style={[styles.cardQtyText, { color: theme.accent }]}>{item.quantity}x</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.cardThumb, { backgroundColor: withAlpha(theme.accent, 0.1) }]}>
          <GenericCigarPlaceholder size={28} />
          <Text style={[styles.thumbQty, { color: theme.accent }]}>{item.quantity}x</Text>
        </View>
      )}
      <Text style={[styles.cardBrand, { color: theme.accent }]}>{item.brand}</Text>
      <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={2}>
        {item.cigarName}
      </Text>
      {item.origin && (
        <Text style={[styles.cardMeta, { color: theme.textMuted }]} numberOfLines={1}>
          {item.origin}{item.strength ? ` · ${item.strength}` : ''}
        </Text>
      )}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: withAlpha(STATUS_COLOR[item.status], 0.15) },
        ]}
      >
        <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
          {STATUS_LABEL[item.status]}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HumidorScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { items, loading } = useHumidor();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HumidorEntry | null>(null);
  const viewMode = useHumidorViewStore((s) => s.viewMode);

  const total = items.reduce((s, i) => s + i.quantity, 0);

  const tabBarHeight = Platform.OS === 'ios' ? 84 : Platform.OS === 'android' ? 64 : 64;
  const fabBottom = insets.bottom + tabBarHeight + 16;
  const listPaddingBottom = insets.bottom + tabBarHeight + 80;

  const renderItem: ListRenderItem<HumidorEntry> = ({ item }) => (
    <HumidorCard item={item} onPress={() => setSelectedItem(item)} />
  );

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <View style={styles.headerTitleRow}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Humidor</Text>
            {!loading && (
              <Text style={[styles.headerCount, { color: theme.textMuted }]}>
                {total} charuto{total !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <ViewModeSwitcher />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyIcon, { color: withAlpha(theme.accent, 0.4) }]}>📦</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Humidor vazio</Text>
            <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
              Toque em + para adicionar seu primeiro charuto.
            </Text>
          </View>
        ) : viewMode === 'shelf' ? (
          <HumidorShelf
            items={items}
            onPressItem={setSelectedItem}
            contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
          />
        ) : viewMode === 'list' ? (
          <FlatList
            key="list"
            data={items}
            renderItem={({ item }) => (
              <HumidorListRow item={item} onPress={() => setSelectedItem(item)} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            key="grid"
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* FAB */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.accent, bottom: fabBottom }]}
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={28} color="#000" />
        </TouchableOpacity>
      </SafeAreaView>

      <AddCigarModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <CigarDetailSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerCount: { fontSize: 13 },
  list: { padding: 12 },
  row: { gap: 10 },
  card: {
    flex: 1,
    margin: 4,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardThumb: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    gap: 4,
  },
  cardImageWrapper: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardQtyBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardQtyText: {
    fontSize: 11,
    fontWeight: '800',
  },
  thumbQty: { fontSize: 13, fontWeight: '800' },
  cardBrand: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  cardName: { fontSize: 14, fontWeight: '600' },
  cardMeta: { fontSize: 10, letterSpacing: 0.2 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
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
