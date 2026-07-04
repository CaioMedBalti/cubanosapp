export type ThemeKey = 'dark-luxury' | 'vintage' | 'modern';

export interface Theme {
  key: ThemeKey;
  label: string;
  background: string;
  surface: string;
  card: string;
  accent: string;
  accentDim: string;
  text: string;
  textMuted: string;
  border: string;
  videoFile: string;
}

export const THEMES: Record<ThemeKey, Theme> = {
  'dark-luxury': {
    key: 'dark-luxury',
    label: 'Dark Luxury',
    background: '#0d0a08',
    surface: '#1a1209',
    card: '#241a0f',
    accent: '#EF9F27',
    accentDim: '#c9a84c',
    text: '#f0e6d3',
    textMuted: '#8b7355',
    border: '#3d2b1a',
    videoFile: 'bg-dark-luxury.mp4',
  },
  vintage: {
    key: 'vintage',
    label: 'Vintage',
    background: '#f4e9d8',
    surface: '#ede0c8',
    card: '#faf3e3',
    accent: '#8b5e34',
    accentDim: '#a97c4f',
    text: '#3b2a1a',
    textMuted: '#8a7358',
    border: '#c9b48f',
    videoFile: 'bg-vintage.mp4',
  },
  modern: {
    key: 'modern',
    label: 'Modern',
    background: '#111111',
    surface: '#1d1d1d',
    card: '#252525',
    accent: '#e07830',
    accentDim: '#b85c20',
    text: '#e0e0e0',
    textMuted: '#666666',
    border: '#2a2a2a',
    videoFile: 'bg-modern.mp4',
  },
};

export const DEFAULT_THEME: ThemeKey = 'dark-luxury';

export interface Badge {
  level: number;
  label: string;
  subtitle?: string;
  icon: string;
  minTastings: number;
}

export const BADGES: Badge[] = [
  { level: 0, label: 'Iniciante',   icon: 'leaf',    minTastings: 0 },
  { level: 1, label: 'Aficionado',  icon: 'flame',   minTastings: 10 },
  { level: 2, label: 'Connoisseur', icon: 'diamond', minTastings: 50 },
  { level: 3, label: 'Mestre',      subtitle: 'da brasa', icon: 'crown', minTastings: 200 },
];

export function getBadgeForTastings(count: number): Badge {
  return [...BADGES].reverse().find((b) => count >= b.minTastings) ?? BADGES[0];
}
