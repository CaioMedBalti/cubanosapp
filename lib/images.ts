import type { ImageSourcePropType } from 'react-native';
import type { HumidorEntry } from './firebase';
import { CIGAR_IMAGE_MAP } from './cigarImages';

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
