import { GoogleGenAI } from '@google/genai';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function parseImage(value: unknown, label: string) {
  if (typeof value !== 'string') throw new Error(`${label} is missing.`);
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match || !ALLOWED_MIME_TYPES.has(match[1])) throw new Error(`${label} must be a JPEG, PNG or WebP image.`);
  const data = match[2];
  const estimatedBytes = Math.floor(data.length * 0.75);
  if (estimatedBytes > MAX_IMAGE_BYTES) throw new Error(`${label} is too large. Please use a smaller image.`);
  return { mimeType: match[1], data };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'The AVEART AI fitting service is not configured yet. Please try again later.' });

  try {
    const person = parseImage(req.body?.personImage, 'Your photo');
    const garment = parseImage(req.body?.garmentImage, 'The product photo');
    const productName = String(req.body?.productName || 'the selected AVEART garment').slice(0, 120);

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: [
        { inlineData: { mimeType: person.mimeType, data: person.data } },
        { inlineData: { mimeType: garment.mimeType, data: garment.data } },
        `Create a photorealistic virtual fashion try-on image. Image 1 is the customer and must remain the same person. Image 2 is the exact AVEART product garment named "${productName}". Dress the person in that exact garment. Preserve the person's identity, face, skin tone, hair, body proportions, pose, hands, and the original background. Preserve the garment faithfully: exact colour, pattern, print, fabric appearance, cut, silhouette, length, neckline, sleeves, seams, stitching, buttons, pockets, zips, logos and every visible detail. Do not redesign, embellish, simplify, recolour, add accessories, or invent details. Only change the clothing area required to show the selected product being worn. Keep the result natural, realistic and anatomically correct. If the product image does not show enough detail, do not invent missing design features. Return one edited image, not a collage, and do not add text or watermarks.`,
      ],
      config: { responseModalities: ['IMAGE', 'TEXT'] },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((part: any) => part.inlineData?.data && part.inlineData?.mimeType?.startsWith('image/'));
    if (!imagePart?.inlineData?.data) {
      console.error('AVEART virtual try-on returned no image output.');
      return res.status(502).json({ error: 'The AI could not create this fitting. Try a clearer full-body photo.' });
    }

    return res.status(200).json({
      image: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
    });
  } catch (error: any) {
    console.error('AVEART virtual fitting failed:', error?.message || error);
    const message = String(error?.message || '');
    if (/too large|missing|must be a/i.test(message)) return res.status(400).json({ error: message });
    return res.status(502).json({ error: 'The virtual fitting could not be generated right now. Please try again.' });
  }
}
