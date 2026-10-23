const PRODUCT_API = "https://aveart-api.delcidioeliasnhatingo.workers.dev/api/products";

export default async function handler(req: any, res: any) {
  try {
    const slug = String(req.query?.slug || "");
    const response = await fetch(PRODUCT_API, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Cloudflare product API returned ${response.status}`);

    const data = await response.json();
    const products = (Array.isArray(data) ? data : [])
      .filter((p: any) => p.is_published === 1 && String(p.slug || "") !== slug)
      .slice(0, 4);

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json(products);
  } catch (error: any) {
    return res.status(502).json({
      error: "Unable to load AVEART product recommendations.",
      details: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined,
    });
  }
}
