import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { useAuthStore } from '@/store/authStore';
import { addHumidorItem, batchAddHumidorItems } from '@/lib/firestore';
import { identifyCigar, parseBulkText, identifyCigarImage } from '@/lib/ai';
import type { CigarAIResult, BulkParseItem, HumidorEntry } from '@/lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

type MainTab = 'single' | 'import';
type ImportTab = 'paste' | 'scan';
type AiPhase = 'idle' | 'loading' | 'done' | 'error';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: active ? withAlpha(theme.accent, 0.15) : 'transparent',
          borderColor: active ? theme.accent : withAlpha(theme.border, 0.4),
        },
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.pillText,
          { color: active ? theme.accent : theme.textMuted },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.stepperRow}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Quantidade</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(1, value - 1))}
          style={[styles.stepBtn, { backgroundColor: withAlpha(theme.accent, 0.1) }]}
        >
          <Ionicons name="remove" size={18} color={theme.accent} />
        </TouchableOpacity>
        <Text style={[styles.stepValue, { color: theme.text }]}>{value}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(99, value + 1))}
          style={[styles.stepBtn, { backgroundColor: withAlpha(theme.accent, 0.1) }]}
        >
          <Ionicons name="add" size={18} color={theme.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatusPicker({
  value,
  onChange,
}: {
  value: HumidorEntry['status'];
  onChange: (v: HumidorEntry['status']) => void;
}) {
  const theme = useTheme();
  const options: { key: HumidorEntry['status']; label: string }[] = [
    { key: 'intact', label: 'Intacto' },
    { key: 'smoking', label: 'Em uso' },
    { key: 'finished', label: 'Finalizado' },
  ];
  return (
    <View style={styles.statusRow}>
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Status</Text>
      <View style={styles.statusPills}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.statusPill,
              {
                backgroundColor:
                  value === opt.key ? withAlpha(theme.accent, 0.15) : 'transparent',
                borderColor:
                  value === opt.key ? theme.accent : withAlpha(theme.border, 0.4),
              },
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                { color: value === opt.key ? theme.accent : theme.textMuted },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function CigarPreviewCard({ result }: { result: CigarAIResult }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.previewCard,
        { backgroundColor: theme.card, borderColor: withAlpha(theme.border, 0.4) },
      ]}
    >
      <View style={[styles.previewAccent, { backgroundColor: theme.accent }]} />
      <View style={styles.previewBody}>
        <Text style={[styles.previewBrand, { color: theme.accent }]}>
          {result.brand.toUpperCase()}
        </Text>
        <Text style={[styles.previewName, { color: theme.text }]}>{result.name}</Text>
        <Text style={[styles.previewMeta, { color: theme.textMuted }]}>
          {result.origin} · {result.strength}
        </Text>
        {result.flavorNotes.length > 0 && (
          <View style={styles.previewTags}>
            {result.flavorNotes.map((note) => (
              <View
                key={note}
                style={[
                  styles.previewTag,
                  {
                    backgroundColor: withAlpha(theme.accent, 0.07),
                    borderColor: withAlpha(theme.accent, 0.18),
                  },
                ]}
              >
                <Text style={[styles.previewTagText, { color: theme.textMuted }]}>
                  {note}
                </Text>
              </View>
            ))}
          </View>
        )}
        {!!result.curiosities && (
          <Text
            style={[styles.previewCuriosities, { color: withAlpha(theme.textMuted, 0.8) }]}
            numberOfLines={3}
          >
            {result.curiosities}
          </Text>
        )}
      </View>
    </View>
  );
}

function LoadingDots() {
  const theme = useTheme();
  const [dots, setDots] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.loadingRow}>
      <ActivityIndicator color={theme.accent} size="small" />
      <Text style={[styles.loadingText, { color: theme.textMuted }]}>
        Identificando{dots}
      </Text>
    </View>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function AddCigarModal({ visible, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const uid = useAuthStore((s) => s.uid);

  // Animation
  const slideAnim = useRef(new Animated.Value(700)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = useCallback(() => {
    Animated.spring(slideAnim, {
      toValue: 700,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [slideAnim, onClose]);

  // Tab state
  const [mainTab, setMainTab] = useState<MainTab>('single');
  const [importTab, setImportTab] = useState<ImportTab>('paste');

  // Shared save state
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<HumidorEntry['status']>('intact');
  const [saving, setSaving] = useState(false);

  // Single mode
  const [cigarName, setCigarName] = useState('');
  const [singlePhase, setSinglePhase] = useState<AiPhase>('idle');
  const [singleResult, setSingleResult] = useState<CigarAIResult | null>(null);
  const [singleError, setSingleError] = useState('');

  // Paste mode
  const [bulkText, setBulkText] = useState('');
  const [bulkPhase, setBulkPhase] = useState<AiPhase>('idle');
  const [bulkItems, setBulkItems] = useState<BulkParseItem[]>([]);
  const [bulkError, setBulkError] = useState('');

  // Scan mode
  const [scannedUri, setScannedUri] = useState<string | null>(null);
  const [scannedBase64, setScannedBase64] = useState<string | null>(null);
  const [scannedMime, setScannedMime] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [scanPhase, setScanPhase] = useState<AiPhase>('idle');
  const [scanResult, setScanResult] = useState<CigarAIResult | null>(null);
  const [scanError, setScanError] = useState('');

  // Reset all state after close animation
  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => {
        setMainTab('single');
        setImportTab('paste');
        setQuantity(1);
        setStatus('intact');
        setSaving(false);
        setCigarName('');
        setSinglePhase('idle');
        setSingleResult(null);
        setSingleError('');
        setBulkText('');
        setBulkPhase('idle');
        setBulkItems([]);
        setBulkError('');
        setScannedUri(null);
        setScannedBase64(null);
        setScanPhase('idle');
        setScanResult(null);
        setScanError('');
      }, 400);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // ─── Single Mode Handlers ─────────────────────────────────────────────────

  const handleIdentifySingle = async () => {
    if (!cigarName.trim()) return;
    setSinglePhase('loading');
    setSingleError('');
    try {
      const result = await identifyCigar(cigarName.trim());
      setSingleResult(result);
      setSinglePhase('done');
    } catch (e: unknown) {
      setSingleError(e instanceof Error ? e.message : 'Erro ao identificar.');
      setSinglePhase('error');
    }
  };

  const handleSaveSingle = async () => {
    if (!singleResult || !uid) return;
    setSaving(true);
    try {
      await addHumidorItem(uid, {
        cigarName: singleResult.name,
        brand: singleResult.brand,
        quantity,
        status,
        origin: singleResult.origin,
        strength: singleResult.strength,
        flavorNotes: singleResult.flavorNotes,
        curiosities: singleResult.curiosities,
      });
      handleClose();
    } catch {
      setSingleError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Bulk Paste Handlers ──────────────────────────────────────────────────

  const handleParseBulk = async () => {
    if (!bulkText.trim()) return;
    setBulkPhase('loading');
    setBulkError('');
    try {
      const items = await parseBulkText(bulkText.trim());
      setBulkItems(items);
      setBulkPhase('done');
    } catch (e: unknown) {
      setBulkError(e instanceof Error ? e.message : 'Erro ao processar a lista.');
      setBulkPhase('error');
    }
  };

  const handleSaveBulk = async () => {
    if (!uid || bulkItems.length === 0) return;
    setSaving(true);
    try {
      await batchAddHumidorItems(uid, bulkItems.map((item) => ({
        cigarName: item.cigarName,
        brand: item.brand,
        quantity: item.quantity,
        status: item.status,
      })));
      handleClose();
    } catch {
      setBulkError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const removeBulkItem = (index: number) => {
    setBulkItems((items) => items.filter((_, i) => i !== index));
  };

  // ─── Scan Handlers ────────────────────────────────────────────────────────

  const handleOpenCamera = async () => {
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
          setScanError('Permissão de câmera negada.');
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
        setScannedUri(asset.uri);
        setScannedBase64(asset.base64 ?? null);
        const mime = (asset.mimeType ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp';
        setScannedMime(mime);
        setScanPhase('idle');
        setScanResult(null);
        setScanError('');
      }
    } catch {
      setScanError('Não foi possível abrir a câmera.');
    }
  };

  const handleIdentifyScan = async () => {
    if (!scannedBase64) return;
    setScanPhase('loading');
    setScanError('');
    try {
      const result = await identifyCigarImage(scannedBase64, scannedMime);
      setScanResult(result);
      setScanPhase('done');
    } catch (e: unknown) {
      setScanError(e instanceof Error ? e.message : 'Erro ao identificar pela imagem.');
      setScanPhase('error');
    }
  };

  const handleSaveScan = async () => {
    if (!scanResult || !uid) return;
    setSaving(true);
    try {
      await addHumidorItem(uid, {
        cigarName: scanResult.name,
        brand: scanResult.brand,
        quantity,
        status,
        origin: scanResult.origin,
        strength: scanResult.strength,
        flavorNotes: scanResult.flavorNotes,
        curiosities: scanResult.curiosities,
      });
      handleClose();
    } catch {
      setScanError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const sheetPaddingBottom = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              paddingBottom: sheetPaddingBottom,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: withAlpha(theme.border, 0.5) }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Adicionar Charuto</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Main Tabs */}
          <View style={styles.tabRow}>
            <TabPill label="Adicionar" active={mainTab === 'single'} onPress={() => setMainTab('single')} />
            <TabPill label="Importar" active={mainTab === 'import'} onPress={() => setMainTab('import')} />
          </View>

          <ScrollView
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {mainTab === 'single' && (
              <View style={styles.section}>
                {/* Name Input */}
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                    Nome do charuto
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        backgroundColor: withAlpha(theme.card, 0.8),
                        borderColor: withAlpha(theme.border, 0.5),
                      },
                    ]}
                    placeholder="Ex: Cohiba Siglo VI"
                    placeholderTextColor={theme.textMuted}
                    value={cigarName}
                    onChangeText={(t) => {
                      setCigarName(t);
                      if (singlePhase !== 'idle') {
                        setSinglePhase('idle');
                        setSingleResult(null);
                        setSingleError('');
                      }
                    }}
                    autoFocus
                  />
                </View>

                {/* Identify Button */}
                {singlePhase !== 'done' && (
                  <TouchableOpacity
                    style={[
                      styles.aiBtn,
                      {
                        backgroundColor:
                          cigarName.trim() && singlePhase !== 'loading'
                            ? theme.accent
                            : withAlpha(theme.accent, 0.3),
                      },
                    ]}
                    onPress={handleIdentifySingle}
                    disabled={!cigarName.trim() || singlePhase === 'loading'}
                    activeOpacity={0.8}
                  >
                    {singlePhase === 'loading' ? (
                      <LoadingDots />
                    ) : (
                      <>
                        <Ionicons name="sparkles-outline" size={16} color="#000" />
                        <Text style={styles.aiBtnText}>Identificar com IA</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* Error */}
                {singlePhase === 'error' && (
                  <Text style={styles.errorText}>{singleError}</Text>
                )}

                {/* Preview Card */}
                {singlePhase === 'done' && singleResult && (
                  <>
                    <CigarPreviewCard result={singleResult} />

                    {/* Re-identify button */}
                    <TouchableOpacity
                      onPress={() => { setSinglePhase('idle'); setSingleResult(null); }}
                      style={styles.retryBtn}
                    >
                      <Text style={[styles.retryText, { color: theme.textMuted }]}>
                        Alterar ↩
                      </Text>
                    </TouchableOpacity>

                    <QuantityStepper value={quantity} onChange={setQuantity} />
                    <StatusPicker value={status} onChange={setStatus} />

                    <TouchableOpacity
                      style={[
                        styles.saveBtn,
                        { backgroundColor: theme.accent },
                        saving && styles.saveBtnDisabled,
                      ]}
                      onPress={handleSaveSingle}
                      disabled={saving}
                      activeOpacity={0.85}
                    >
                      {saving ? (
                        <ActivityIndicator color="#000" />
                      ) : (
                        <Text style={styles.saveBtnText}>Adicionar ao Humidor</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {mainTab === 'import' && (
              <View style={styles.section}>
                {/* Import Sub-tabs */}
                <View style={styles.tabRow}>
                  <TabPill
                    label="📝  Colar lista"
                    active={importTab === 'paste'}
                    onPress={() => setImportTab('paste')}
                  />
                  <TabPill
                    label="📷  Anilha"
                    active={importTab === 'scan'}
                    onPress={() => setImportTab('scan')}
                  />
                </View>

                {/* ── Paste Sub-tab ── */}
                {importTab === 'paste' && (
                  <>
                    <TextInput
                      style={[
                        styles.textarea,
                        {
                          color: theme.text,
                          backgroundColor: withAlpha(theme.card, 0.8),
                          borderColor: withAlpha(theme.border, 0.5),
                        },
                      ]}
                      placeholder={'Cohiba Siglo VI x3\nMontecristo No.2 x6\nPartagás Serie D No.4'}
                      placeholderTextColor={theme.textMuted}
                      value={bulkText}
                      onChangeText={(t) => {
                        setBulkText(t);
                        if (bulkPhase !== 'idle') {
                          setBulkPhase('idle');
                          setBulkItems([]);
                          setBulkError('');
                        }
                      }}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                    />

                    {bulkPhase !== 'done' && (
                      <TouchableOpacity
                        style={[
                          styles.aiBtn,
                          {
                            backgroundColor:
                              bulkText.trim() && bulkPhase !== 'loading'
                                ? theme.accent
                                : withAlpha(theme.accent, 0.3),
                          },
                        ]}
                        onPress={handleParseBulk}
                        disabled={!bulkText.trim() || bulkPhase === 'loading'}
                        activeOpacity={0.8}
                      >
                        {bulkPhase === 'loading' ? (
                          <LoadingDots />
                        ) : (
                          <>
                            <Ionicons name="sparkles-outline" size={16} color="#000" />
                            <Text style={styles.aiBtnText}>Identificar com IA</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {bulkPhase === 'error' && (
                      <Text style={styles.errorText}>{bulkError}</Text>
                    )}

                    {bulkPhase === 'done' && bulkItems.length > 0 && (
                      <>
                        <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 12 }]}>
                          {bulkItems.length} charuto{bulkItems.length !== 1 ? 's' : ''} encontrado{bulkItems.length !== 1 ? 's' : ''}
                        </Text>

                        {bulkItems.map((item, i) => (
                          <View
                            key={i}
                            style={[
                              styles.bulkRow,
                              { borderColor: withAlpha(theme.border, 0.3), backgroundColor: withAlpha(theme.card, 0.6) },
                            ]}
                          >
                            <View style={styles.bulkInfo}>
                              <Text style={[styles.bulkBrand, { color: theme.accent }]}>
                                {item.brand.toUpperCase()}
                              </Text>
                              <Text style={[styles.bulkName, { color: theme.text }]}>
                                {item.cigarName}
                              </Text>
                            </View>
                            <Text style={[styles.bulkQty, { color: theme.accent }]}>
                              {item.quantity}x
                            </Text>
                            <TouchableOpacity onPress={() => removeBulkItem(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                              <Ionicons name="close-circle-outline" size={20} color={theme.textMuted} />
                            </TouchableOpacity>
                          </View>
                        ))}

                        <TouchableOpacity
                          onPress={() => { setBulkPhase('idle'); setBulkItems([]); }}
                          style={styles.retryBtn}
                        >
                          <Text style={[styles.retryText, { color: theme.textMuted }]}>
                            Refazer ↩
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.saveBtn,
                            { backgroundColor: theme.accent },
                            saving && styles.saveBtnDisabled,
                          ]}
                          onPress={handleSaveBulk}
                          disabled={saving || bulkItems.length === 0}
                          activeOpacity={0.85}
                        >
                          {saving ? (
                            <ActivityIndicator color="#000" />
                          ) : (
                            <Text style={styles.saveBtnText}>
                              Adicionar {bulkItems.length} ao Humidor
                            </Text>
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                )}

                {/* ── Scan Sub-tab ── */}
                {importTab === 'scan' && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.cameraBtn,
                        {
                          borderColor: withAlpha(theme.accent, 0.4),
                          backgroundColor: withAlpha(theme.accent, 0.06),
                        },
                      ]}
                      onPress={handleOpenCamera}
                      activeOpacity={0.8}
                    >
                      {scannedUri ? (
                        <Image source={{ uri: scannedUri }} style={styles.previewImage} />
                      ) : (
                        <>
                          <Ionicons name="camera-outline" size={36} color={theme.accent} />
                          <Text style={[styles.cameraBtnText, { color: theme.textMuted }]}>
                            {Platform.OS === 'web' ? 'Selecionar foto da anilha' : 'Fotografar anilha'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {scannedUri && (
                      <TouchableOpacity onPress={handleOpenCamera} style={styles.retryBtn}>
                        <Text style={[styles.retryText, { color: theme.textMuted }]}>
                          Trocar foto ↩
                        </Text>
                      </TouchableOpacity>
                    )}

                    {scannedBase64 && scanPhase !== 'done' && (
                      <TouchableOpacity
                        style={[
                          styles.aiBtn,
                          {
                            backgroundColor:
                              scanPhase !== 'loading'
                                ? theme.accent
                                : withAlpha(theme.accent, 0.3),
                          },
                        ]}
                        onPress={handleIdentifyScan}
                        disabled={scanPhase === 'loading'}
                        activeOpacity={0.8}
                      >
                        {scanPhase === 'loading' ? (
                          <LoadingDots />
                        ) : (
                          <>
                            <Ionicons name="sparkles-outline" size={16} color="#000" />
                            <Text style={styles.aiBtnText}>Identificar com IA</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {scanPhase === 'error' && (
                      <Text style={styles.errorText}>{scanError}</Text>
                    )}

                    {scanPhase === 'done' && scanResult && (
                      <>
                        <CigarPreviewCard result={scanResult} />

                        <QuantityStepper value={quantity} onChange={setQuantity} />
                        <StatusPicker value={status} onChange={setStatus} />

                        <TouchableOpacity
                          style={[
                            styles.saveBtn,
                            { backgroundColor: theme.accent },
                            saving && styles.saveBtnDisabled,
                          ]}
                          onPress={handleSaveScan}
                          disabled={saving}
                          activeOpacity={0.85}
                        >
                          {saving ? (
                            <ActivityIndicator color="#000" />
                          ) : (
                            <Text style={styles.saveBtnText}>Adicionar ao Humidor</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Bottom spacer */}
            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flexGrow: 0,
  },
  section: {
    paddingHorizontal: 20,
    gap: 12,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  aiBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  aiBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 13,
  },

  // Preview Card
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  previewAccent: {
    width: 3,
  },
  previewBody: {
    flex: 1,
    padding: 14,
    gap: 5,
  },
  previewBrand: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  previewName: {
    fontSize: 17,
    fontWeight: '700',
  },
  previewMeta: {
    fontSize: 12,
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 2,
  },
  previewTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  previewTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  previewCuriosities: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
    marginTop: 2,
  },

  // Quantity Stepper
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 20,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },

  // Status Picker
  statusRow: {
    gap: 8,
  },
  statusPills: {
    flexDirection: 'row',
    gap: 8,
  },
  statusPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Save Button
  saveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Loading
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },

  // Bulk
  textarea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 120,
    lineHeight: 22,
  },
  bulkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  bulkInfo: {
    flex: 1,
    gap: 2,
  },
  bulkBrand: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bulkName: {
    fontSize: 14,
    fontWeight: '600',
  },
  bulkQty: {
    fontSize: 15,
    fontWeight: '800',
    minWidth: 32,
    textAlign: 'right',
  },

  // Camera
  cameraBtn: {
    height: 160,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  cameraBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
