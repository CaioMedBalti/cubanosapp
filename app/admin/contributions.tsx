import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, Redirect } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { useAuthStore } from '@/store/authStore';
import {
  subscribePendingContributions,
  approveContribution,
  rejectContribution,
} from '@/lib/firestore';
import { Contribution } from '@/lib/firebase';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { ThemedButton } from '@/components/ui/ThemedButton';

// Fila de moderação: aprovar cria a vitola oficial em cigars (batch atômico em
// approveContribution). Guard de UX apenas — quem protege os dados de verdade
// são as Security Rules (isAdmin no doc do user).
export default function AdminContributionsScreen() {
  const theme = useTheme();
  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);

  const [pending, setPending] = useState<Contribution[]>([]);
  const [reviewing, setReviewing] = useState<Contribution | null>(null);
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editOrigin, setEditOrigin] = useState('Cuba');
  const [editStrength, setEditStrength] = useState('Médio');
  const [working, setWorking] = useState(false);

  const isAdmin = profile?.isAdmin === true;

  useEffect(() => {
    if (!isAdmin) return;
    return subscribePendingContributions(setPending);
  }, [isAdmin]);

  if (!isAdmin) return <Redirect href="/(tabs)" />;

  const openReview = (c: Contribution) => {
    setReviewing(c);
    // Nome oficial: "Linha Nome" quando o usuário informou linha.
    setEditName([c.lineText, c.commercialNameText].filter(Boolean).join(' '));
    setEditBrand(c.brandText);
    setEditOrigin('Cuba');
    setEditStrength('Médio');
  };

  const handleApprove = async () => {
    if (!reviewing || !uid || working) return;
    setWorking(true);
    try {
      await approveContribution(reviewing, uid, {
        name: editName.trim(),
        brand: editBrand.trim(),
        origin: editOrigin.trim(),
        strength: editStrength.trim(),
        flavorNotes: [],
        imageUrl: reviewing.photoUrl,
      });
      setReviewing(null);
    } finally {
      setWorking(false);
    }
  };

  const handleReject = async () => {
    if (!reviewing || !uid || working) return;
    setWorking(true);
    try {
      await rejectContribution(reviewing.id, uid);
      setReviewing(null);
    } finally {
      setWorking(false);
    }
  };

  const renderItem: ListRenderItem<Contribution> = ({ item }) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: theme.card, borderColor: withAlpha(theme.border, 0.4) }]}
      onPress={() => openReview(item)}
      activeOpacity={0.8}
    >
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.rowPhoto} />
      ) : (
        <View style={[styles.rowPhoto, styles.rowPhotoEmpty, { backgroundColor: withAlpha(theme.accent, 0.1) }]}>
          <Ionicons name="image-outline" size={20} color={theme.accent} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.rowBrand, { color: theme.accent }]}>{item.brandText.toUpperCase()}</Text>
        <Text style={[styles.rowName, { color: theme.text }]}>
          {[item.lineText, item.commercialNameText].filter(Boolean).join(' ')}
        </Text>
        {!!item.notes && (
          <Text style={[styles.rowNotes, { color: theme.textMuted }]} numberOfLines={1}>
            {item.notes}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
    </TouchableOpacity>
  );

  const inputStyle = {
    color: theme.text,
    backgroundColor: withAlpha(theme.card, 0.8),
    borderColor: withAlpha(theme.border, 0.5),
  };

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => (reviewing ? setReviewing(null) : router.back())}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {reviewing ? 'Revisar vitola' : 'Moderação'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {reviewing ? (
          <View style={styles.reviewBody}>
            {reviewing.photoUrl && (
              <Image source={{ uri: reviewing.photoUrl }} style={styles.reviewPhoto} resizeMode="cover" />
            )}

            <Text style={[styles.label, { color: theme.textMuted }]}>Marca</Text>
            <TextInput style={[styles.input, inputStyle]} value={editBrand} onChangeText={setEditBrand} />

            <Text style={[styles.label, { color: theme.textMuted, marginTop: 12 }]}>Nome oficial</Text>
            <TextInput style={[styles.input, inputStyle]} value={editName} onChangeText={setEditName} />

            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Origem</Text>
                <TextInput style={[styles.input, inputStyle]} value={editOrigin} onChangeText={setEditOrigin} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: theme.textMuted }]}>Força</Text>
                <TextInput style={[styles.input, inputStyle]} value={editStrength} onChangeText={setEditStrength} />
              </View>
            </View>

            {!!reviewing.notes && (
              <Text style={[styles.reviewNotes, { color: theme.textMuted }]}>
                Observações do usuário: {reviewing.notes}
              </Text>
            )}

            <ThemedButton
              label="Aprovar e criar vitola"
              icon="checkmark-outline"
              onPress={handleApprove}
              disabled={working || !editName.trim() || !editBrand.trim()}
              loading={working}
              style={{ marginTop: 20 }}
            />
            <ThemedButton
              label="Rejeitar"
              variant="outline"
              onPress={handleReject}
              disabled={working}
              style={{ marginTop: 10 }}
            />
          </View>
        ) : (
          <FlatList
            data={pending}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.textMuted }]}>
                Nenhuma contribuição pendente. 🎉
              </Text>
            }
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  rowPhoto: { width: 52, height: 52, borderRadius: 10 },
  rowPhotoEmpty: { alignItems: 'center', justifyContent: 'center' },
  rowBrand: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  rowName: { fontSize: 15, fontWeight: '600' },
  rowNotes: { fontSize: 12 },
  empty: { fontSize: 14, textAlign: 'center', marginTop: 48 },
  reviewBody: { padding: 20 },
  reviewPhoto: { height: 160, borderRadius: 14, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 44, fontSize: 15 },
  rowFields: { flexDirection: 'row', gap: 12, marginTop: 12 },
  reviewNotes: { fontSize: 13, marginTop: 14, fontStyle: 'italic' },
});
