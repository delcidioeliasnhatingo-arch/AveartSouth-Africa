const PRODUCT_API = "https://aveart-api.delcidioeliasnhatingo.workers.dev/api/products";

export default async function handler(_req: any, res: any) {
  try {
    const response = await fetch(PRODUCT_API, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Cloudflare product API returned ${response.status}`);
    const products = await response.json() as any[];
    const map = new Map<string, any>();
    for (const product of (Array.isArray(products) ? products : []).filter((p) => p.is_published === 1)) {
      const slug = product.category_slug || "clothing";
      if (!map.has(slug)) map.set(slug, { id: product.category_id || slug, name: product.category_name || "Clothing", slug, description: "", image_url: product.primary_image || "", gender: "women", sort_order: map.size, product_count: 0 });
      map.get(slug).product_count += 1;
      if (!map.get(slug).image_url && product.primary_image) map.get(slug).image_url = product.primary_image;
    }
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json(Array.from(map.values()));
  } catch (error: any) {
    res.status(502).json({ error: "Unable to load AVEART categories.", details: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined });
  }
}
