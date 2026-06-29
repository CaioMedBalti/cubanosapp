import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/store/themeStore';
import { VideoBackground } from '@/components/ui/VideoBackground';
import { withAlpha } from '@/lib/theme';

export default function LoginScreen() {
  const theme = useTheme();
  const setUid = useAuthStore((s) => s.setUid);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      setUid(credential.user.uid);
      router.replace('/(tabs)/');
    } catch (e: any) {
      setError('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: withAlpha(theme.surface, 0.8),
    borderColor: withAlpha(theme.border, 0.7),
    color: theme.text,
  };

  return (
    <VideoBackground style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.logoArea}>
              <Text style={[styles.logoTitle, { color: theme.accent }]}>CUBANOS</Text>
              <Text style={[styles.logoSub, { color: theme.textMuted }]}>
                Colecionadores Premium
              </Text>
            </View>

            <View style={[styles.form, { backgroundColor: withAlpha(theme.card, 0.9), borderColor: withAlpha(theme.border, 0.4) }]}>
              <Text style={[styles.formTitle, { color: theme.text }]}>Entrar</Text>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>E-mail</Text>
                <TextInput
                  style={[styles.input, inputStyle]}
                  placeholder="seu@email.com"
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Senha</Text>
                <TextInput
                  style={[styles.input, inputStyle]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.accent }, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.buttonText}>Entrar</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                style={styles.linkRow}
              >
                <Text style={[styles.link, { color: theme.textMuted }]}>
                  Não tem conta?{' '}
                  <Text style={{ color: theme.accent }}>Criar conta</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </VideoBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 40, gap: 4 },
  logoTitle: { fontSize: 36, fontWeight: '900', letterSpacing: 8 },
  logoSub: { fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' },
  form: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 16 },
  formTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  errorText: { color: '#ff6b6b', fontSize: 13, textAlign: 'center' },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  input: { height: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  button: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  linkRow: { alignItems: 'center', marginTop: 4 },
  link: { fontSize: 14 },
});
