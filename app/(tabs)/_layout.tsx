import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useActiveTheme } from '@/store/themeStore';
import { withAlpha } from '@/lib/theme';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconFocused: IoniconName;
}

const TABS: TabConfig[] = [
  { name: 'index',    title: 'Feed',     icon: 'flame-outline',   iconFocused: 'flame' },
  { name: 'humidor',  title: 'Humidor',  icon: 'archive-outline', iconFocused: 'archive' },
  { name: 'discover', title: 'Discover', icon: 'compass-outline', iconFocused: 'compass' },
  { name: 'profile',  title: 'Perfil',   icon: 'person-outline',  iconFocused: 'person' },
];

export default function TabsLayout() {
  const theme = useTheme();
  const activeTheme = useActiveTheme();
  const insets = useSafeAreaInsets();

  // On web accessed from iPhone, Platform.OS === 'web' so the ios check would
  // miss the safe area. Using insets.bottom covers both native and mobile web.
  const bottomPad = insets.bottom > 0 ? insets.bottom : Platform.OS === 'ios' ? 20 : 8;
  const tabHeight = insets.bottom > 0 ? 60 + insets.bottom : Platform.OS === 'ios' ? 84 : 64;

  const themedShadow =
    activeTheme === 'dark-luxury'
      ? { shadowColor: theme.accent, shadowOpacity: 0.25, shadowRadius: 10 }
      : activeTheme === 'vintage'
        ? { shadowColor: theme.text, shadowOpacity: 0.1, shadowRadius: 6 }
        : { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4 };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: withAlpha(theme.accent, activeTheme === 'modern' ? 0.5 : 0.3),
          borderTopWidth: 1,
          paddingBottom: bottomPad,
          paddingTop: 8,
          height: tabHeight,
          shadowOffset: { width: 0, height: -2 },
          elevation: 8,
          ...themedShadow,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
