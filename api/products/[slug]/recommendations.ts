const PRODUCT_API = "https://aveart-products-public.delcidioeliasnhatingo.workers.dev/api/products";

export default async function handler(req: any, res: any) {
  try {
    const slug = String(req.query?.slug || "");
    const response = await fetch(PRODUCT_API, { next: { revalidate: 120 }, headers: { Accept: "application/json" } } as any);
    if (!response.ok) throw new Error(`Cloudflare product API returned ${response.status}`);

    const data = await response.json();
    const products = (Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : Array.isArray(data?.data) ? data.data : [])
      .filter((p: any) => {
        const active = !p.status || ["active", "ativo", "published"].includes(String(p.status).toLowerCase()) || p.is_published === 1 || p.is_published === true;
        return active && String(p.slug || "") !== slug;
      })
      .slice(0, 4);

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");
    return res.status(200).json(products);
  } catch (error: any) {
    return res.status(502).json({
      error: "Unable to load AVEART product recommendations.",
      details: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined,
    });
  }
}
