import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name } = req.body as { name?: string };
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `You are a master cigar sommelier with encyclopedic knowledge. Identify this cigar and return ONLY valid JSON with no markdown fences. Required keys: name (string), brand (string), origin (country, string), strength (one of: Suave, Médio-Suave, Médio, Médio-Forte, Forte), flavorNotes (array of 3–5 descriptors in Portuguese), curiosities (1–2 sentences in Portuguese, a short teaser fact), history (3–5 sentences in Portuguese covering: country/region of origin, founding story of the brand, how this vitola came to exist, notable historical events or awards — for enthusiasts who want depth). Make your best educated guess if uncertain.

Cigar: "${name}"`,
      },
    ],
  });

  const raw = (response.choices[0].message.content ?? '').trim();

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
      history: 'Cuba é reconhecida mundialmente pela qualidade excepcional de seus charutos, cultivados em solos únicos do Vale de Viñales.',
    });
  }
}
