const PRODUCT_API = "https://aveart-api.delcidioeliasnhatingo.workers.dev/api/products";

export default async function handler(req: any, res: any) {
  try {
    const response = await fetch(PRODUCT_API, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Cloudflare product API returned ${response.status}`);
    const data = await response.json();
    const q = req.query || {};
    // Cloudflare API already returns active products. Do not require the legacy Medusa
    // is_published field, which is not part of the AVEART Cloudflare product schema.
    let products = Array.isArray(data) ? data : [];
    if (q.search) { const s = String(q.search).toLowerCase(); products = products.filter((p: any) => `${p.title || p.name || ""} ${p.description || ""} ${(p.tags || []).join(" ")}`.toLowerCase().includes(s)); }
    if (q.category) products = products.filter((p: any) => p.category_slug === String(q.category) || p.category_id === String(q.category) || p.category === String(q.category));
    if (q.gender && q.gender !== "all") products = products.filter((p: any) => p.gender === String(q.gender));
    if (q.inStockOnly === "true") products = products.filter((p: any) => Number(p.total_stock ?? p.stock ?? 0) > 0);
    if (q.onSale === "true") products = products.filter((p: any) => p.is_on_sale === 1 || p.onSale === true);
    if (q.minPrice) products = products.filter((p: any) => Number(p.base_price ?? p.price ?? 0) >= Number(q.minPrice));
    if (q.maxPrice) products = products.filter((p: any) => Number(p.base_price ?? p.price ?? 0) <= Number(q.maxPrice));
    if (q.sort === "price_asc") products.sort((a: any, b: any) => Number(a.base_price ?? a.price ?? 0) - Number(b.base_price ?? b.price ?? 0));
    else if (q.sort === "price_desc") products.sort((a: any, b: any) => Number(b.base_price ?? b.price ?? 0) - Number(a.base_price ?? a.price ?? 0));
    else products.sort((a: any, b: any) => Number(b.is_featured ?? b.featured ?? 0) - Number(a.is_featured ?? a.featured ?? 0));
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json(products);
  } catch (error: any) {
    res.status(502).json({ error: "Unable to load AVEART products.", details: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined });
  }
}
