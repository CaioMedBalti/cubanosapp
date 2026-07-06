import type { ImageSourcePropType } from 'react-native';
import type { HumidorEntry } from './firebase';
import { CIGAR_IMAGE_MAP, CIGAR_IMAGE_CATALOG } from './cigarImages';
import { matchCigar } from './matching';

export interface CigarImageResult {
  source: ImageSourcePropType;
  // true = PNG transparente do catálogo local (bom para compor sobre um gradiente);
  // false = foto opaca do usuário/stock (deve cobrir o card, sem gradiente por trás).
  isCatalogImage: boolean;
}

// Hierarquia de imagem para um item do Humidor:
// 1. catálogo local (cigarId casado com assets/charutos/cigar-mapping.json)
// 2. foto do próprio usuário (upload manual ou stock do Firebase Storage)
// 3. null — o chamador deve renderizar <GenericCigarPlaceholder />
export function getCigarImage(
  entry: Pick<HumidorEntry, 'cigarId' | 'photoUrl'>,
): CigarImageResult | null {
  if (entry.cigarId && CIGAR_IMAGE_MAP[entry.cigarId]) {
    return { source: CIGAR_IMAGE_MAP[entry.cigarId], isCatalogImage: true };
  }
  if (entry.photoUrl) {
    return { source: { uri: entry.photoUrl }, isCatalogImage: false };
  }
  return null;
}

export function getCigarDisplayImage(
  entry: Pick<HumidorEntry, 'cigarId' | 'photoUrl'>,
): ImageSourcePropType | null {
  return getCigarImage(entry)?.source ?? null;
}

// Imagem para um item do catálogo Firestore (Discover/Charuto do Dia):
// 1. imageKey direto (docs criados pelo scripts/seed-catalog.js)
// 2. fuzzy match por marca+nome (docs antigos sem imageKey)
// 3. null — o chamador renderiza o placeholder
export function getCatalogItemImage(item: {
  imageKey?: string | null;
  name: string;
  brand: string;
}): ImageSourcePropType | null {
  if (item.imageKey && CIGAR_IMAGE_MAP[item.imageKey]) {
    return CIGAR_IMAGE_MAP[item.imageKey];
  }
  const match = matchCigar(item.name, item.brand, CIGAR_IMAGE_CATALOG);
  return match.type === 'none' ? null : match.entry.image;
}
