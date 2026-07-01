export type StrengthBucket = 'suave' | 'medio' | 'medio_forte' | 'forte';

// A IA (api/identify-cigar*.ts) normaliza `strength` para um destes 5 valores,
// mas charutos salvos manualmente ou vindos do catálogo podem ter texto livre —
// por isso o fallback por palavra-chave abaixo além do lookup direto.
const DIRECT_LOOKUP: Record<string, StrengthBucket> = {
  'suave': 'suave',
  'medio-suave': 'suave',
  'medio': 'medio',
  'medio-forte': 'medio_forte',
  'forte': 'forte',
};

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function getStrengthBucket(strength: string | null | undefined): StrengthBucket {
  if (!strength) return 'medio';

  const normalized = normalize(strength);
  if (DIRECT_LOOKUP[normalized]) return DIRECT_LOOKUP[normalized];

  const hasForte = normalized.includes('forte');
  const hasMedio = normalized.includes('medio');
  const hasSuave = normalized.includes('suave') || normalized.includes('leve') || normalized.includes('mild') || normalized.includes('light');

  if (hasForte && hasMedio) return 'medio_forte';
  if (hasForte) return 'forte';
  if (hasSuave) return 'suave';
  if (hasMedio) return 'medio';

  return 'medio';
}

export const STRENGTH_GRADIENTS: Record<StrengthBucket, [string, string]> = {
  suave: ['#f5deb3', '#fff8e7'],
  medio: ['#d99a44', '#f5c877'],
  medio_forte: ['#a5551f', '#d97b3f'],
  forte: ['#5c1a1a', '#8f2d2d'],
};

// Gradiente neutro para itens sem match de catálogo (unidentified) — não expressa força.
export const NEUTRAL_GRADIENT: [string, string] = ['#3a3a3a', '#1a1a1a'];
