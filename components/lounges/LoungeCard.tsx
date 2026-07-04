import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { Lounge } from '@/lib/firebase';

export function LoungeCard({ lounge, distanceKm }: { lounge: Lounge; distanceKm?: number }) {
  const theme = useTheme();

  const openInMaps = () => {
    const query = encodeURIComponent(`${lounge.name}, ${lounge.address}, ${lounge.city}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: withAlpha(theme.border, 0.4) },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.name, { color: theme.text }]}>{lounge.name}</Text>
        {distanceKm !== undefined && (
          <Text style={[styles.distance, { color: theme.accent }]}>
            {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
          </Text>
        )}
      </View>
      <Text style={[styles.address, { color: theme.textMuted }]}>
        {lounge.address} · {lounge.city}
      </Text>
      {lounge.description && (
        <Text style={[styles.description, { color: theme.textMuted }]} numberOfLines={2}>
          {lounge.description}
        </Text>
      )}
      <TouchableOpacity style={styles.mapBtn} onPress={openInMaps} activeOpacity={0.7}>
        <Ionicons name="navigate-outline" size={14} color={theme.accent} />
        <Text style={[styles.mapBtnText, { color: theme.accent }]}>Abrir no mapa</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', flex: 1 },
  distance: { fontSize: 12, fontWeight: '700' },
  address: { fontSize: 12 },
  description: { fontSize: 12, marginTop: 2 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  mapBtnText: { fontSize: 12, fontWeight: '600' },
});
