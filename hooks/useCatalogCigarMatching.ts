import { useCallback, useEffect, useState } from 'react';
import { CigarCatalog } from '@/lib/firebase';
import { getCigars } from '@/lib/firestore';
import { matchCigar, MatchResult } from '@/lib/matching';

// Matching contra a coleção `cigars` do Firestore (ids reais de doc — o que a
// coleção scans referencia em suggestedCigarId). O catálogo local de imagens
// (useCigarMatching) segue existindo só para thumbnails via imageKey.
export function useCatalogCigarMatching() {
  const [catalog, setCatalog] = useState<CigarCatalog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCigars()
      .then(setCatalog)
      .finally(() => setLoading(false));
  }, []);

  const match = useCallback(
    (name: string, brand: string): MatchResult<CigarCatalog> => {
      return matchCigar(name, brand, catalog);
    },
    [catalog],
  );

  return { match, catalog, loading };
}
