import '../global.css';
import React, { useEffect } from 'react';
import { View, StatusBar, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useTheme } from '@/store/themeStore';
import { THEMES, DEFAULT_THEME } from '@/constants/themes';

SplashScreen.preventAutoHideAsync();

// Web only, runs once at module load (before first paint). app.json has
// web.output:"single" (SPA), which means app/+html.tsx is never consulted —
// Expo only uses that customization point for "static"/"server" output. So
// the viewport/scroll-lock fixes have to happen here instead: without
// viewport-fit=cover the browser never exposes non-zero env(safe-area-inset-*)
// values, which is why useSafeAreaInsets() was returning 0 on web and the tab
// bar fell back to the wrong height/position; and without locking body to a
// fixed frame the page scrolls/bounces like a website instead of an app.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  viewport.setAttribute(
    'content',
    'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  );

  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      background-color: ${THEMES[DEFAULT_THEME].background};
      overscroll-behavior: none;
    }
    body {
      position: fixed;
      inset: 0;
      overflow: hidden;
      overscroll-behavior-y: none;
    }
  `;
  document.head.appendChild(style);
}

function RootLayoutNav() {
  const theme = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootLayoutNav />
    </SafeAreaProvider>
  );
}
