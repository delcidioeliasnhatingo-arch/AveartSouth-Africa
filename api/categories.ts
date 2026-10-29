const PRODUCT_API = "https://aveart-products-public.delcidioeliasnhatingo.workers.dev/api/products";

export default async function handler(_req: any, res: any) {
  try {
    const response = await fetch(PRODUCT_API, { next: { revalidate: 300 }, headers: { Accept: "application/json" } } as any);
    if (!response.ok) throw new Error(`Cloudflare product API returned ${response.status}`);
    const payload = await response.json() as any;
    const products = Array.isArray(payload) ? payload : Array.isArray(payload?.products) ? payload.products : Array.isArray(payload?.data) ? payload.data : [];
    const activeProducts = products.filter((p: any) => !p.status || ["active", "ativo", "published"].includes(String(p.status).toLowerCase()) || p.is_published === 1 || p.is_published === true);
    const map = new Map<string, any>();
    for (const product of activeProducts) {
      const slug = String(product.category_slug || product.category_id || product.category || "clothing").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!map.has(slug)) {
        map.set(slug, {
          id: product.category_id || slug,
          name: product.category_name || product.category || "Clothing",
          slug,
          description: "",
          image_url: product.primary_image || product.imageUrl || product.image_url || (Array.isArray(product.images) ? product.images[0] : "") || "",
          gender: product.gender || "unisex",
          sort_order: map.size,
          product_count: 0,
        });
      }
      map.get(slug).product_count += 1;
      if (!map.get(slug).image_url) {
        map.get(slug).image_url = product.primary_image || product.imageUrl || product.image_url || (Array.isArray(product.images) ? product.images[0] : "") || "";
      }
    }
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");
    res.setHeader("CDN-Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");
    return res.status(200).json(Array.from(map.values()));
  } catch (error: any) {
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "Unable to load AVEART categories.", details: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined });
  }
}
