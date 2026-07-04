import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';

export interface AdvancedHumidorFieldsValue {
  purchaseType?: 'single' | 'box_pack';
  boxSize?: string;
  boxCode?: string;
  purchaseCountry?: string;
  seller?: string;
}

interface Props {
  value: AdvancedHumidorFieldsValue;
  onChange: (value: AdvancedHumidorFieldsValue) => void;
}

function TypePill({
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
        styles.typePill,
        {
          backgroundColor: active ? withAlpha(theme.accent, 0.15) : 'transparent',
          borderColor: active ? theme.accent : withAlpha(theme.border, 0.4),
        },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.typePillText, { color: active ? theme.accent : theme.textMuted }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function AdvancedHumidorFields({ value, onChange }: Props) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const patch = (partial: Partial<AdvancedHumidorFieldsValue>) => {
    onChange({ ...value, ...partial });
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
      >
        <Text style={[styles.toggleText, { color: theme.textMuted }]}>
          Detalhes de compra (opcional)
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.textMuted}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Tipo de compra</Text>
            <View style={styles.pillRow}>
              <TypePill
                label="Avulso"
                active={value.purchaseType === 'single'}
                onPress={() => patch({ purchaseType: 'single' })}
              />
              <TypePill
                label="Caixa/Pacote"
                active={value.purchaseType === 'box_pack'}
                onPress={() => patch({ purchaseType: 'box_pack' })}
              />
            </View>
          </View>

          {value.purchaseType === 'box_pack' && (
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                Tamanho da caixa
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
                placeholder="Ex: 25"
                placeholderTextColor={theme.textMuted}
                value={value.boxSize ?? ''}
                onChangeText={(t) => patch({ boxSize: t.replace(/[^0-9]/g, '') })}
                keyboardType="number-pad"
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>País de compra</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: withAlpha(theme.card, 0.8),
                  borderColor: withAlpha(theme.border, 0.5),
                },
              ]}
              placeholder="Ex: Cuba"
              placeholderTextColor={theme.textMuted}
              value={value.purchaseCountry ?? ''}
              onChangeText={(t) => patch({ purchaseCountry: t })}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Loja / vendedor</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: withAlpha(theme.card, 0.8),
                  borderColor: withAlpha(theme.border, 0.5),
                },
              ]}
              placeholder="Ex: La Casa del Habano"
              placeholderTextColor={theme.textMuted}
              value={value.seller ?? ''}
              onChangeText={(t) => patch({ seller: t })}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Código da caixa</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text,
                  backgroundColor: withAlpha(theme.card, 0.8),
                  borderColor: withAlpha(theme.border, 0.5),
                },
              ]}
              placeholder="Ex: JULIO 22"
              placeholderTextColor={theme.textMuted}
              value={value.boxCode ?? ''}
              onChangeText={(t) => patch({ boxCode: t })}
              autoCapitalize="characters"
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  content: {
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
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
