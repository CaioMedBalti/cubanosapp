import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  increment,
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
  UserProfile,
  Tasting,
  Comment,
  Lounge,
} from './firebase';

// ─── Feed (following-based) ────────────────────────────────────────────────────
// Firestore has no JOINs, so a "posts from people I follow" feed is built in
// two steps: get the follow graph, then fetch posts for those authors. The
// `in` operator caps at 10 values, so ids are chunked and merged client-side.

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function subscribeFollowingFeed(
  idsToQuery: string[],
  callback: (posts: FeedPost[]) => void,
  limitN = 30,
): Unsubscribe {
  if (idsToQuery.length === 0) {
    callback([]);
    return () => {};
  }

  const chunks = chunk(idsToQuery, 10);
  const resultsByChunk = new Map<number, FeedPost[]>();

  const emit = () => {
    const merged = new Map<string, FeedPost>();
    for (const posts of resultsByChunk.values()) {
      for (const p of posts) merged.set(p.id, p);
    }
    const sorted = Array.from(merged.values()).sort((a, b) => {
      const aMs = a.createdAt?.toMillis?.() ?? 0;
      const bMs = b.createdAt?.toMillis?.() ?? 0;
      return bMs - aMs;
    });
    callback(sorted.slice(0, limitN));
  };

  const unsubs = chunks.map((ids, i) => {
    const q = query(
      collection(db, COLLECTIONS.POSTS),
      where('userId', 'in', ids),
      orderBy('createdAt', 'desc'),
      limit(limitN),
    );
    return onSnapshot(
      q,
      (snap) => {
        resultsByChunk.set(i, snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FeedPost));
        emit();
      },
      (err) => {
        // Most commonly a missing composite index on first run — surface an
        // empty feed instead of leaving callers stuck on a loading spinner.
        console.error('subscribeFollowingFeed error:', err);
        resultsByChunk.set(i, []);
        emit();
      },
    );
  });

  return () => unsubs.forEach((u) => u());
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

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'username' | 'bio'>>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), updates);
}

export function subscribeTastingCount(
  userId: string,
  callback: (count: number) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.TASTINGS), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snap) => callback(snap.size),
    (err) => {
      console.error('subscribeTastingCount error:', err);
      callback(0);
    },
  );
}

export function subscribeFollowCounts(
  userId: string,
  callback: (counts: { followers: number; following: number }) => void,
): Unsubscribe {
  let followers = 0;
  let following = 0;
  const onError = (err: unknown) => console.error('subscribeFollowCounts error:', err);
  const unsubFollowers = onSnapshot(
    query(collection(db, COLLECTIONS.FOLLOWS), where('followingId', '==', userId)),
    (snap) => {
      followers = snap.size;
      callback({ followers, following });
    },
    onError,
  );
  const unsubFollowing = onSnapshot(
    query(collection(db, COLLECTIONS.FOLLOWS), where('followerId', '==', userId)),
    (snap) => {
      following = snap.size;
      callback({ followers, following });
    },
    onError,
  );
  return () => {
    unsubFollowers();
    unsubFollowing();
  };
}

// ─── Tastings ────────────────────────────────────────────────────────────────

export function subscribeUserTastings(
  userId: string,
  callback: (tastings: Tasting[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.TASTINGS),
    where('userId', '==', userId),
    orderBy('date', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tasting));
    },
    (err) => {
      console.error('subscribeUserTastings error:', err);
      callback([]);
    },
  );
}

// Public-only variant for viewing another user's profile — no orderBy, so it
// doesn't need a second composite index; sort client-side instead.
export function subscribePublicTastings(
  userId: string,
  callback: (tastings: Tasting[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.TASTINGS),
    where('userId', '==', userId),
    where('isPublic', '==', true),
  );
  return onSnapshot(
    q,
    (snap) => {
      const tastings = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tasting);
      tastings.sort((a, b) => (a.date < b.date ? 1 : -1));
      callback(tastings);
    },
    (err) => {
      console.error('subscribePublicTastings error:', err);
      callback([]);
    },
  );
}

export interface LogTastingInput {
  userId: string;
  cigarId?: string | null;
  whiskyId?: string | null;
  itemName?: string;
  itemBrand?: string;
  authorName: string;
  avatarUrl?: string | null;
  rating: 1 | 2 | 3 | 4 | 5;
  notes?: string | null;
  flavorNotes?: string[];
  isPublic: boolean;
}

export async function logTasting(
  input: LogTastingInput,
): Promise<{ tastingId: string; postId: string | null }> {
  const tasting: Omit<Tasting, 'id'> = {
    userId: input.userId,
    cigarId: input.cigarId ?? null,
    whiskyId: input.whiskyId ?? null,
    itemName: input.itemName,
    itemBrand: input.itemBrand,
    rating: input.rating,
    notes: input.notes ?? null,
    flavorNotes: input.flavorNotes ?? [],
    date: new Date().toISOString(),
    isPublic: input.isPublic,
  };

  const [tastingRef, postRef] = await Promise.all([
    addDoc(collection(db, COLLECTIONS.TASTINGS), tasting),
    input.isPublic
      ? addDoc(collection(db, COLLECTIONS.POSTS), {
          userId: input.userId,
          authorName: input.authorName,
          avatarUrl: input.avatarUrl ?? null,
          caption: input.notes ?? '',
          cigarName: input.cigarId ? input.itemName : undefined,
          whiskyName: input.whiskyId ? input.itemName : undefined,
          rating: input.rating,
          likesCount: 0,
          commentsCount: 0,
          createdAt: serverTimestamp(),
        } as Omit<FeedPost, 'id'>)
      : Promise.resolve(null),
  ]);

  return { tastingId: tastingRef.id, postId: postRef?.id ?? null };
}

// ─── Follows ─────────────────────────────────────────────────────────────────
// Deterministic doc id (`${followerId}_${followingId}`) instead of a
// query-then-write pattern — avoids a duplicate-follow race and an extra read.

function followDocId(followerId: string, followingId: string): string {
  return `${followerId}_${followingId}`;
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.FOLLOWS, followDocId(followerId, followingId)), {
    followerId,
    followingId,
    createdAt: serverTimestamp(),
  });
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.FOLLOWS, followDocId(followerId, followingId)));
}

export function subscribeIsFollowing(
  followerId: string,
  followingId: string,
  callback: (isFollowing: boolean) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, COLLECTIONS.FOLLOWS, followDocId(followerId, followingId)),
    (snap) => callback(snap.exists()),
    (err) => {
      console.error('subscribeIsFollowing error:', err);
      callback(false);
    },
  );
}

export function subscribeFollowingIds(
  userId: string,
  callback: (ids: string[]) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.FOLLOWS), where('followerId', '==', userId));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => d.data().followingId as string)),
    (err) => {
      console.error('subscribeFollowingIds error:', err);
      callback([]);
    },
  );
}

// ─── Likes ───────────────────────────────────────────────────────────────────
// Same deterministic doc id pattern as follows (`${postId}_${userId}`) — avoids
// a duplicate-like race and lets us derive isLiked from doc existence alone.

function likeDocId(postId: string, userId: string): string {
  return `${postId}_${userId}`;
}

export async function likePost(postId: string, userId: string): Promise<void> {
  await Promise.all([
    setDoc(doc(db, COLLECTIONS.LIKES, likeDocId(postId, userId)), {
      postId,
      userId,
      createdAt: serverTimestamp(),
    }),
    updateDoc(doc(db, COLLECTIONS.POSTS, postId), { likesCount: increment(1) }),
  ]);
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  await Promise.all([
    deleteDoc(doc(db, COLLECTIONS.LIKES, likeDocId(postId, userId))),
    updateDoc(doc(db, COLLECTIONS.POSTS, postId), { likesCount: increment(-1) }),
  ]);
}

export function subscribeIsLiked(
  postId: string,
  userId: string,
  callback: (isLiked: boolean) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, COLLECTIONS.LIKES, likeDocId(postId, userId)),
    (snap) => callback(snap.exists()),
    (err) => {
      console.error('subscribeIsLiked error:', err);
      callback(false);
    },
  );
}

// ─── Comments ────────────────────────────────────────────────────────────────
// Subcollection posts/{postId}/comments — orderBy alone on a subcollection
// doesn't need a manual composite index (unlike a top-level `comments`
// collection queried with where(postId)+orderBy, which would).

export function subscribeComments(
  postId: string,
  callback: (comments: Comment[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, COLLECTIONS.POSTS, postId, 'comments'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, postId, ...d.data() }) as Comment));
    },
    (err) => {
      console.error('subscribeComments error:', err);
      callback([]);
    },
  );
}

export async function addComment(
  postId: string,
  userId: string,
  content: string,
  authorName?: string,
  avatarUrl?: string | null,
): Promise<void> {
  await Promise.all([
    addDoc(collection(db, COLLECTIONS.POSTS, postId, 'comments'), {
      userId,
      authorName: authorName ?? null,
      avatarUrl: avatarUrl ?? null,
      content,
      createdAt: serverTimestamp(),
    }),
    updateDoc(doc(db, COLLECTIONS.POSTS, postId), { commentsCount: increment(1) }),
  ]);
}

// ─── Followers / Following lists ────────────────────────────────────────────

async function resolveUserProfiles(uids: string[]): Promise<UserProfile[]> {
  if (uids.length === 0) return [];
  const chunks = chunk(uids, 10);
  const results = await Promise.all(
    chunks.map(async (ids) => {
      const snap = await getDocs(
        query(collection(db, COLLECTIONS.USERS), where('__name__', 'in', ids)),
      );
      return snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile);
    }),
  );
  return results.flat();
}

export function subscribeFollowersList(
  userId: string,
  callback: (users: UserProfile[]) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.FOLLOWS), where('followingId', '==', userId));
  return onSnapshot(
    q,
    async (snap) => {
      const ids = snap.docs.map((d) => d.data().followerId as string);
      callback(await resolveUserProfiles(ids));
    },
    (err) => {
      console.error('subscribeFollowersList error:', err);
      callback([]);
    },
  );
}

export function subscribeFollowingList(
  userId: string,
  callback: (users: UserProfile[]) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.FOLLOWS), where('followerId', '==', userId));
  return onSnapshot(
    q,
    async (snap) => {
      const ids = snap.docs.map((d) => d.data().followingId as string);
      callback(await resolveUserProfiles(ids));
    },
    (err) => {
      console.error('subscribeFollowingList error:', err);
      callback([]);
    },
  );
}

// ─── Lounges ─────────────────────────────────────────────────────────────────
// `where` único, sem `orderBy` — sem índice composto manual. Ordenação
// (distância ou nome) é feita client-side, lista pequena, sem paginação.

export function subscribeApprovedLounges(
  callback: (lounges: Lounge[]) => void,
): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.LOUNGES), where('status', '==', 'approved'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Lounge)),
    (err) => {
      console.error('subscribeApprovedLounges error:', err);
      callback([]);
    },
  );
}

export async function submitLounge(
  input: Omit<Lounge, 'id' | 'status' | 'createdAt'>,
): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.LOUNGES), {
    ...input,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function findUserByUsername(username: string): Promise<UserProfile | null> {
  const q = query(collection(db, COLLECTIONS.USERS), where('username', '==', username), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { uid: d.id, ...d.data() } as UserProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snap.exists() ? ({ uid: snap.id, ...snap.data() } as UserProfile) : null;
}
