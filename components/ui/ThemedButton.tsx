import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useActiveTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';

interface ThemedButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

// Only the `primary` variant branches per theme — it's the one meant to read
// as "Dark Luxury / Vintage / Modern" at a glance. `secondary`/`outline` stay
// structurally identical across themes and let the color tokens do the work.
export function ThemedButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
}: ThemedButtonProps) {
  const theme = useTheme();
  const activeTheme = useActiveTheme();
  const isDisabled = disabled || loading;

  const content = loading ? (
    <ActivityIndicator color={variant === 'primary' && activeTheme !== 'vintage' ? theme.background : theme.accent} />
  ) : (
    <>
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={variant === 'primary' && activeTheme !== 'vintage' ? theme.background : theme.accent}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          variant === 'primary'
            ? { color: activeTheme === 'vintage' ? theme.card : theme.background, letterSpacing: activeTheme === 'dark-luxury' ? 0.5 : 0.2 }
            : { color: theme.accent },
        ]}
      >
        {label}
      </Text>
    </>
  );

  if (variant === 'primary') {
    if (activeTheme === 'dark-luxury') {
      return (
        <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.85} style={[isDisabled && styles.disabled, style]}>
          <LinearGradient
            colors={[theme.accent, theme.accentDim]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.button,
              styles.dashedBottom,
              {
                borderRadius: 12,
                borderColor: withAlpha(theme.text, 0.08),
                borderWidth: 1,
                shadowColor: theme.accent,
                shadowOpacity: 0.35,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              },
            ]}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    const isVintage = activeTheme === 'vintage';
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[
          styles.button,
          {
            backgroundColor: theme.accent,
            borderRadius: isVintage ? 8 : 6,
            borderWidth: 1,
            borderColor: isVintage ? theme.border : withAlpha(theme.border, 0.9),
            shadowColor: isVintage ? theme.text : '#000',
            shadowOpacity: isVintage ? 0.12 : 0.2,
            shadowRadius: isVintage ? 6 : 3,
            shadowOffset: { width: 0, height: isVintage ? 3 : 2 },
            elevation: 3,
          },
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
        style={[
          styles.button,
          {
            backgroundColor: 'transparent',
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: theme.accent,
          },
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: withAlpha(theme.surface, 0.8),
          borderRadius: 10,
          borderWidth: 1,
          borderColor: withAlpha(theme.accent, 0.4),
        },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedBottom: {
    borderBottomWidth: 1,
  },
  icon: { marginRight: 8 },
  label: { fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
