import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Redirect } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { useScanStore } from '@/store/scanStore';
import { resolveScan } from '@/lib/firestore';
import { CIGAR_IMAGE_MAP } from '@/lib/cigarImages';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { ThemedButton } from '@/components/ui/ThemedButton';

// O coração do double check: SEMPRE aparece após a identificação — o palpite
// da IA nunca entra na base sem validação humana. Voltar/fechar aqui não grava
// nada: o doc de scans já nasceu 'abandoned' na captura.
export default function ScanConfirmScreen() {
  const theme = useTheme();
  const { photoUri, match, scanId, setConfirmedCigar } = useScanStore();
  const [confirming, setConfirming] = useState(false);

  if (!scanId || !match) return <Redirect href="/scan" />;

  const candidate = match.type !== 'none' ? match.entry : null;
  const confidencePct =
    match.type === 'exact' ? 100 : match.type === 'fuzzy' ? Math.round(match.confidence * 100) : 0;
  const candidateImage = candidate?.imageKey ? CIGAR_IMAGE_MAP[candidate.imageKey] : null;

  const handleConfirm = async () => {
    if (!candidate) return;
    setConfirming(true);
    try {
      await resolveScan(scanId, 'confirmed', candidate.id);
      setConfirmedCigar(candidate);
      router.replace('/scan/rate');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {candidate ? 'É esse mesmo?' : 'Não encontramos'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          )}

          {candidate ? (
            <>
              <View
                style={[
                  styles.candidateCard,
                  { backgroundColor: theme.card, borderColor: withAlpha(theme.border, 0.4) },
                ]}
              >
                {candidateImage && (
                  <Image source={candidateImage} style={styles.candidateImage} resizeMode="contain" />
                )}
                <View style={styles.candidateBody}>
                  <Text style={[styles.candidateBrand, { color: theme.accent }]}>
                    {candidate.brand.toUpperCase()}
                  </Text>
                  <Text style={[styles.candidateName, { color: theme.text }]}>{candidate.name}</Text>
                  <Text style={[styles.candidateMeta, { color: theme.textMuted }]}>
                    {candidate.origin} · {candidate.strength}
                  </Text>
                </View>
                <View
                  style={[
                    styles.confidenceBadge,
                    { backgroundColor: withAlpha(theme.accent, 0.12), borderColor: withAlpha(theme.accent, 0.3) },
                  ]}
                >
                  <Text style={[styles.confidenceText, { color: theme.accent }]}>{confidencePct}%</Text>
                </View>
              </View>

              <ThemedButton
                label="É esse mesmo ✓"
                onPress={handleConfirm}
                loading={confirming}
                disabled={confirming}
              />
              <ThemedButton
                label="Não é esse"
                variant="outline"
                onPress={() => router.push('/scan/search')}
                disabled={confirming}
              />
            </>
          ) : (
            <>
              <Text style={[styles.noneTitle, { color: theme.text }]}>
                Não encontramos essa vitola no catálogo
              </Text>
              <Text style={[styles.noneSubtitle, { color: theme.textMuted }]}>
                Você pode buscar manualmente ou cadastrar a vitola — sua contribuição ajuda a
                construir a maior base de Habanos.
              </Text>
              <ThemedButton
                label="Buscar no catálogo"
                icon="search-outline"
                onPress={() => router.push('/scan/search')}
              />
              <ThemedButton
                label="Cadastrar nova vitola"
                variant="outline"
                onPress={() => router.push('/scan/contribute')}
              />
            </>
          )}
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
  scroll: { padding: 20, gap: 12 },
  photo: { height: 200, borderRadius: 16 },
  candidateCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    alignItems: 'center',
  },
  candidateImage: { width: 64, height: 64 },
  candidateBody: { flex: 1, gap: 3 },
  candidateBrand: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  candidateName: { fontSize: 16, fontWeight: '700' },
  candidateMeta: { fontSize: 12 },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  confidenceText: { fontSize: 12, fontWeight: '800' },
  noneTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  noneSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 8, lineHeight: 19 },
});
