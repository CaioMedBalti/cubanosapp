import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Redirect } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { useAuthStore } from '@/store/authStore';
import { useScanStore } from '@/store/scanStore';
import { resolveScan, submitContribution } from '@/lib/firestore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { ThemedButton } from '@/components/ui/ThemedButton';

// Fluxo colaborativo: vitola que não existe no catálogo entra na fila de
// moderação (contributions, status 'pending'). Admin aprova em
// app/admin/contributions.tsx e ela vira vitola oficial.
export default function ScanContributeScreen() {
  const theme = useTheme();
  const uid = useAuthStore((s) => s.uid);
  const { scanId, aiResult: aiGuess, photoUrl, photoUri, reset } = useScanStore();

  const [brand, setBrand] = useState(aiGuess?.brand ?? '');
  const [line, setLine] = useState('');
  const [name, setName] = useState(aiGuess?.name ?? '');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!scanId && !sent) return <Redirect href="/scan" />;

  const canSend = brand.trim().length > 0 && name.trim().length > 0 && !sending;

  const handleSubmit = async () => {
    if (!uid || !scanId || !canSend) return;
    setSending(true);
    try {
      await resolveScan(scanId, 'not_found');
      await submitContribution({
        userId: uid,
        scanId,
        brandText: brand.trim(),
        lineText: line.trim(),
        commercialNameText: name.trim(),
        photoUrl,
        notes: notes.trim() || null,
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const handleDone = () => {
    reset();
    router.dismissAll();
    router.replace('/(tabs)/humidor');
  };

  if (sent) {
    return (
      <VideoBackground style={styles.container}>
        <SafeAreaView style={[styles.safe, styles.thanksWrap]} edges={['top']}>
          <Ionicons name="checkmark-circle" size={64} color={theme.accent} />
          <Text style={[styles.thanksTitle, { color: theme.text }]}>Obrigado!</Text>
          <Text style={[styles.thanksBody, { color: theme.textMuted }]}>
            Sua vitola entrou na fila de revisão. Você está ajudando a construir a maior base de
            Habanos.
          </Text>
          <ThemedButton label="Voltar ao Humidor" onPress={handleDone} style={{ alignSelf: 'stretch' }} />
        </SafeAreaView>
      </VideoBackground>
    );
  }

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Cadastrar vitola</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {photoUri && <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />}

            <Text style={[styles.label, { color: theme.textMuted }]}>Marca</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: withAlpha(theme.card, 0.8), borderColor: withAlpha(theme.border, 0.5) }]}
              placeholder="Ex: Cohiba"
              placeholderTextColor={theme.textMuted}
              value={brand}
              onChangeText={setBrand}
            />

            <Text style={[styles.label, { color: theme.textMuted, marginTop: 14 }]}>Linha (opcional)</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: withAlpha(theme.card, 0.8), borderColor: withAlpha(theme.border, 0.5) }]}
              placeholder="Ex: Línea 1492"
              placeholderTextColor={theme.textMuted}
              value={line}
              onChangeText={setLine}
            />

            <Text style={[styles.label, { color: theme.textMuted, marginTop: 14 }]}>Nome comercial</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: withAlpha(theme.card, 0.8), borderColor: withAlpha(theme.border, 0.5) }]}
              placeholder="Ex: Siglo VI"
              placeholderTextColor={theme.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: theme.textMuted, marginTop: 14 }]}>Observações (opcional)</Text>
            <TextInput
              style={[styles.textarea, { color: theme.text, backgroundColor: withAlpha(theme.card, 0.8), borderColor: withAlpha(theme.border, 0.5) }]}
              placeholder="Algo que ajude na revisão (edição limitada, ano, loja...)"
              placeholderTextColor={theme.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <ThemedButton
              label="Enviar para revisão"
              onPress={handleSubmit}
              disabled={!canSend}
              loading={sending}
              style={{ marginTop: 24 }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
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
  scroll: { padding: 20, paddingBottom: 40 },
  photo: { height: 160, borderRadius: 14, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 44, fontSize: 15 },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 72, textAlignVertical: 'top' },
  thanksWrap: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  thanksTitle: { fontSize: 22, fontWeight: '800' },
  thanksBody: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
