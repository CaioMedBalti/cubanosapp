import { create } from 'zustand';

// Controla o overlay de vídeo que cobre a troca Login → Home. Não persiste:
// a transição só existe dentro de uma sessão de login bem-sucedido.
interface TransitionState {
  active: boolean;
  start: () => void;
  finish: () => void;
}

export const useTransitionStore = create<TransitionState>()((set) => ({
  active: false,
  start: () => set({ active: true }),
  finish: () => set({ active: false }),
}));
