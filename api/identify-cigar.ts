import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name } = req.body as { name?: string };
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `You are a master cigar sommelier with encyclopedic knowledge. Identify this cigar and return ONLY valid JSON with no markdown fences. Required keys: name (string), brand (string), origin (country, string), strength (one of: Suave, Médio-Suave, Médio, Médio-Forte, Forte), flavorNotes (array of 3–5 descriptors in Portuguese), curiosities (1–2 sentences in Portuguese about history or distinction). Make your best educated guess if uncertain.

Cigar: "${name}"`,
      },
    ],
  });

  const raw = (message.content[0] as { text: string }).text.trim();

  try {
    return res.status(200).json(JSON.parse(raw));
  } catch {
    return res.status(200).json({
      name,
      brand: name.split(' ')[0],
      origin: 'Cuba',
      strength: 'Médio',
      flavorNotes: ['Madeira', 'Cedro', 'Terra'],
      curiosities: 'Um charuto clássico e apreciado por colecionadores.',
    });
  }
}
