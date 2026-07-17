export function normalizeString(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }

  return dp[n];
}

export function similarityScore(a: string, b: string): number {
  const na = normalizeString(a);
  const nb = normalizeString(b);
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(na, nb) / maxLen;
}

// Confiança mínima para considerar um match "fuzzy" (abaixo disso, sem match).
export const FUZZY_MATCH_THRESHOLD = 0.72;

// Genérico: funciona tanto sobre o catálogo local de imagens (CigarCatalogEntry)
// quanto sobre a coleção cigars do Firestore (CigarCatalog) — só usa name/brand.
export type MatchResult<T extends { name: string; brand: string }> =
  | { type: 'exact'; entry: T }
  | { type: 'fuzzy'; entry: T; confidence: number }
  | { type: 'none' };

export function matchCigar<T extends { name: string; brand: string }>(
  name: string,
  brand: string,
  catalog: T[],
): MatchResult<T> {
  const inputCombined = normalizeString(`${brand} ${name}`);

  let best: { entry: T; score: number } | null = null;

  for (const entry of catalog) {
    // O catálogo local às vezes já inclui a marca dentro de `name`
    // (ex: name "Cohiba Siglo VI", brand "Cohiba") e às vezes não
    // (ex: name "Undercrown Shade", brand "Drew Estate (Undercrown)") —
    // evita concatenar a marca duas vezes quando ela já está embutida no nome.
    const entryName = normalizeString(entry.name);
    const entryBrand = normalizeString(entry.brand);
    const entryCombined = entryName.startsWith(entryBrand)
      ? entryName
      : normalizeString(`${entry.brand} ${entry.name}`);

    if (entryCombined === inputCombined) {
      return { type: 'exact', entry };
    }

    const score = similarityScore(inputCombined, entryCombined);
    if (!best || score > best.score) {
      best = { entry, score };
    }
  }

  if (best && best.score >= FUZZY_MATCH_THRESHOLD) {
    return { type: 'fuzzy', entry: best.entry, confidence: best.score };
  }

  return { type: 'none' };
}
