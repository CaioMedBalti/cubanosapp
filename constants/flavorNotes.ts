// Chips de notas de degustação usados na avaliação pós-scan e na degustação
// ao vivo (por terço). Lista fixa e curada — texto livre vai no comentário.
export const FLAVOR_NOTES = [
  'Cedro',
  'Café',
  'Couro',
  'Cacau',
  'Terra',
  'Pimenta',
  'Mel',
  'Amêndoa',
  'Frutas secas',
  'Creme',
  'Baunilha',
  'Defumado',
] as const;

export type FlavorNote = (typeof FLAVOR_NOTES)[number];

// Escala de força percebida por terço na degustação ao vivo — mesmos valores
// normalizados que a IA usa (constants/strength.ts DIRECT_LOOKUP).
export const STRENGTH_FELT_OPTIONS: {
  value: 'suave' | 'medio-suave' | 'medio' | 'medio-forte' | 'forte';
  label: string;
}[] = [
  { value: 'suave', label: 'Suave' },
  { value: 'medio-suave', label: 'Médio-Suave' },
  { value: 'medio', label: 'Médio' },
  { value: 'medio-forte', label: 'Médio-Forte' },
  { value: 'forte', label: 'Forte' },
];
