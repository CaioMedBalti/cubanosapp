import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { useAuthStore } from '@/store/authStore';
import { useScanStore } from '@/store/scanStore';
import { identifyCigarImage } from '@/lib/ai';
import { uploadScanPhoto } from '@/lib/photos';
import { createScan } from '@/lib/firestore';
import { useCatalogCigarMatching } from '@/hooks/useCatalogCigarMatching';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { ThemedButton } from '@/components/ui/ThemedButton';

// Entrada do fluxo do scanner: foto → IA identifica → doc de scans criado
// (nasce 'abandoned' — o registro existe antes de qualquer confirmação) →
// tela "É esse mesmo?" (confirm.tsx). O double check nunca é pulado.
export default function ScanCaptureScreen() {
  const theme = useTheme();
  const uid = useAuthStore((s) => s.uid);
  const { match, loading: catalogLoading } = useCatalogCigarMatching();
  const scanStore = useScanStore();

  const [identifying, setIdentifying] = useState(false);
  const [error, setError] = useState('');

  const handleOpenCamera = async () => {
    setError('');
    try {
      let result: ImagePicker.ImagePickerResult;
      if (Platform.OS === 'web') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        });
      } else {
        const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
        if (perm !== 'granted') {
          setError('Permissão de câmera negada.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
          allowsEditing: true,
          aspect: [4, 3],
        });
      }
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        scanStore.setPhoto(
          asset.uri,
          asset.base64 ?? '',
          asset.mimeType ?? 'image/jpeg',
        );
      }
    } catch {
      setError('Não foi possível abrir a câmera.');
    }
  };

  const handleIdentify = async () => {
    const { photoUri, photoBase64, mimeType } = useScanStore.getState();
    if (!photoBase64 || !uid) return;
    setIdentifying(true);
    setError('');
    try {
      // Upload em paralelo com a identificação; se falhar, o scan é
      // registrado com photoUrl null — a foto nunca bloqueia o double check.
      const uploadPromise = (async () => {
        const blob = await (await fetch(photoUri!)).blob();
        return uploadScanPhoto(uid, blob);
      })().catch(() => null);

      const aiResult = await identifyCigarImage(
        photoBase64,
        (mimeType ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp',
      );
      const photoUrl = await uploadPromise;

      const matchResult = match(aiResult.name, aiResult.brand);
      const candidate = matchResult.type !== 'none' ? matchResult.entry : null;
      const confidence =
        matchResult.type === 'exact' ? 1 : matchResult.type === 'fuzzy' ? matchResult.confidence : 0;

      const scanId = await createScan({
        userId: uid,
        photoUrl,
        suggestedCigarId: candidate?.id ?? null,
        suggestedName: candidate?.name,
        suggestedBrand: candidate?.brand,
        aiGuess: {
          name: aiResult.name,
          brand: aiResult.brand,
          origin: aiResult.origin,
          strength: aiResult.strength,
        },
        confidence,
      });

      scanStore.setPhotoUrl(photoUrl);
      scanStore.setIdentification(aiResult, matchResult, scanId);
      router.push('/scan/confirm');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao identificar pela imagem.');
    } finally {
      setIdentifying(false);
    }
  };

  const handleBack = () => {
    scanStore.reset();
    router.back();
  };

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Escanear charuto</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.body}>
          {scanStore.photoUri ? (
            <Image source={{ uri: scanStore.photoUri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <TouchableOpacity
              style={[
                styles.capturePlaceholder,
                { borderColor: withAlpha(theme.accent, 0.4), backgroundColor: withAlpha(theme.card, 0.5) },
              ]}
              onPress={handleOpenCamera}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={48} color={theme.accent} />
              <Text style={[styles.captureHint, { color: theme.textMuted }]}>
                Fotografe a anilha do charuto
              </Text>
            </TouchableOpacity>
          )}

          {!!error && <Text style={[styles.error, { color: '#e05555' }]}>{error}</Text>}

          {scanStore.photoUri && (
            <View style={styles.actions}>
              <ThemedButton
                label={identifying ? 'Identificando…' : 'Identificar'}
                icon="sparkles-outline"
                onPress={handleIdentify}
                disabled={identifying || catalogLoading}
                loading={identifying}
              />
              <TouchableOpacity onPress={handleOpenCamera} style={styles.retake} disabled={identifying}>
                <Text style={[styles.retakeText, { color: theme.textMuted }]}>Tirar outra foto</Text>
              </TouchableOpacity>
            </View>
          )}

          {identifying && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.accent} size="small" />
              <Text style={[styles.loadingText, { color: theme.textMuted }]}>
                Comparando com o catálogo…
              </Text>
            </View>
          )}
        </View>
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
  body: { flex: 1, padding: 20, gap: 16 },
  capturePlaceholder: {
    height: 280,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  captureHint: { fontSize: 14 },
  preview: { height: 280, borderRadius: 18 },
  actions: { gap: 10 },
  retake: { alignItems: 'center', paddingVertical: 8 },
  retakeText: { fontSize: 13 },
  error: { fontSize: 13, textAlign: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13 },
});
