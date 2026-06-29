import { useEffect, useState } from 'react';
import { CigarCatalog, WhiskyCatalog } from '@/lib/firebase';
import { getCigars, getWhiskies } from '@/lib/firestore';

export type CatalogItem =
  | ({ itemType: 'cigar' } & CigarCatalog)
  | ({ itemType: 'whisky' } & WhiskyCatalog);

export function useCatalog() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCigars(), getWhiskies()]).then(([cigars, whiskies]) => {
      setItems([
        ...cigars.map((c) => ({ ...c, itemType: 'cigar' as const })),
        ...whiskies.map((w) => ({ ...w, itemType: 'whisky' as const })),
      ]);
      setLoading(false);
    });
  }, []);

  return { items, loading };
}
