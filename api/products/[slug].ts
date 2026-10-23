const PRODUCT_API = "https://aveart-api.delcidioeliasnhatingo.workers.dev/api/products";

export default async function handler(req: any, res: any) {
  try {
    const slug = String(req.query?.slug || "");
    if (!slug) return res.status(400).json({ error: "Product slug is required." });

    // Use the same Cloudflare D1-backed catalogue as the catalogue and homepage.
    // The previous implementation queried the retired Medusa backend, so products
    // created in the Cloudflare admin panel could not open their detail page.
    const response = await fetch(PRODUCT_API, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Cloudflare product API returned ${response.status}`);

    const data = await response.json();
    const products = Array.isArray(data) ? data : [];
    const product = products.find((p: any) =>
      String(p.slug || "") === slug ||
      String(p.id || "") === slug ||
      String(p.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === slug
    );

    if (!product) return res.status(404).json({ error: "Product not found in the AVEART catalogue." });

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    return res.status(200).json(product);
  } catch (error: any) {
    return res.status(502).json({
      error: "Unable to load the AVEART product.",
      details: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined,
    });
  }
}
