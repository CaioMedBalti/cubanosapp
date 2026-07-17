import React, { useEffect, useState } from 'react';
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
import { useTastingSessionStore, sessionElapsedSec } from '@/store/tastingSessionStore';
import { logTasting } from '@/lib/firestore';
import { TastingPhase } from '@/lib/firebase';
import { FLAVOR_NOTES, STRENGTH_FELT_OPTIONS } from '@/constants/flavorNotes';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { RatingScale10 } from '@/components/ui/RatingScale10';

function formatElapsed(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const THIRD_LABELS = ['1º terço', '2º terço', '3º terço'] as const;

// Degustação ao vivo pelos três terços. O cronômetro é derivado de relógio de
// parede (store persistido) — o intervalo abaixo só força re-render do display;
// background/kill do app não perdem tempo nem estado. O avanço de terço é
// sempre MANUAL; smokeTimeMin da vitola gera apenas a sugestão visual.
export default function TastingSessionScreen() {
  const theme = useTheme();
  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);
  const session = useTastingSessionStore();

  const [, forceTick] = useState(0);
  const [finishResult, setFinishResult] = useState<{ phases: TastingPhase[]; durationSec: number } | null>(null);
  const [rating10, setRating10] = useState<number | null>(null);
  const [finalNotes, setFinalNotes] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const running = session.startedAt !== null && session.pausedAt === null && !finishResult;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!session.startedAt || !session.cigar) return <Redirect href="/(tabs)/humidor" />;

  const elapsed = sessionElapsedSec(session);
  const paused = session.pausedAt !== null;

  // Sugestão pelo tempo: em qual terço o usuário provavelmente está, se a
  // vitola tem tempo médio de fumada. Nunca avança sozinho.
  const smokeTimeSec = session.cigar.smokeTimeMin ? session.cigar.smokeTimeMin * 60 : null;
  const expectedThird = smokeTimeSec
    ? (Math.min(3, Math.floor(elapsed / (smokeTimeSec / 3)) + 1) as 1 | 2 | 3)
    : null;

  const toggleFlavor = (note: string) => {
    const current = session.draft.flavorNotes;
    session.updateDraft({
      flavorNotes: current.includes(note) ? current.filter((n) => n !== note) : [...current, note],
    });
  };

  const handleFinishThirds = () => {
    session.pause();
    setFinishResult(session.finish());
  };

  const handleSave = async () => {
    if (!uid || !finishResult || rating10 === null) return;
    setSaving(true);
    try {
      await logTasting({
        userId: uid,
        cigarId: session.cigar!.id,
        itemName: session.cigar!.name,
        itemBrand: session.cigar!.brand,
        authorName: profile?.username ?? 'Aficionado',
        avatarUrl: profile?.avatarUrl,
        rating10,
        notes: finalNotes.trim() || null,
        // Consolidado dos terços — o detalhe por fase vai em phases.
        flavorNotes: Array.from(new Set(finishResult.phases.flatMap((p) => p.flavorNotes))),
        isPublic,
        scanId: session.scanId,
        photoUrl: session.photoUrl,
        smokeMode: 'live',
        durationSec: finishResult.durationSec,
        phases: finishResult.phases,
      });
      session.reset();
      router.replace('/tastings');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    // O double check (se veio do scanner) já está salvo — descartar a sessão
    // não perde nada do dado de treino.
    session.reset();
    router.replace('/(tabs)/humidor');
  };

  // ── Etapa final: nota única 0–10 ──
  if (finishResult) {
    return (
      <VideoBackground style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
            <View style={{ width: 24 }} />
            <Text style={[styles.headerTitle, { color: theme.text }]}>Como foi?</Text>
            <View style={{ width: 24 }} />
          </View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              <View style={[styles.cigarCard, { backgroundColor: theme.card, borderColor: withAlpha(theme.border, 0.4) }]}>
                <Text style={[styles.cigarBrand, { color: theme.accent }]}>
                  {session.cigar.brand.toUpperCase()}
                </Text>
                <Text style={[styles.cigarName, { color: theme.text }]}>{session.cigar.name}</Text>
                <Text style={[styles.cigarMeta, { color: theme.textMuted }]}>
                  Degustação de {formatElapsed(finishResult.durationSec)}
                </Text>
              </View>

              <Text style={[styles.label, { color: theme.textMuted }]}>Sua nota (0–10)</Text>
              <RatingScale10 value={rating10} onChange={setRating10} />

              <Text style={[styles.label, { color: theme.textMuted, marginTop: 20 }]}>Comentário geral</Text>
              <TextInput
                style={[styles.textarea, { backgroundColor: withAlpha(theme.surface, 0.8), borderColor: withAlpha(theme.border, 0.5), color: theme.text }]}
                placeholder="Impressão geral da fumada"
                placeholderTextColor={theme.textMuted}
                value={finalNotes}
                onChangeText={setFinalNotes}
                multiline
                numberOfLines={4}
              />

              <View style={styles.switchRow}>
                <Text style={[styles.label, { color: theme.textMuted, marginBottom: 0 }]}>Compartilhar no feed</Text>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ false: withAlpha(theme.border, 0.5), true: withAlpha(theme.accent, 0.5) }}
                  thumbColor={isPublic ? theme.accent : theme.textMuted}
                />
              </View>

              <ThemedButton
                label="Salvar degustação"
                onPress={handleSave}
                disabled={rating10 === null || saving}
                loading={saving}
                style={{ marginTop: 24 }}
              />
              <TouchableOpacity
                onPress={() => { setFinishResult(null); session.resume(); }}
                style={styles.backToSession}
              >
                <Text style={[styles.backToSessionText, { color: theme.textMuted }]}>
                  Voltar para a degustação
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </VideoBackground>
    );
  }

  // ── Sessão em andamento ──
  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => setConfirmDiscard(true)}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Degustação</Text>
          <TouchableOpacity onPress={paused ? session.resume : session.pause}>
            <Ionicons name={paused ? 'play' : 'pause'} size={22} color={theme.accent} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={[styles.cigarCard, { backgroundColor: theme.card, borderColor: withAlpha(theme.border, 0.4) }]}>
              <Text style={[styles.cigarBrand, { color: theme.accent }]}>
                {session.cigar.brand.toUpperCase()}
              </Text>
              <Text style={[styles.cigarName, { color: theme.text }]}>{session.cigar.name}</Text>
            </View>

            <View style={styles.timerWrap}>
              <Text style={[styles.timer, { color: paused ? theme.textMuted : theme.text }]}>
                {formatElapsed(elapsed)}
              </Text>
              {paused && (
                <Text style={[styles.pausedLabel, { color: theme.textMuted }]}>Pausado</Text>
              )}
            </View>

            {/* Barra segmentada dos três terços */}
            <View style={styles.thirdsRow}>
              {([1, 2, 3] as const).map((third) => {
                const isCurrent = session.currentThird === third;
                const isDone = session.currentThird > third;
                return (
                  <View key={third} style={styles.thirdSegmentWrap}>
                    <View
                      style={[
                        styles.thirdSegment,
                        {
                          backgroundColor: isDone
                            ? theme.accent
                            : isCurrent
                              ? withAlpha(theme.accent, 0.45)
                              : withAlpha(theme.border, 0.35),
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.thirdLabel,
                        { color: isCurrent ? theme.accent : theme.textMuted },
                      ]}
                    >
                      {THIRD_LABELS[third - 1]}
                    </Text>
                  </View>
                );
              })}
            </View>

            {expectedThird !== null && expectedThird > session.currentThird && (
              <Text style={[styles.suggestion, { color: theme.textMuted }]}>
                Pelo tempo ({session.cigar.smokeTimeMin} min de fumada média), você provavelmente
                já está no {THIRD_LABELS[expectedThird - 1]}.
              </Text>
            )}

            <Text style={[styles.label, { color: theme.textMuted, marginTop: 20 }]}>
              Sabores do {THIRD_LABELS[session.currentThird - 1]}
            </Text>
            <View style={styles.tags}>
              {FLAVOR_NOTES.map((note) => {
                const active = session.draft.flavorNotes.includes(note);
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

            <Text style={[styles.label, { color: theme.textMuted, marginTop: 20 }]}>Força percebida</Text>
            <View style={styles.tags}>
              {STRENGTH_FELT_OPTIONS.map((opt) => {
                const active = session.draft.strengthFelt === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => session.updateDraft({ strengthFelt: active ? null : opt.value })}
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

            <Text style={[styles.label, { color: theme.textMuted, marginTop: 20 }]}>Comentário do terço</Text>
            <TextInput
              style={[styles.textarea, { backgroundColor: withAlpha(theme.surface, 0.8), borderColor: withAlpha(theme.border, 0.5), color: theme.text, minHeight: 60 }]}
              placeholder="Opcional — o que mudou nesse terço?"
              placeholderTextColor={theme.textMuted}
              value={session.draft.comment}
              onChangeText={(t) => session.updateDraft({ comment: t })}
              multiline
              numberOfLines={2}
            />

            {session.currentThird < 3 ? (
              <ThemedButton
                label={`Avançar para o ${THIRD_LABELS[session.currentThird as 1 | 2]}`}
                icon="arrow-forward-outline"
                onPress={session.advanceThird}
                style={{ marginTop: 24 }}
              />
            ) : (
              <ThemedButton
                label="Encerrar degustação"
                icon="flag-outline"
                onPress={handleFinishThirds}
                style={{ marginTop: 24 }}
              />
            )}

            {confirmDiscard && (
              <View style={[styles.discardBox, { borderColor: withAlpha(theme.border, 0.5), backgroundColor: withAlpha(theme.card, 0.8) }]}>
                <Text style={[styles.discardText, { color: theme.text }]}>
                  Descartar esta degustação? Nada será salvo.
                </Text>
                <View style={styles.discardActions}>
                  <TouchableOpacity onPress={() => setConfirmDiscard(false)} style={styles.discardBtn}>
                    <Text style={{ color: theme.textMuted, fontWeight: '600' }}>Continuar fumando</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDiscard} style={styles.discardBtn}>
                    <Text style={{ color: '#e05555', fontWeight: '700' }}>Descartar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  cigarCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 3 },
  cigarBrand: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  cigarName: { fontSize: 17, fontWeight: '700' },
  cigarMeta: { fontSize: 12, marginTop: 2 },
  timerWrap: { alignItems: 'center', marginTop: 20 },
  timer: { fontSize: 52, fontWeight: '800', fontVariant: ['tabular-nums'] },
  pausedLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  thirdsRow: { flexDirection: 'row', gap: 6, marginTop: 18 },
  thirdSegmentWrap: { flex: 1, gap: 6 },
  thirdSegment: { height: 6, borderRadius: 3 },
  thirdLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  suggestion: { fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18, fontStyle: 'italic' },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 12, fontWeight: '600' },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 90, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  backToSession: { alignItems: 'center', paddingVertical: 14 },
  backToSessionText: { fontSize: 13 },
  discardBox: { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 20, gap: 10 },
  discardText: { fontSize: 14, textAlign: 'center' },
  discardActions: { flexDirection: 'row', justifyContent: 'space-around' },
  discardBtn: { paddingVertical: 8, paddingHorizontal: 12 },
});
