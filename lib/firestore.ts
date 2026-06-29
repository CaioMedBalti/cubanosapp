import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  addDoc,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import {
  db,
  COLLECTIONS,
  FeedPost,
  CigarCatalog,
  WhiskyCatalog,
  HumidorEntry,
} from './firebase';

// ─── Posts ────────────────────────────────────────────────────────────────────

export function subscribePosts(
  callback: (posts: FeedPost[]) => void,
  limitN = 30,
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.POSTS),
    orderBy('createdAt', 'desc'),
    limit(limitN),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FeedPost));
  });
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export async function getCigars(): Promise<CigarCatalog[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.CIGARS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CigarCatalog);
}

export async function getWhiskies(): Promise<WhiskyCatalog[]> {
  const snap = await getDocs(collection(db, COLLECTIONS.WHISKIES));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WhiskyCatalog);
}

// ─── Humidor ─────────────────────────────────────────────────────────────────

export function subscribeHumidor(
  userId: string,
  callback: (items: HumidorEntry[]) => void,
): Unsubscribe {
  const q = collection(db, COLLECTIONS.USERS, userId, 'humidor');
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, userId, ...d.data() }) as HumidorEntry),
    );
  });
}

export async function addHumidorItem(
  userId: string,
  item: Omit<HumidorEntry, 'id' | 'userId'>,
): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.USERS, userId, 'humidor'), item);
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

export async function seedCatalog(): Promise<void> {
  const cigars: Omit<CigarCatalog, 'id'>[] = [
    { name: 'Siglo VI', brand: 'Cohiba', origin: 'Cuba', strength: 'Médio-Forte', flavorNotes: ['Chocolate', 'Cedro', 'Terra'], communityRating: 5 },
    { name: 'Serie D No.4', brand: 'Partagás', origin: 'Cuba', strength: 'Forte', flavorNotes: ['Terra', 'Couro', 'Pimenta'], communityRating: 4 },
    { name: 'No.2', brand: 'Montecristo', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Creme', 'Cedro', 'Nozes'], communityRating: 5 },
    { name: 'Churchill', brand: 'Romeo y Julieta', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Flores', 'Madeira', 'Creme'], communityRating: 4 },
    { name: 'BHK 54', brand: 'Cohiba', origin: 'Cuba', strength: 'Forte', flavorNotes: ['Chocolate Amargo', 'Pimenta', 'Cedro'], communityRating: 5 },
    { name: 'Petit Edmundo', brand: 'Montecristo', origin: 'Cuba', strength: 'Forte', flavorNotes: ['Espresso', 'Pimenta Preta', 'Cedro'], communityRating: 4 },
  ];

  const whiskies: Omit<WhiskyCatalog, 'id'>[] = [
    { name: 'Glenfiddich 18', brand: 'Glenfiddich', region: 'Speyside', age: 18, flavorNotes: ['Mel', 'Laranja', 'Especiarias'], communityRating: 4 },
    { name: 'Macallan 12', brand: 'Macallan', region: 'Speyside', age: 12, flavorNotes: ['Caramelo', 'Frutas Secas', 'Vanilla'], communityRating: 4 },
    { name: 'Laphroaig 10', brand: 'Laphroaig', region: 'Islay', age: 10, flavorNotes: ['Turfa', 'Defumado', 'Iodo'], communityRating: 4 },
    { name: 'Oban 14', brand: 'Oban', region: 'Highland', age: 14, flavorNotes: ['Mar', 'Sal', 'Cítrico'], communityRating: 4 },
    { name: 'Yamazaki 12', brand: 'Suntory', region: 'Japan', age: 12, flavorNotes: ['Pêssego', 'Vanilla', 'Carvalho Japonês'], communityRating: 5 },
    { name: 'Balvenie 14 Caribbean', brand: 'Balvenie', region: 'Speyside', age: 14, flavorNotes: ['Coco', 'Baunilha', 'Mel'], communityRating: 4 },
  ];

  await Promise.all([
    ...cigars.map((c) => addDoc(collection(db, COLLECTIONS.CIGARS), c)),
    ...whiskies.map((w) => addDoc(collection(db, COLLECTIONS.WHISKIES), w)),
  ]);
}

export async function seedPosts(userId: string, authorName: string): Promise<void> {
  const posts: Omit<FeedPost, 'id'>[] = [
    {
      userId,
      authorName,
      caption: 'Experiência incrível com esse Cohiba. Notas de chocolate amargo e cedro no final. Um dos melhores que já fumei.',
      cigarName: 'Cohiba Siglo VI',
      whiskyName: 'Glenfiddich 18',
      rating: 5,
      likesCount: 42,
      commentsCount: 7,
      createdAt: serverTimestamp(),
    },
    {
      userId,
      authorName,
      caption: 'Tarde perfeita. O Partagás combinou perfeitamente com o Macallan. Fumadores, recomendem mais pairings assim!',
      cigarName: 'Partagás Serie D No.4',
      whiskyName: 'Macallan 12',
      rating: 4,
      likesCount: 28,
      commentsCount: 3,
      createdAt: serverTimestamp(),
    },
    {
      userId,
      authorName,
      caption: 'Primeiro Montecristo. Ficou acima das expectativas — cremoso, equilibrado, longo. Já encaixotei mais seis.',
      cigarName: 'Montecristo No.2',
      rating: 4,
      likesCount: 19,
      commentsCount: 5,
      createdAt: serverTimestamp(),
    },
    {
      userId,
      authorName,
      caption: 'Degustação com o clube ontem. Seis rótulos diferentes, sete charutos, noite memorável.',
      whiskyName: 'Laphroaig 10',
      rating: 5,
      likesCount: 61,
      commentsCount: 14,
      createdAt: serverTimestamp(),
    },
  ];

  await Promise.all(posts.map((p) => addDoc(collection(db, COLLECTIONS.POSTS), p)));
}

export async function seedHumidor(userId: string): Promise<void> {
  const items: Omit<HumidorEntry, 'id' | 'userId'>[] = [
    { cigarName: 'Siglo VI', brand: 'Cohiba', quantity: 6, status: 'intact' },
    { cigarName: 'Serie D No.4', brand: 'Partagás', quantity: 12, status: 'intact' },
    { cigarName: 'No.2', brand: 'Montecristo', quantity: 3, status: 'smoking' },
    { cigarName: 'Petit Edmundo', brand: 'Montecristo', quantity: 1, status: 'smoking' },
    { cigarName: 'BHK 54', brand: 'Cohiba', quantity: 2, status: 'intact' },
  ];

  await Promise.all(
    items.map((item) => addDoc(collection(db, COLLECTIONS.USERS, userId, 'humidor'), item)),
  );
}
