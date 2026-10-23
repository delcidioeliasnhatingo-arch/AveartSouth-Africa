const PRODUCT_API = "https://aveart-api.delcidioeliasnhatingo.workers.dev/api/products";

function normalizeProduct(raw: any) {
  const product = { ...raw };
  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant: any) => ({
        ...variant,
        stock_quantity: Number(variant.stock_quantity ?? variant.stock ?? 0),
        price_offset: Number(
          variant.price_offset ??
          (variant.price != null
            ? Number(variant.price) - Number(product.base_price ?? product.price ?? 0)
            : 0)
        ),
      }))
    : [];

  // The admin panel stores inventory as "stock", while the storefront reads
  // "total_stock" and variant "stock_quantity". Normalize both schemas so
  // available products are not incorrectly marked Sold Out.
  const variantStock = variants.reduce(
    (sum: number, variant: any) => sum + Math.max(0, Number(variant.stock_quantity) || 0),
    0
  );
  const declaredTotal = Number(product.total_stock ?? 0);
  const adminStock = Number(product.stock ?? 0);
  const totalStock =
    declaredTotal > 0 ? declaredTotal :
    adminStock > 0 ? adminStock :
    variantStock;

  return {
    ...product,
    title: product.title ?? product.name ?? "",
    base_price: Number(product.base_price ?? product.price ?? 0),
    total_stock: totalStock,
    variants,
  };
}

export default async function handler(req: any, res: any) {
  try {
    const response = await fetch(PRODUCT_API, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Cloudflare product API returned ${response.status}`);
    const data = await response.json();
    const q = req.query || {};
    // Cloudflare API already returns active products. Do not require the legacy Medusa
    // is_published field, which is not part of the AVEART Cloudflare product schema.
    let products = (Array.isArray(data) ? data : []).map(normalizeProduct);
    if (q.search) { const s = String(q.search).toLowerCase(); products = products.filter((p: any) => `${p.title || p.name || ""} ${p.description || ""} ${(p.tags || []).join(" ")}`.toLowerCase().includes(s)); }
    if (q.category) products = products.filter((p: any) => p.category_slug === String(q.category) || p.category_id === String(q.category) || p.category === String(q.category));
    if (q.gender && q.gender !== "all") products = products.filter((p: any) => p.gender === String(q.gender));
    if (q.inStockOnly === "true") products = products.filter((p: any) => Number(p.total_stock ?? 0) > 0);
    if (q.onSale === "true") products = products.filter((p: any) => p.is_on_sale === 1 || p.onSale === true);
    if (q.minPrice) products = products.filter((p: any) => Number(p.base_price ?? 0) >= Number(q.minPrice));
    if (q.maxPrice) products = products.filter((p: any) => Number(p.base_price ?? 0) <= Number(q.maxPrice));
    if (q.sort === "price_asc") products.sort((a: any, b: any) => Number(a.base_price ?? 0) - Number(b.base_price ?? 0));
    else if (q.sort === "price_desc") products.sort((a: any, b: any) => Number(b.base_price ?? 0) - Number(a.base_price ?? 0));
    else products.sort((a: any, b: any) => Number(b.is_featured ?? b.featured ?? 0) - Number(a.is_featured ?? a.featured ?? 0));
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json(products);
  } catch (error: any) {
    res.status(502).json({ error: "Unable to load AVEART products.", details: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined });
  }
}
