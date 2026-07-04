import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { AnilhaRating } from '@/components/ui/AnilhaRating';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { withAlpha } from '@/lib/theme';
import { useCatalog, CatalogItem } from '@/hooks/useCatalog';
import { logTasting } from '@/lib/firestore';

export default function NewTastingScreen() {
  const theme = useTheme();
  const uid = useAuthStore((s) => s.uid);
  const profile = useAuthStore((s) => s.profile);
  const { items: catalog } = useCatalog();

  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const matches = query.length > 0
    ? catalog.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()) || i.brand.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  const itemName = selectedItem?.name ?? query;
  const availableFlavors = selectedItem?.flavorNotes ?? [];

  const toggleFlavor = (note: string) => {
    setSelectedFlavors((prev) => (prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]));
  };

  const canSave = itemName.trim().length > 0 && rating > 0 && !saving;

  const handleSave = async () => {
    if (!uid || !canSave) return;
    setSaving(true);
    try {
      await logTasting({
        userId: uid,
        cigarId: selectedItem?.itemType === 'cigar' ? selectedItem.id : null,
        whiskyId: selectedItem?.itemType === 'whisky' ? selectedItem.id : null,
        itemName: itemName.trim(),
        itemBrand: selectedItem?.brand,
        authorName: profile?.username ?? 'Aficionado',
        avatarUrl: profile?.avatarUrl,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        notes: notes.trim() || null,
        flavorNotes: selectedFlavors,
        isPublic,
      });
      router.replace('/tastings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: withAlpha(theme.border, 0.25) }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Nova Degustação</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: theme.textMuted }]}>Charuto ou whisky</Text>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: withAlpha(theme.surface, 0.9), borderColor: withAlpha(theme.border, 0.5) },
              ]}
            >
              <Ionicons name="search" size={16} color={theme.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Buscar no catálogo ou digitar o nome"
                placeholderTextColor={theme.textMuted}
                value={selectedItem ? selectedItem.name : query}
                onChangeText={(t) => {
                  setSelectedItem(null);
                  setQuery(t);
                }}
              />
            </View>

            {matches.length > 0 && !selectedItem && (
              <View style={[styles.suggestions, { borderColor: withAlpha(theme.border, 0.4) }]}>
                {matches.map((item) => (
                  <TouchableOpacity
                    key={`${item.itemType}-${item.id}`}
                    style={styles.suggestionRow}
                    onPress={() => {
                      setSelectedItem(item);
                      setSelectedFlavors([]);
                    }}
                  >
                    <Text style={[styles.suggestionBrand, { color: theme.accent }]}>{item.brand}</Text>
                    <Text style={[styles.suggestionName, { color: theme.text }]}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.label, { color: theme.textMuted, marginTop: 20 }]}>Sua nota</Text>
            <AnilhaRating rating={rating} onRate={setRating} size={36} />

            {availableFlavors.length > 0 && (
              <>
                <Text style={[styles.label, { color: theme.textMuted, marginTop: 20 }]}>Notas de sabor</Text>
                <View style={styles.tags}>
                  {availableFlavors.map((note) => {
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
              </>
            )}

            <Text style={[styles.label, { color: theme.textMuted, marginTop: 20 }]}>Notas</Text>
            <TextInput
              style={[
                styles.textarea,
                { backgroundColor: withAlpha(theme.surface, 0.8), borderColor: withAlpha(theme.border, 0.5), color: theme.text },
              ]}
              placeholder="Como foi a experiência?"
              placeholderTextColor={theme.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />

            <View style={styles.publicRow}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Compartilhar no feed</Text>
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
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
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
  suggestions: { marginTop: 6, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  suggestionRow: { paddingHorizontal: 14, paddingVertical: 10 },
  suggestionBrand: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  suggestionName: { fontSize: 14, fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 12, fontWeight: '600' },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 90, textAlignVertical: 'top' },
  publicRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
});
