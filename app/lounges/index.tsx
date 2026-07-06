import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '@/store/themeStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { withAlpha } from '@/lib/theme';
import { FONTS } from '@/constants/typography';
import { subscribeApprovedLounges } from '@/lib/firestore';
import { haversineDistanceKm } from '@/lib/geo';
import { Lounge } from '@/lib/firebase';
import { LoungeCard } from '@/components/lounges/LoungeCard';

export default function LoungesScreen() {
  const theme = useTheme();
  const [lounges, setLounges] = useState<Lounge[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const unsub = subscribeApprovedLounges((list) => {
      setLounges(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleFindNearby = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      setLocationDenied(false);
    } catch {
      setLocationDenied(true);
    } finally {
      setLocating(false);
    }
  };

  const sortedLounges = useMemo(() => {
    if (userLocation) {
      return [...lounges]
        .map((l) => ({
          lounge: l,
          distanceKm: haversineDistanceKm(userLocation.lat, userLocation.lng, l.lat, l.lng),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }
    return [...lounges]
      .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name))
      .map((lounge) => ({ lounge, distanceKm: undefined as number | undefined }));
  }, [lounges, userLocation]);

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Lounges</Text>
          <TouchableOpacity onPress={() => router.push('/lounges/suggest')}>
            <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.nearbyBtn, { borderColor: withAlpha(theme.accent, 0.4) }]}
            onPress={handleFindNearby}
            activeOpacity={0.7}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Ionicons name="locate-outline" size={16} color={theme.accent} />
            )}
            <Text style={[styles.nearbyBtnText, { color: theme.accent }]}>
              {userLocation ? 'Atualizar proximidade' : 'Encontrar mais próximos'}
            </Text>
          </TouchableOpacity>
          {locationDenied && (
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              Permissão de localização negada — ordenando por cidade.
            </Text>
          )}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : sortedLounges.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyIcon, { color: withAlpha(theme.accent, 0.4) }]}>📍</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhum lounge ainda</Text>
            <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
              Sugira um lounge para a comunidade — toque no + acima.
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedLounges}
            keyExtractor={(item) => item.lounge.id}
            renderItem={({ item }) => (
              <LoungeCard lounge={item.lounge} distanceKm={item.distanceKm} />
            )}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
  actionRow: { paddingHorizontal: 20, paddingTop: 14, gap: 6 },
  nearbyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
  },
  nearbyBtnText: { fontSize: 13, fontWeight: '700' },
  hint: { fontSize: 11, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyHint: { fontSize: 13, textAlign: 'center' },
  list: { padding: 20 },
});
