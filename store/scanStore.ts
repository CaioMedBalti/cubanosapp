import { create } from 'zustand';
import { CigarAIResult, CigarCatalog } from '@/lib/firebase';
import { MatchResult } from '@/lib/matching';

// Estado do fluxo /scan entre as rotas (captura → confirmar → buscar/contribuir
// → avaliar). Não persiste: se o app morrer no meio, o doc de scans já nasceu
// como 'abandoned' — o registro do double check nunca depende deste store.
interface ScanState {
  photoUri: string | null;
  photoBase64: string | null;
  mimeType: string | null;
  // URL no Firebase Storage (null enquanto sobe ou se o upload falhou).
  photoUrl: string | null;
  aiResult: CigarAIResult | null;
  match: MatchResult<CigarCatalog> | null;
  scanId: string | null;
  // Vitola validada pelo double check (confirmada ou corrigida).
  confirmedCigar: CigarCatalog | null;
  setPhoto: (uri: string, base64: string, mimeType: string) => void;
  setPhotoUrl: (url: string | null) => void;
  setIdentification: (
    aiResult: CigarAIResult,
    match: MatchResult<CigarCatalog>,
  ) => void;
  // Chegando depois da navegação: o createScan roda em background e grava o
  // id quando resolver — a UI nunca espera por ele.
  setScanId: (scanId: string) => void;
  setConfirmedCigar: (cigar: CigarCatalog) => void;
  reset: () => void;
}

const initialState = {
  photoUri: null,
  photoBase64: null,
  mimeType: null,
  photoUrl: null,
  aiResult: null,
  match: null,
  scanId: null,
  confirmedCigar: null,
};

export const useScanStore = create<ScanState>()((set) => ({
  ...initialState,
  setPhoto: (photoUri, photoBase64, mimeType) =>
    set({ photoUri, photoBase64, mimeType }),
  setPhotoUrl: (photoUrl) => set({ photoUrl }),
  setIdentification: (aiResult, match) => set({ aiResult, match }),
  setScanId: (scanId) => set({ scanId }),
  setConfirmedCigar: (confirmedCigar) => set({ confirmedCigar }),
  reset: () => set(initialState),
}));
