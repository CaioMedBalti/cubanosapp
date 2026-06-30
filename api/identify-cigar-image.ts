import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { imageBase64, mimeType } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: 'imageBase64 and mimeType required' });
  }

  const validMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
  type ValidMime = typeof validMime[number];
  if (!validMime.includes(mimeType as ValidMime)) {
    return res.status(400).json({ error: 'unsupported mimeType' });
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as ValidMime,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: 'This is a photo of a cigar band (anilha). Identify the cigar and return ONLY valid JSON with no markdown fences. Required keys: name (string), brand (string), origin (country), strength (one of: Suave, Médio-Suave, Médio, Médio-Forte, Forte), flavorNotes (array of 3–5 in Portuguese), curiosities (1–2 sentences in Portuguese). Make your best inference if the image is unclear.',
          },
        ],
      },
    ],
  });

  const raw = (message.content[0] as { text: string }).text.trim();

  try {
    return res.status(200).json(JSON.parse(raw));
  } catch {
    return res.status(422).json({ error: 'Não foi possível identificar o charuto pela imagem.' });
  }
}
