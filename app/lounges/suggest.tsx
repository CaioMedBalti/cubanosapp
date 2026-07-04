import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { withAlpha } from '@/lib/theme';
import { submitLounge } from '@/lib/firestore';

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: withAlpha(theme.card, 0.8),
            borderColor: withAlpha(theme.border, 0.5),
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function SuggestLoungeScreen() {
  const theme = useTheme();
  const uid = useAuthStore((s) => s.uid);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Brasil');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = name.trim() && address.trim() && city.trim() && lat.trim() && lng.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await submitLounge({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        country: country.trim() || 'Brasil',
        lat: Number(lat),
        lng: Number(lng),
        phone: phone.trim() || undefined,
        description: description.trim() || undefined,
        submittedBy: uid ?? undefined,
      });
      setDone(true);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <VideoBackground style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <Ionicons name="checkmark-circle-outline" size={48} color={theme.accent} />
            <Text style={[styles.doneTitle, { color: theme.text }]}>Sugestão enviada!</Text>
            <Text style={[styles.doneHint, { color: theme.textMuted }]}>
              Vamos revisar e aprovar em breve.
            </Text>
            <ThemedButton label="Voltar" onPress={() => router.back()} style={{ marginTop: 20 }} />
          </View>
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Sugerir Lounge</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Field label="Nome" value={name} onChangeText={setName} placeholder="Ex: La Casa del Habano" />
          <Field label="Endereço" value={address} onChangeText={setAddress} placeholder="Rua, número" />
          <Field label="Cidade" value={city} onChangeText={setCity} placeholder="Ex: São Paulo" />
          <Field label="País" value={country} onChangeText={setCountry} placeholder="Brasil" />
          <Field label="Latitude" value={lat} onChangeText={setLat} placeholder="Ex: -23.5505" keyboardType="numeric" />
          <Field label="Longitude" value={lng} onChangeText={setLng} placeholder="Ex: -46.6333" keyboardType="numeric" />
          <Field label="Telefone (opcional)" value={phone} onChangeText={setPhone} placeholder="" />
          <Field label="Descrição (opcional)" value={description} onChangeText={setDescription} placeholder="" />

          <Text style={[styles.note, { color: theme.textMuted }]}>
            Dica: abra o local no Google Maps, toque e segure no pino para ver as coordenadas.
          </Text>

          <ThemedButton
            label="Enviar sugestão"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={saving}
            style={styles.submitButton}
          />
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
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  note: { fontSize: 12, fontStyle: 'italic', lineHeight: 18 },
  submitButton: { marginTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32 },
  doneTitle: { fontSize: 18, fontWeight: '700' },
  doneHint: { fontSize: 13, textAlign: 'center' },
});
