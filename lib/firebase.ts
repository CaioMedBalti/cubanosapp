import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
export const db = getFirestore(app);
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

export interface Tasting {
  id: string;
  userId: string;
  cigarId: string | null;
  whiskyId: string | null;
  rating: 1 | 2 | 3 | 4 | 5;
  notes: string | null;
  flavorNotes: string[];
  date: string;
  isPublic: boolean;
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
  content: string;
  createdAt: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
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
  cigarId?: string | null;
}
