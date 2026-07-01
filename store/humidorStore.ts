import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage';

export type HumidorViewMode = 'grid' | 'list' | 'shelf';

interface HumidorViewState {
  viewMode: HumidorViewMode;
  setViewMode: (mode: HumidorViewMode) => void;
}

export const useHumidorViewStore = create<HumidorViewState>()(
  persist(
    (set) => ({
      viewMode: 'grid',
      setViewMode: (mode: HumidorViewMode) => set({ viewMode: mode }),
    }),
    {
      name: 'havana-humidor-view',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
