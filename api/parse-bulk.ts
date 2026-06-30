import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text } = req.body as { text?: string };
  if (!text?.trim()) return res.status(400).json({ error: 'text required' });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a cigar inventory assistant. Parse the following free-text list of cigars into a JSON array. No markdown fences — return ONLY the raw JSON array. Each element must have: cigarName (full cigar name without brand, string), brand (string), quantity (number, default 1 if not specified), status ("intact"). Split brand from name correctly, e.g. "Cohiba Siglo VI" → brand:"Cohiba", cigarName:"Siglo VI". Recognize quantity patterns: x3, ×2, (3), 3x, "três", "3 unidades".

Text:
${text}`,
      },
    ],
  });

  const raw = (message.content[0] as { text: string }).text.trim();

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not array');
    return res.status(200).json(parsed);
  } catch {
    return res.status(422).json({ error: 'Não foi possível interpretar a lista. Tente um formato mais claro.' });
  }
}
