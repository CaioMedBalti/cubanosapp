import React from 'react';
import { View, Text, Image, StyleSheet, FlatList, ListRenderItem, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCigarImage } from '@/lib/images';
import { GenericCigarPlaceholder } from '@/components/ui/GenericCigarPlaceholder';
import { withAlpha } from '@/lib/theme';
import type { HumidorEntry } from '@/lib/firebase';

const STATUS_COLOR: Record<HumidorEntry['status'], string> = {
  intact: '#4CAF50',
  smoking: '#EF9F27',
  finished: '#888',
};

interface Props {
  items: HumidorEntry[];
  onPressItem: (item: HumidorEntry) => void;
  contentContainerStyle?: object;
}

// Versão simplificada da "prateleira" — gavetas de madeira estilizadas via
// LinearGradient, sem @shopify/react-native-skia (última prioridade do spec;
// pode ser revisitada para um render Skia mais elaborado depois).
function ShelfDrawer({ item, onPress }: { item: HumidorEntry; onPress: () => void }) {
  const cigarImage = getCigarImage(item);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={['#5a3a20', '#3a2412']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.drawer}
      >
        <View style={styles.cigarSlot}>
          {cigarImage ? (
            <Image
              source={cigarImage.source}
              resizeMode={cigarImage.isCatalogImage ? 'contain' : 'cover'}
              style={styles.cigarImage}
            />
          ) : (
            <GenericCigarPlaceholder size={22} color="#f0e6d3" />
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.brand} numberOfLines={1}>
            {item.brand.toUpperCase()}
          </Text>
          <Text style={styles.name} numberOfLines={1}>
            {item.cigarName}
          </Text>
        </View>
        <View
          style={[
            styles.qtyBadge,
            { backgroundColor: withAlpha(STATUS_COLOR[item.status], 0.9) },
          ]}
        >
          <Text style={styles.qtyText}>{item.quantity}x</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function HumidorShelf({ items, onPressItem, contentContainerStyle }: Props) {
  const renderItem: ListRenderItem<HumidorEntry> = ({ item }) => (
    <ShelfDrawer item={item} onPress={() => onPressItem(item)} />
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  drawer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.4)',
  },
  cigarSlot: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cigarImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  brand: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#d9b872',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f5e6c8',
  },
  qtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
});
