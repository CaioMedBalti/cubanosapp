import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { imageBase64, mimeType } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: 'imageBase64 and mimeType required' });
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` },
          },
          {
            type: 'text',
            text: 'This is a photo of a cigar band (anilha). Identify the cigar and return ONLY valid JSON with no markdown fences. Required keys: name (string), brand (string), origin (country), strength (one of: Suave, Médio-Suave, Médio, Médio-Forte, Forte), flavorNotes (array of 3–5 in Portuguese), curiosities (1–2 sentences in Portuguese). Make your best inference if the image is unclear.',
          },
        ],
      },
    ],
  });

  const raw = (response.choices[0].message.content ?? '').trim();

  try {
    return res.status(200).json(JSON.parse(raw));
  } catch {
    return res.status(422).json({ error: 'Não foi possível identificar o charuto pela imagem.' });
  }
}
