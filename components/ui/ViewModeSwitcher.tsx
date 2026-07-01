import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { useHumidorViewStore, HumidorViewMode } from '@/store/humidorStore';

const OPTIONS: { key: HumidorViewMode; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'grid', icon: 'grid-outline' },
  { key: 'list', icon: 'list-outline' },
  { key: 'shelf', icon: 'albums-outline' },
];

export function ViewModeSwitcher() {
  const theme = useTheme();
  const viewMode = useHumidorViewStore((s) => s.viewMode);
  const setViewMode = useHumidorViewStore((s) => s.setViewMode);

  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const isActive = opt.key === viewMode;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setViewMode(opt.key)}
            style={[
              styles.option,
              {
                backgroundColor: isActive ? withAlpha(theme.accent, 0.15) : 'transparent',
                borderColor: isActive ? theme.accent : withAlpha(theme.border, 0.4),
              },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name={opt.icon} size={16} color={isActive ? theme.accent : theme.textMuted} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  option: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
