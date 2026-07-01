import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CubanosCard } from '@/components/ui/HavanaCard';
import { GenericCigarPlaceholder } from '@/components/ui/GenericCigarPlaceholder';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { getCigarImage } from '@/lib/images';
import type { HumidorEntry } from '@/lib/firebase';

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

interface Props {
  item: HumidorEntry;
  onPress: () => void;
}

export function HumidorListRow({ item, onPress }: Props) {
  const theme = useTheme();
  const cigarImage = getCigarImage(item);

  return (
    <CubanosCard
      title={item.cigarName}
      subtitle={item.brand}
      image={cigarImage?.source}
      imageSize={48}
      imageResizeMode={cigarImage?.isCatalogImage ? 'contain' : 'cover'}
      imagePlaceholder={<GenericCigarPlaceholder size={20} />}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.footer}>
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
        <Text style={[styles.qtyText, { color: theme.accent }]}>{item.quantity}x</Text>
      </View>
    </CubanosCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
