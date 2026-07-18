import type { CigarAIResult, BulkParseItem } from './firebase';

const BASE = process.env.EXPO_PUBLIC_AI_BASE_URL ?? '';

async function post<T>(path: string, body: object): Promise<T> {
  // Timeout: sem ele, um fetch pendurado deixa a UI em loading para sempre.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (controller.signal.aborted) {
      throw new Error('A identificação demorou demais. Verifique sua conexão e tente novamente.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error('Foto muito grande. Tente novamente.');
    }
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function identifyCigar(name: string): Promise<CigarAIResult> {
  return post<CigarAIResult>('/api/identify-cigar', { name });
}

export async function parseBulkText(text: string): Promise<BulkParseItem[]> {
  return post<BulkParseItem[]>('/api/parse-bulk', { text });
}

export async function identifyCigarImage(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<CigarAIResult> {
  return post<CigarAIResult>('/api/identify-cigar-image', { imageBase64, mimeType });
}
