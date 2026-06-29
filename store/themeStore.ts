import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage';
import { THEMES, ThemeKey, Theme, DEFAULT_THEME } from '@/constants/themes';

interface ThemeState {
  activeTheme: ThemeKey;
  theme: Theme;
  setTheme: (key: ThemeKey) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      activeTheme: DEFAULT_THEME,
      theme: THEMES[DEFAULT_THEME],
      setTheme: (key: ThemeKey) =>
        set({ activeTheme: key, theme: THEMES[key] }),
    }),
    {
      name: 'havana-theme',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

export const useTheme = () => useThemeStore((s) => s.theme);
export const useSetTheme = () => useThemeStore((s) => s.setTheme);
export const useActiveTheme = () => useThemeStore((s) => s.activeTheme);
