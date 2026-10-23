const PRODUCT_API = "https://aveart-api.delcidioeliasnhatingo.workers.dev/api/products";

function normalizeProduct(raw: any) {
  const product = { ...raw };
  const sourceVariants = Array.isArray(product.variants) ? product.variants : [];
  const variants = sourceVariants.map((variant: any) => ({
    ...variant,
    id: String(variant.id ?? variant.variantId ?? `${product.id}-variant`),
    name: variant.name ?? variant.variantName ?? variant.size ?? variant.color ?? "Default",
    size: variant.size ?? "",
    color: variant.color ?? variant.colorName ?? "",
    price_offset: Number(variant.price_offset ?? 0),
    stock_quantity: Number(variant.stock_quantity ?? variant.stock ?? 0),
    low_stock_threshold: Number(variant.low_stock_threshold ?? 3),
    image_url: variant.image_url ?? variant.imageUrl ?? "",
  }));
  const variantStock = variants.reduce((sum: number, variant: any) => sum + Math.max(0, Number(variant.stock_quantity) || 0), 0);
  const declaredStock = Number(product.total_stock ?? product.stock_quantity ?? product.stock ?? product.inventory_quantity ?? 0);
  const totalStock = declaredStock > 0 ? declaredStock : variantStock;
  const normalized = {
    ...product,
    title: product.title ?? product.name ?? "",
    slug: product.slug ?? String(product.name ?? product.title ?? product.id ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    base_price: Number(product.base_price ?? product.price ?? 0),
    primary_image: product.primary_image ?? product.imageUrl ?? product.image_url ?? (Array.isArray(product.images) ? product.images[0] : ""),
    total_stock: totalStock,
    variants,
  };

  // Admin products can have stock at product level without size/color variants.
  // Create a default purchasable variant so the detail page does not falsely say Sold Out.
  if (normalized.variants.length === 0 && totalStock > 0) {
    normalized.variants = [{
      id: String(product.id),
      product_id: String(product.id),
      sku: product.sku ?? String(product.id),
      name: "Default",
      size: "",
      color: "",
      price_offset: 0,
      stock_quantity: totalStock,
      low_stock_threshold: 3,
      image_url: normalized.primary_image,
    }];
  }
  return normalized;
}

export default async function handler(req: any, res: any) {
  try {
    const slug = String(req.query?.slug || "");
    if (!slug) return res.status(400).json({ error: "Product slug is required." });

    const response = await fetch(PRODUCT_API, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Cloudflare product API returned ${response.status}`);

    const data = await response.json();
    const products = (Array.isArray(data) ? data : []).map(normalizeProduct);
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
