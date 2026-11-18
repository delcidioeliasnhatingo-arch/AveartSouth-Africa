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
  if (Math.floor(data.length * 0.75) > MAX_IMAGE_BYTES) throw new Error(`${label} is too large.`);
  return { mimeType: match[1], data };
}
const BUILT_IN_IMAGE_HOSTS = ['supabase.co', 'supabase.in', 'r2.dev', 'imagedelivery.net', 'aveartgallery.store', 'images.unsplash.com'];
function isAllowedImageHost(hostname: string) {
  const host = hostname.toLowerCase();
  const configured = String(process.env.VIRTUAL_TRYON_ALLOWED_IMAGE_HOSTS || '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
  return [...BUILT_IN_IMAGE_HOSTS, ...configured].some(domain => host === domain || host.endsWith('.' + domain));
}
async function parseGarmentImage(body: any) {
  if (typeof body?.garmentImage === 'string') return parseImage(body.garmentImage, 'The product photo');
  if (typeof body?.garmentImageUrl !== 'string' || body.garmentImageUrl.length > 4096) throw new Error('The product photo is missing.');
  let url: URL;
  try { url = new URL(body.garmentImageUrl); } catch { throw new Error('The product photo URL is invalid.'); }
  if (url.protocol !== 'https:' || !isAllowedImageHost(url.hostname)) throw new Error('The product photo must come from an approved secure AVEART image host.');
  const response = await fetch(url.toString(), { headers: { Accept: 'image/jpeg,image/png,image/webp' }, signal: AbortSignal.timeout(15000), redirect: 'error' });
  if (!response.ok) throw new Error('The selected product photo could not be loaded.');
  const mimeType = String(response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) throw new Error('The product photo must be a JPEG, PNG or WebP image.');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error('The product photo is empty or too large.');
  return { mimeType, data: bytes.toString('base64') };
}
export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed.' }); }
  const forwardedFor = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  const clientKey = forwardedFor || 'unknown-client';
  const now = Date.now(), rate = recentRequests.get(clientKey);
  if (rate && rate.resetAt > now && rate.count >= RATE_LIMIT) return res.status(429).json({ error: 'You have reached the fitting preview limit. Please try again later.' });
  if (!rate || rate.resetAt <= now) recentRequests.set(clientKey, { count: 1, resetAt: now + RATE_WINDOW_MS });
  else recentRequests.set(clientKey, { count: rate.count + 1, resetAt: rate.resetAt });
  if (recentRequests.size > 5000) for (const [key, entry] of recentRequests) { if (entry.resetAt <= now) recentRequests.delete(key); if (recentRequests.size <= 4000) break; }
  const serviceUrl = String(process.env.FASHN_VTON_URL || '').replace(/\\/$/, ''), serviceToken = process.env.FASHN_VTON_TOKEN;
  if (!serviceUrl || !serviceToken) return res.status(503).json({ error: 'The open-source AI fitting service is not connected yet. Live Camera remains available.' });
  try {
    const person = parseImage(req.body?.personImage, 'Your photo'), garment = await parseGarmentImage(req.body);
    const category = ['tops', 'bottoms', 'one-pieces'].includes(req.body?.category) ? req.body.category : 'tops';
    const upstream = await fetch(`${serviceUrl}/v1/try-on`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceToken}` }, body: JSON.stringify({ person_image: person.data, person_mime_type: person.mimeType, garment_image: garment.data, garment_mime_type: garment.mimeType, category }), signal: AbortSignal.timeout(180000) });
    const payload: any = await upstream.json().catch(() => ({}));
    if (!upstream.ok) { console.error('FASHN VTON service error:', upstream.status, payload?.detail || payload?.error || 'unknown'); return res.status(upstream.status === 401 ? 503 : 502).json({ error: 'The open-source fitting service could not complete this preview. Please try again.' }); }
    if (typeof payload?.image !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(payload.image)) return res.status(502).json({ error: 'The fitting service returned an invalid image.' });
    return res.status(200).json({ image: `data:image/jpeg;base64,${payload.image}` });
  } catch (error: any) {
    console.error('AVEART open-source virtual fitting failed:', error?.message || error);
    const message = String(error?.message || '');
    if (/too large|missing|must be a|invalid/i.test(message)) return res.status(400).json({ error: message });
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return res.status(504).json({ error: 'This fitting is taking too long. Please try again.' });
    return res.status(502).json({ error: 'The virtual fitting could not be generated right now. Please try again.' });
  }
}
export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };
