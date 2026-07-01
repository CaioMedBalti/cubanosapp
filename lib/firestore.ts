import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  CollectionReference,
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

export async function batchAddHumidorItems(
  userId: string,
  items: Omit<HumidorEntry, 'id' | 'userId'>[],
): Promise<void> {
  await Promise.all(items.map((item) => addDoc(collection(db, COLLECTIONS.USERS, userId, 'humidor'), item)));
}

// ─── Example data reset ────────────────────────────────────────────────────────
// Replaces the old unprotected "Seed" flow (which duplicated data on every tap).
// Wipes the catalog/posts/humidor and recreates a small, clearly-labeled set of
// example entries — see hooks/useOneTimeDataReset.ts for when this runs.

async function clearCollection(colRef: CollectionReference): Promise<void> {
  const snap = await getDocs(colRef);
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

export async function resetExampleData(userId: string, authorName: string): Promise<void> {
  await Promise.all([
    clearCollection(collection(db, COLLECTIONS.CIGARS)),
    clearCollection(collection(db, COLLECTIONS.WHISKIES)),
    clearCollection(collection(db, COLLECTIONS.POSTS)),
    clearCollection(collection(db, COLLECTIONS.USERS, userId, 'humidor')),
  ]);

  const cigars: Omit<CigarCatalog, 'id'>[] = [
    { name: 'Siglo VI', brand: 'Cohiba', origin: 'Cuba', strength: 'Médio-Forte', flavorNotes: ['Chocolate', 'Cedro', 'Terra'], communityRating: 5 },
    { name: 'Serie D No.4', brand: 'Partagás', origin: 'Cuba', strength: 'Forte', flavorNotes: ['Terra', 'Couro', 'Pimenta'], communityRating: 4 },
    { name: 'No.2', brand: 'Montecristo', origin: 'Cuba', strength: 'Médio', flavorNotes: ['Creme', 'Cedro', 'Nozes'], communityRating: 5 },
  ];

  const whiskies: Omit<WhiskyCatalog, 'id'>[] = [
    { name: 'Glenfiddich 18', brand: 'Glenfiddich', region: 'Speyside', age: 18, flavorNotes: ['Mel', 'Laranja', 'Especiarias'], communityRating: 4 },
    { name: 'Macallan 12', brand: 'Macallan', region: 'Speyside', age: 12, flavorNotes: ['Caramelo', 'Frutas Secas', 'Vanilla'], communityRating: 4 },
    { name: 'Laphroaig 10', brand: 'Laphroaig', region: 'Islay', age: 10, flavorNotes: ['Turfa', 'Defumado', 'Iodo'], communityRating: 4 },
  ];

  // cigarId aponta pra chave do catálogo local de imagens (lib/cigarImages.ts /
  // assets/charutos/cigar-mapping.json), demonstrando o matching já resolvido.
  const humidorItems: Omit<HumidorEntry, 'id' | 'userId'>[] = [
    { cigarName: 'Siglo VI', brand: 'Cohiba', quantity: 3, status: 'intact', cigarId: 'Cohiba-Siglo-VI.png', unidentified: false, notes: 'Exemplo' },
    { cigarName: 'Serie D No.4', brand: 'Partagás', quantity: 5, status: 'intact', cigarId: 'Partagas-Serie-D-No4.png', unidentified: false, notes: 'Exemplo' },
    { cigarName: 'No.2', brand: 'Montecristo', quantity: 2, status: 'smoking', cigarId: 'Montecristo-No2.png', unidentified: false, notes: 'Exemplo' },
  ];

  const posts: Omit<FeedPost, 'id'>[] = [
    {
      userId,
      authorName,
      caption: 'Exemplo — experiência com um Cohiba Siglo VI, notas de chocolate amargo e cedro no final.',
      cigarName: 'Cohiba Siglo VI',
      whiskyName: 'Glenfiddich 18',
      rating: 5,
      likesCount: 12,
      commentsCount: 2,
      createdAt: serverTimestamp(),
    },
  ];

  await Promise.all([
    ...cigars.map((c) => addDoc(collection(db, COLLECTIONS.CIGARS), c)),
    ...whiskies.map((w) => addDoc(collection(db, COLLECTIONS.WHISKIES), w)),
    ...humidorItems.map((item) => addDoc(collection(db, COLLECTIONS.USERS, userId, 'humidor'), item)),
    ...posts.map((p) => addDoc(collection(db, COLLECTIONS.POSTS), p)),
  ]);
}
