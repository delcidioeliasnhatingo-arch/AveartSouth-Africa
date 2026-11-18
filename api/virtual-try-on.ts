import { GoogleGenAI } from '@google/genai';

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const recentRequests = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 10;

function parseImage(value: unknown, label: string) {
  if (typeof value !== 'string') throw new Error(`${label} is missing.`);
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match || !ALLOWED_MIME_TYPES.has(match[1])) throw new Error(`${label} must be a JPEG, PNG or WebP image.`);
  const data = match[2];
  const estimatedBytes = Math.floor(data.length * 0.75);
  if (estimatedBytes > MAX_IMAGE_BYTES) throw new Error(`${label} is too large. Please use a smaller image.`);
  return { mimeType: match[1], data };
}

const BUILT_IN_IMAGE_HOSTS = [
  'supabase.co',
  'supabase.in',
  'r2.dev',
  'imagedelivery.net',
  'aveartgallery.store',
  'images.unsplash.com',
];

function isAllowedImageHost(hostname: string) {
  const host = hostname.toLowerCase();
  const configured = String(process.env.VIRTUAL_TRYON_ALLOWED_IMAGE_HOSTS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return [...BUILT_IN_IMAGE_HOSTS, ...configured].some(
    (domain) => host === domain || host.endsWith('.' + domain)
  );
}

async function parseGarmentImage(body: any) {
  if (typeof body?.garmentImage === 'string') {
    return parseImage(body.garmentImage, 'The product photo');
  }

  const rawUrl = body?.garmentImageUrl;
  if (typeof rawUrl !== 'string' || rawUrl.length > 4096) {
    throw new Error('The product photo is missing.');
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('The product photo URL is invalid.');
  }
  if (url.protocol !== 'https:' || !isAllowedImageHost(url.hostname)) {
    throw new Error('The product photo must come from an approved secure AVEART image host.');
  }

  let currentUrl = url;
  let response: Response | null = null;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    response = await fetch(currentUrl.toString(), {
      headers: { Accept: 'image/jpeg,image/png,image/webp' },
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get('location');
    if (!location || redirectCount === 3) {
      throw new Error('The product photo redirected too many times.');
    }
    const nextUrl = new URL(location, currentUrl);
    if (nextUrl.protocol !== 'https:' || !isAllowedImageHost(nextUrl.hostname)) {
      throw new Error('The product photo redirected to an unapproved image host.');
    }
    currentUrl = nextUrl;
  }
  if (!response || !response.ok) throw new Error('The selected product photo could not be loaded.');
  if (currentUrl.protocol !== 'https:' || !isAllowedImageHost(currentUrl.hostname)) {
    throw new Error('The product photo must come from an approved secure AVEART image host.');
  }

  const mimeType = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error('The product photo must be a JPEG, PNG or WebP image.');
  }
  const declaredSize = Number(response.headers.get('content-length') || 0);
  if (declaredSize > MAX_IMAGE_BYTES) throw new Error('The product photo is too large.');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) throw new Error('The product photo is empty or too large.');
  return { mimeType, data: bytes.toString('base64') };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const forwardedFor = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  const clientKey = forwardedFor || 'unknown-client';
  const now = Date.now();
  const rate = recentRequests.get(clientKey);
  if (rate && rate.resetAt > now && rate.count >= RATE_LIMIT) {
    return res.status(429).json({ error: 'You have reached the fitting preview limit. Please try again in a little while.' });
  }
  if (!rate || rate.resetAt <= now) recentRequests.set(clientKey, { count: 1, resetAt: now + RATE_WINDOW_MS });
  else recentRequests.set(clientKey, { count: rate.count + 1, resetAt: rate.resetAt });
  if (recentRequests.size > 5000) {
    for (const [key, entry] of recentRequests) {
      if (entry.resetAt <= now) recentRequests.delete(key);
      if (recentRequests.size <= 4000) break;
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'The AVEART AI fitting service is not configured yet. Please try again later.' });

  try {
    const person = parseImage(req.body?.personImage, 'Your photo');
    const garment = await parseGarmentImage(req.body);
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


export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb',
    },
  },
};
