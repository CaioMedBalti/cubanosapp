import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, useActiveTheme, useSetTheme } from '@/store/themeStore';
import { THEMES, ThemeKey } from '@/constants/themes';
import { withAlpha } from '@/lib/theme';

export function ThemeSwitcher() {
  const theme = useTheme();
  const activeKey = useActiveTheme();
  const setTheme = useSetTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textMuted }]}>TEMA</Text>
      <View style={styles.row}>
        {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
          const t = THEMES[key];
          const isActive = key === activeKey;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setTheme(key)}
              style={[
                styles.option,
                {
                  backgroundColor: isActive ? withAlpha(t.accent, 0.15) : t.surface,
                  borderColor: isActive ? t.accent : withAlpha(t.border, 0.5),
                },
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.swatch, { backgroundColor: t.accent }]} />
              <Text style={[styles.optionText, { color: isActive ? t.accent : t.textMuted }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
