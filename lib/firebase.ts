import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// initializeFirestore (not getFirestore) so undefined optional fields (e.g.
// photoUrl when no photo is picked) don't make addDoc/setDoc throw. Falls
// back to getFirestore since initializeFirestore throws if called twice for
// the same app (happens on web Fast Refresh).
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, { ignoreUndefinedProperties: true });
} catch {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;

export const storage = getStorage(app);

// ─── Firestore Collection Paths ───────────────────────────────────────────────

export const COLLECTIONS = {
  USERS: 'users',
  CIGARS: 'cigars',
  WHISKIES: 'whiskies',
  COLLECTION: 'collections',
  TASTINGS: 'tastings',
  POSTS: 'posts',
  FOLLOWS: 'follows',
  LIKES: 'likes',
  LOUNGES: 'lounges',
  SCANS: 'scans',
  CONTRIBUTIONS: 'contributions',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  username: string;
  avatarUrl: string | null;
  badgeLevel: 0 | 1 | 2 | 3;
  theme: 'dark-luxury' | 'vintage' | 'modern';
  bio: string | null;
  createdAt: string;
  // Modera a fila de contributions. Setado manualmente no console Firebase;
  // as Security Rules leem este campo (users/{uid}.isAdmin) como fonte da verdade.
  isAdmin?: boolean;
}

export interface Cigar {
  id: string;
  name: string;
  brand: string;
  origin: string;
  wrapper: string;
  binder: string;
  filler: string;
  strength: 'mild' | 'medium' | 'full';
  flavorNotes: string[];
  curiosities: string | null;
  imageUrl: string | null;
}

export interface Whisky {
  id: string;
  name: string;
  distillery: string;
  region: string;
  age: number | null;
  flavorNotes: string[];
  curiosities: string | null;
  imageUrl: string | null;
}

export interface CollectionItem {
  id: string;
  userId: string;
  cigarId: string;
  status: 'intact' | 'smoking' | 'finished';
  quantity: number;
  purchaseDate: string | null;
  price: number | null;
  notes: string | null;
}

// Um terço da degustação ao vivo (1/3, 2/3, 3/3). Offsets em segundos desde o
// início da sessão — derivados de relógio de parede, não de intervalos.
export interface TastingPhase {
  third: 1 | 2 | 3;
  startedAtSec: number;
  durationSec: number;
  flavorNotes: string[];
  strengthFelt: 'suave' | 'medio-suave' | 'medio' | 'medio-forte' | 'forte' | null;
  comment: string | null;
}

export interface Tasting {
  id: string;
  userId: string;
  cigarId: string | null;
  whiskyId: string | null;
  // Denormalized at write time so the tastings list can render without a
  // join against the catalog collections.
  itemName?: string;
  itemBrand?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  // Escala 0–10 do fluxo pós-scan/degustação ao vivo. Quando presente, é a
  // fonte da verdade; `rating` (1–5) é derivado no write para o feed antigo.
  rating10?: number;
  notes: string | null;
  flavorNotes: string[];
  date: string;
  isPublic: boolean;
  // Ligação com o double check do scanner (doc da coleção scans).
  scanId?: string | null;
  photoUrl?: string | null;
  // 'live' = sessão cronometrada pelos três terços; 'quick' = retrospectiva.
  smokeMode?: 'quick' | 'live';
  durationSec?: number;
  phases?: TastingPhase[];
}

export interface Post {
  id: string;
  userId: string;
  tastingId: string | null;
  caption: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  // Denormalized at write time, same pattern as FeedPost.authorName/avatarUrl —
  // avoids a UserProfile lookup per comment when rendering the list.
  authorName?: string;
  avatarUrl?: string | null;
  content: string;
  createdAt: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt?: string;
}

export interface Like {
  postId: string;
  userId: string;
  createdAt?: string;
}

export interface Lounge {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  phone?: string;
  description?: string;
  submittedBy?: string;
  status: 'pending' | 'approved';
  createdAt: string;
}

// ─── Denormalized types for MVP UI ───────────────────────────────────────────

export interface FeedPost {
  id: string;
  userId: string;
  authorName: string;
  avatarUrl?: string | null;
  caption: string;
  cigarName?: string;
  whiskyName?: string;
  rating: number;
  likesCount: number;
  commentsCount: number;
  createdAt: any;
}

export interface CigarCatalog {
  id: string;
  name: string;
  brand: string;
  origin: string;
  strength: string;
  flavorNotes: string[];
  communityRating: number;
  imageUrl?: string | null;
  // Chave da imagem local em assets/charutos (lib/cigarImages.ts),
  // ex.: 'Cohiba-Siglo-VI.png' — preenchida pelo scripts/seed-catalog.js.
  imageKey?: string | null;
  // Tempo médio de fumada em minutos — gravado pelo scripts/seed-cuban-cigars.js;
  // alimenta a sugestão de terços na degustação ao vivo.
  smokeTimeMin?: number;
}

export interface WhiskyCatalog {
  id: string;
  name: string;
  brand: string;
  region: string;
  age?: number;
  flavorNotes: string[];
  communityRating: number;
  imageUrl?: string | null;
}

export interface HumidorEntry {
  id: string;
  userId: string;
  cigarName: string;
  brand: string;
  quantity: number;
  status: 'intact' | 'smoking' | 'finished';
  // Chave do catálogo local de imagens (lib/cigarImages.ts / assets/charutos/cigar-mapping.json),
  // ex: "Cohiba-Siglo-VI.png" — não é um doc id do Firestore.
  cigarId?: string | null;
  // true quando o matching contra o catálogo local rodou e não achou nenhum candidato.
  unidentified?: boolean;
  notes?: string;
  // AI enrichment — optional, populated when added via AI identification
  origin?: string;
  strength?: string;
  flavorNotes?: string[];
  curiosities?: string;
  history?: string;
  photoUrl?: string;
  // Detalhes de compra — opcionais, preenchidos via bloco "avançado" no AddCigarModal
  purchaseType?: 'single' | 'box_pack';
  boxSize?: number;
  boxCode?: string;
  purchaseCountry?: string;
  seller?: string;
}

// ─── Scanner double check ─────────────────────────────────────────────────────
// Cada tentativa de scan vira um doc — inclusive abandonos ('abandoned' é o
// estado INICIAL do doc, criado assim que a IA responde; desfechos reais são
// updates). Nada do double check se perde: é o dataset de treino do produto.

export interface Scan {
  id: string;
  userId: string;
  // Firebase Storage; null quando o upload falhou — a foto nunca bloqueia o registro.
  photoUrl: string | null;
  // Doc id da coleção cigars sugerido pelo matching (null = nenhum candidato).
  suggestedCigarId: string | null;
  suggestedName?: string;
  suggestedBrand?: string;
  // Resposta crua da IA de visão — com result 'corrected', o par
  // (aiGuess + suggestedCigarId errado + confirmedCigarId certo) é dado de treino.
  aiGuess: { name: string; brand: string; origin?: string; strength?: string };
  confidence: number; // 0–1: 1 match exato, score fuzzy, 0 sem candidato
  result: 'confirmed' | 'corrected' | 'not_found' | 'abandoned';
  confirmedCigarId: string | null;
  // Derivado no write (lib/firestore.ts resolveScan): result confirmed/corrected.
  // Validado por humano — o front nunca seta este campo diretamente.
  trusted: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

// Fila colaborativa de vitolas que não existem no catálogo. Admin aprova
// (criando o doc em cigars) ou rejeita — ver app/admin/contributions.tsx.
export interface Contribution {
  id: string;
  userId: string;
  scanId: string | null;
  brandText: string;
  lineText: string;
  commercialNameText: string;
  photoUrl: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdCigarId: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface CigarAIResult {
  name: string;
  brand: string;
  origin: string;
  strength: string;
  flavorNotes: string[];
  curiosities: string;
  history: string;
}

export interface BulkParseItem {
  cigarName: string;
  brand: string;
  quantity: number;
  status: 'intact';
}
