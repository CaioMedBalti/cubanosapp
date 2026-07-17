import { useCallback } from 'react';
import { CIGAR_IMAGE_CATALOG, CigarCatalogEntry } from '@/lib/cigarImages';
import { matchCigar, MatchResult } from '@/lib/matching';

export function useCigarMatching() {
  const match = useCallback((name: string, brand: string): MatchResult<CigarCatalogEntry> => {
    return matchCigar(name, brand, CIGAR_IMAGE_CATALOG);
  }, []);

  return { match };
}
