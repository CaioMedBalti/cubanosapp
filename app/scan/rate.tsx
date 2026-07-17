import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Redirect } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { useAuthStore } from '@/store/authStore';
import { useScanStore } from '@/store/scanStore';
import { useTastingSessionStore } from '@/store/tastingSessionStore';
import { logTasting, addHumidorItem } from '@/lib/firestore';
import { FLAVOR_NOTES } from '@/constants/flavorNotes';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { RatingScale10 } from '@/components/ui/RatingScale10';

type DateChoice = 'today' | 'yesterday' | 'custom';

function resolveDate(choice: DateChoice, custom: string): string {
  if (choice === 'today') return new Date().toISOString();
  if (choice === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString();
  }
  // DD/MM/AAAA → ISO; entrada inválida cai para hoje.
  const m = custom.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return new Date().toISOString();
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// Pós-double-check: o scan já está confirmado/corrigido no Firestore — a
// avaliação é bônus (pular aqui não degrada o dado). Duas saídas: degustação
// ao vivo cronometrada (/tastings/session) ou avaliação retrospectiva direta.
export default function ScanRateScreen() {
  const theme = useTheme();
  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);
  const { confirmedCigar, scanId, photoUrl, reset } = useScanStore();
  const startSession = useTastingSessionStore((s) => s.start);

  const [rating10, setRating10] = useState<number | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [dateChoice, setDateChoice] = useState<DateChoice>('today');
  const [customDate, setCustomDate] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [addToHumidor, setAddToHumidor] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!confirmedCigar || !scanId) return <Redirect href="/scan" />;

  const toggleFlavor = (note: string) => {
    setSelectedFlavors((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note],
    );
  };

  const handleStartSession = () => {
    startSession(
      {
        id: confirmedCigar.id,
        name: confirmedCigar.name,
        brand: confirmedCigar.brand,
        smokeTimeMin: confirmedCigar.smokeTimeMin,
      },
      { scanId, photoUrl },
    );
    reset();
    router.replace('/tastings/session');
  };

  const canSave = rating10 !== null && !saving;

  const handleSave = async () => {
    if (!uid || rating10 === null) return;
    setSaving(true);
    try {
      if (addToHumidor) {
        await addHumidorItem(uid, {
          cigarName: confirmedCigar.name,
          brand: confirmedCigar.brand,
          quantity: 1,
          status: 'intact',
          cigarId: confirmedCigar.imageKey ?? null,
          unidentified: !confirmedCigar.imageKey,
          origin: confirmedCigar.origin,
          strength: confirmedCigar.strength,
          flavorNotes: confirmedCigar.flavorNotes,
          photoUrl: photoUrl ?? undefined,
        });
      }
      await logTasting({
        userId: uid,
        cigarId: confirmedCigar.id,
        itemName: confirmedCigar.name,
        itemBrand: confirmedCigar.brand,
        authorName: profile?.username ?? 'Aficionado',
        avatarUrl: profile?.avatarUrl,
        rating10,
        notes: notes.trim() || null,
        flavorNotes: selectedFlavors,
        isPublic,
        date: resolveDate(dateChoice, customDate),
        scanId,
        photoUrl,
        smokeMode: 'quick',
      });
      reset();
      router.dismissAll();
      router.replace('/tastings');
    } finally {
      setSaving(false);
    }
  };

  const dateOptions: { key: DateChoice; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: 'yesterday', label: 'Ontem' },
    { key: 'custom', label: 'Outra data' },
  ];

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => { reset(); router.dismissAll(); router.replace('/(tabs)/humidor'); }}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Avaliar experiência</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={[styles.cigarCard, { backgroundColor: theme.card, borderColor: withAlpha(theme.border, 0.4) }]}>
              <Text style={[styles.cigarBrand, { color: theme.accent }]}>
                {confirmedCigar.brand.toUpperCase()}
              </Text>
              <Text style={[styles.cigarName, { color: theme.text }]}>{confirmedCigar.name}</Text>
            </View>

            <ThemedButton
              label="▶  Iniciar degustação"
              onPress={handleStartSession}
              style={{ marginTop: 4 }}
            />
            <Text style={[styles.orText, { color: theme.textMuted }]}>
              ou avalie direto uma fumada que já aconteceu
            </Text>

            <Text style={[styles.label, { color: theme.textMuted }]}>Sua nota (0–10)</Text>
            <RatingScale10 value={rating10} onChange={setRating10} />

            <Text style={[styles.label, { color: theme.textMuted, marginTop: 20 }]}>Notas de degustação</Text>
            <View style={styles.tags}>
              {FLAVOR_NOTES.map((note) => {
                const active = selectedFlavors.includes(note);
                return (
                  <TouchableOpacity
                    key={note}
                    onPress={() => toggleFlavor(note)}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: active ? withAlpha(theme.accent, 0.2) : withAlpha(theme.accent, 0.07),
                        borderColor: active ? theme.accent : withAlpha(theme.accent, 0.2),
                      },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: active ? theme.accent : theme.textMuted }]}>{note}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { color: theme.textMuted, marginTop: 20 }]}>Comentário</Text>
            <TextInput
              style={[styles.textarea, { backgroundColor: withAlpha(theme.surface, 0.8), borderColor: withAlpha(theme.border, 0.5), color: theme.text }]}
              placeholder="Como foi a experiência?"
              placeholderTextColor={theme.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />

            <Text style={[styles.label, { color: theme.textMuted, marginTop: 20 }]}>Data da fumada</Text>
            <View style={styles.tags}>
              {dateOptions.map((opt) => {
                const active = dateChoice === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setDateChoice(opt.key)}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: active ? withAlpha(theme.accent, 0.2) : withAlpha(theme.accent, 0.07),
                        borderColor: active ? theme.accent : withAlpha(theme.accent, 0.2),
                      },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: active ? theme.accent : theme.textMuted }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {dateChoice === 'custom' && (
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: withAlpha(theme.card, 0.8), borderColor: withAlpha(theme.border, 0.5), marginTop: 8 }]}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={theme.textMuted}
                value={customDate}
                onChangeText={setCustomDate}
                keyboardType="numeric"
              />
            )}

            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: theme.textMuted, marginBottom: 0 }]}>Compartilhar no feed</Text>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: withAlpha(theme.border, 0.5), true: withAlpha(theme.accent, 0.5) }}
                thumbColor={isPublic ? theme.accent : theme.textMuted}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: theme.textMuted, marginBottom: 0 }]}>Adicionar ao humidor</Text>
              <Switch
                value={addToHumidor}
                onValueChange={setAddToHumidor}
                trackColor={{ false: withAlpha(theme.border, 0.5), true: withAlpha(theme.accent, 0.5) }}
                thumbColor={addToHumidor ? theme.accent : theme.textMuted}
              />
            </View>

            <ThemedButton
              label="Salvar avaliação"
              onPress={handleSave}
              disabled={!canSave}
              loading={saving}
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
  cigarCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 3, marginBottom: 12 },
  cigarBrand: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  cigarName: { fontSize: 17, fontWeight: '700' },
  orText: { fontSize: 12, textAlign: 'center', marginVertical: 14 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 12, fontWeight: '600' },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 90, textAlignVertical: 'top' },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 44, fontSize: 15 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
});
