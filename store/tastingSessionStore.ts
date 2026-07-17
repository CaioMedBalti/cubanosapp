import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/lib/storage';
import { TastingPhase } from '@/lib/firebase';

// Degustação ao vivo pelos três terços. Uma fumada dura 40–90+ min e o app vai
// para background (ou é morto) nesse tempo, então:
//  - o store PERSISTE (mesmo padrão de authStore/humidorStore);
//  - o cronômetro nunca depende de intervalo rodando — todo tempo é derivado
//    de timestamps de relógio de parede via sessionElapsedSec().
export interface SessionCigar {
  // Doc id da coleção cigars (null quando a vitola não está no catálogo —
  // ex.: item do humidor sem match).
  id: string | null;
  name: string;
  brand: string;
  smokeTimeMin?: number;
}

export interface PhaseDraft {
  flavorNotes: string[];
  strengthFelt: TastingPhase['strengthFelt'];
  comment: string;
}

const emptyDraft: PhaseDraft = { flavorNotes: [], strengthFelt: null, comment: '' };

interface TastingSessionState {
  cigar: SessionCigar | null;
  scanId: string | null;
  photoUrl: string | null;
  startedAt: number | null; // Date.now() no play (null = sem sessão ativa)
  pausedAt: number | null; // Date.now() no pause (null = rodando)
  pausedTotalMs: number; // acumulado de pausas encerradas
  currentThird: 1 | 2 | 3;
  thirdStartedAtSec: number; // offset do início do terço atual
  phases: TastingPhase[]; // terços já encerrados
  draft: PhaseDraft; // terço atual
  start: (cigar: SessionCigar, opts?: { scanId?: string | null; photoUrl?: string | null }) => void;
  pause: () => void;
  resume: () => void;
  updateDraft: (partial: Partial<PhaseDraft>) => void;
  // Congela o draft como TastingPhase e abre o próximo terço (1→2, 2→3).
  advanceThird: () => void;
  // Congela o 3º terço e retorna as fases completas + duração total.
  finish: () => { phases: TastingPhase[]; durationSec: number };
  reset: () => void;
}

const initialState = {
  cigar: null,
  scanId: null,
  photoUrl: null,
  startedAt: null,
  pausedAt: null,
  pausedTotalMs: 0,
  currentThird: 1 as const,
  thirdStartedAtSec: 0,
  phases: [],
  draft: emptyDraft,
};

// Tempo decorrido da sessão em segundos, descontando pausas. Recalculado a
// cada chamada — sobrevive a background/kill porque só depende dos timestamps.
export function sessionElapsedSec(s: {
  startedAt: number | null;
  pausedAt: number | null;
  pausedTotalMs: number;
}): number {
  if (!s.startedAt) return 0;
  const end = s.pausedAt ?? Date.now();
  return Math.max(0, Math.floor((end - s.startedAt - s.pausedTotalMs) / 1000));
}

function freezeDraft(state: TastingSessionState): TastingPhase {
  const elapsed = sessionElapsedSec(state);
  return {
    third: state.currentThird,
    startedAtSec: state.thirdStartedAtSec,
    durationSec: Math.max(0, elapsed - state.thirdStartedAtSec),
    flavorNotes: state.draft.flavorNotes,
    strengthFelt: state.draft.strengthFelt,
    comment: state.draft.comment.trim() || null,
  };
}

export const useTastingSessionStore = create<TastingSessionState>()(
  persist(
    (set, get) => ({
      ...initialState,
      start: (cigar, opts) =>
        set({
          ...initialState,
          cigar,
          scanId: opts?.scanId ?? null,
          photoUrl: opts?.photoUrl ?? null,
          startedAt: Date.now(),
        }),
      pause: () => {
        if (get().pausedAt === null && get().startedAt !== null) {
          set({ pausedAt: Date.now() });
        }
      },
      resume: () => {
        const { pausedAt, pausedTotalMs } = get();
        if (pausedAt !== null) {
          set({ pausedAt: null, pausedTotalMs: pausedTotalMs + (Date.now() - pausedAt) });
        }
      },
      updateDraft: (partial) => set({ draft: { ...get().draft, ...partial } }),
      advanceThird: () => {
        const state = get();
        if (state.currentThird >= 3 || !state.startedAt) return;
        const phase = freezeDraft(state);
        set({
          phases: [...state.phases, phase],
          currentThird: (state.currentThird + 1) as 2 | 3,
          thirdStartedAtSec: sessionElapsedSec(state),
          draft: emptyDraft,
        });
      },
      finish: () => {
        const state = get();
        const phases = [...state.phases, freezeDraft(state)];
        const durationSec = sessionElapsedSec(state);
        return { phases, durationSec };
      },
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'havana-tasting-session',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
