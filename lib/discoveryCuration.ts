import { CigarCatalog, WhiskyCatalog } from '@/lib/firebase';
import { getStrengthBucket } from '@/constants/strength';

// Curadoria 100% client-side e determinística — sem painel admin, sem escrita
// diária no Firestore. Todo usuário no mesmo dia (fuso local) vê o mesmo
// destaque; muda à meia-noite local.

export function getDailySeed(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return date.getFullYear() * 1000 + dayOfYear;
}

function seededPick<T>(items: T[], seed: number): T | null {
  if (items.length === 0) return null;
  return items[seed % items.length];
}

export function getCigarOfTheDay(
  cigars: CigarCatalog[],
  date: Date = new Date(),
): CigarCatalog | null {
  if (cigars.length === 0) return null;
  const sorted = [...cigars].sort((a, b) => a.id.localeCompare(b.id));
  return seededPick(sorted, getDailySeed(date));
}

export interface BrandSpotlight {
  brand: string;
  items: CigarCatalog[];
}

export function getBrandSpotlight(
  cigars: CigarCatalog[],
  date: Date = new Date(),
): BrandSpotlight | null {
  const byBrand = new Map<string, CigarCatalog[]>();
  for (const c of cigars) {
    const list = byBrand.get(c.brand) ?? [];
    list.push(c);
    byBrand.set(c.brand, list);
  }
  const eligible = [...byBrand.entries()]
    .filter(([, items]) => items.length >= 2)
    .sort(([a], [b]) => a.localeCompare(b));
  const picked = seededPick(eligible, getDailySeed(date));
  if (!picked) return null;
  const [brand, items] = picked;
  return { brand, items };
}

export interface CuratedCollection {
  title: string;
  items: CigarCatalog[];
}

// Não seedadas por dia — regras fixas sobre o catálogo, mudam só quando o
// catálogo muda.
export function getCuratedCollections(cigars: CigarCatalog[]): CuratedCollection[] {
  const collections: CuratedCollection[] = [];

  const cuban = cigars.filter((c) => c.origin?.toLowerCase().includes('cuba'));
  if (cuban.length > 0) {
    collections.push({ title: 'Charutos Cubanos Clássicos', items: cuban });
  }

  const beginners = cigars.filter((c) => getStrengthBucket(c.strength) === 'suave');
  if (beginners.length > 0) {
    collections.push({ title: 'Para Iniciantes', items: beginners });
  }

  const strong = cigars.filter((c) => getStrengthBucket(c.strength) === 'forte');
  if (strong.length > 0) {
    collections.push({ title: 'Encorpados e Intensos', items: strong });
  }

  return collections;
}

export interface PairingOfTheDay {
  cigar: CigarCatalog;
  whisky: WhiskyCatalog;
}

export function getPairingOfTheDay(
  cigars: CigarCatalog[],
  whiskies: WhiskyCatalog[],
  date: Date = new Date(),
): PairingOfTheDay | null {
  if (cigars.length === 0 || whiskies.length === 0) return null;
  const seed = getDailySeed(date);
  const sortedCigars = [...cigars].sort((a, b) => a.id.localeCompare(b.id));
  const sortedWhiskies = [...whiskies].sort((a, b) => a.id.localeCompare(b.id));
  const cigar = seededPick(sortedCigars, seed);
  const whisky = seededPick(sortedWhiskies, seed + 1);
  if (!cigar || !whisky) return null;
  return { cigar, whisky };
}
