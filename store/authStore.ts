import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage';
import { UserProfile } from '@/lib/firebase';

interface AuthState {
  uid: string | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setUid: (uid: string | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      uid: null,
      profile: null,
      isLoading: true,
      setUid: (uid) => set({ uid }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      signOut: () => set({ uid: null, profile: null }),
    }),
    {
      name: 'havana-auth',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({ uid: state.uid, profile: state.profile }),
    },
  ),
);
