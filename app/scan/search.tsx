import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Redirect } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { useScanStore } from '@/store/scanStore';
import { resolveScan, getCigars } from '@/lib/firestore';
import { CigarCatalog } from '@/lib/firebase';
import { VideoBackground } from '@/components/ui/VideoBackground';

// Correção manual do palpite da IA. O dado gerado aqui é o mais valioso do
// produto: aiGuess + sugestão errada + resposta certa = par de treino
// (result 'corrected' no doc de scans).
export default function ScanSearchScreen() {
  const theme = useTheme();
  const { scanId, setConfirmedCigar } = useScanStore();
  const [catalog, setCatalog] = useState<CigarCatalog[]>([]);
  const [query, setQuery] = useState('');
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    getCigars().then(setCatalog);
  }, []);

  if (!scanId) return <Redirect href="/scan" />;

  const matches =
    query.length > 0
      ? catalog
          .filter(
            (c) =>
              c.name.toLowerCase().includes(query.toLowerCase()) ||
              c.brand.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 10)
      : [];

  const handleSelect = async (cigar: CigarCatalog) => {
    if (selecting) return;
    setSelecting(true);
    try {
      await resolveScan(scanId, 'corrected', cigar.id);
      setConfirmedCigar(cigar);
      router.replace('/scan/rate');
    } finally {
      setSelecting(false);
    }
  };

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Qual é a vitola?</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.body}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: withAlpha(theme.surface, 0.9), borderColor: withAlpha(theme.border, 0.5) },
            ]}
          >
            <Ionicons name="search" size={16} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Buscar por marca ou nome"
              placeholderTextColor={theme.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
            {matches.map((cigar) => (
              <TouchableOpacity
                key={cigar.id}
                style={[styles.resultRow, { borderBottomColor: withAlpha(theme.border, 0.2) }]}
                onPress={() => handleSelect(cigar)}
                disabled={selecting}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultBrand, { color: theme.accent }]}>{cigar.brand}</Text>
                  <Text style={[styles.resultName, { color: theme.text }]}>{cigar.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
            {query.length > 0 && matches.length === 0 && (
              <Text style={[styles.empty, { color: theme.textMuted }]}>
                Nada encontrado para “{query}”.
              </Text>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.footer, { borderTopColor: withAlpha(theme.border, 0.25) }]}
            onPress={() => router.push('/scan/contribute')}
          >
            <Text style={[styles.footerText, { color: theme.accent }]}>
              Não achei minha vitola — cadastrar nova
            </Text>
          </TouchableOpacity>
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
  body: { flex: 1, padding: 20, gap: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultBrand: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  resultName: { fontSize: 15, fontWeight: '600' },
  empty: { fontSize: 13, textAlign: 'center', marginTop: 24 },
  footer: { paddingVertical: 14, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  footerText: { fontSize: 14, fontWeight: '600' },
});
