const PRODUCT_API = "https://aveart-products-public.delcidioeliasnhatingo.workers.dev/api/products";

function descriptionForProduct(product: any): string {
  if (typeof product.description === "string" && product.description.trim()) return product.description;
  const title = String(product.title ?? product.name ?? "").toLowerCase();
  const descriptions: Array<[RegExp, string]> = [
    [/suede.*t.?shirt/, "A modern everyday T-shirt with a soft suede-inspired finish and a relaxed silhouette. Easy to style with denim, tailored trousers or layered streetwear looks."],
    [/2.?piece.*set|set.*2.?piece|lounge.*set/, "A coordinated two-piece outfit designed for effortless styling. Wear the pieces together for a polished matching look or separately to create more outfits."],
    [/wide.?leg.*drawstring|drawstring.*pant/, "Relaxed wide-leg trousers with an adjustable drawstring waist for everyday comfort. Pair with a fitted top, T-shirt or lightweight knit."],
    [/slogan.*oversized|oversized.*slogan/, "An oversized statement T-shirt with a streetwear-inspired slogan. Its relaxed shape works well with wide-leg trousers, denim and sneakers."],
    [/wide.?leg trouser|wide.?leg pant/, "Wide-leg trousers with a clean, contemporary shape. Style them with a tucked-in shirt or a simple fitted top for an elevated everyday outfit."],
    [/old money.*set|premium.*set/, "A refined matching set inspired by understated, timeless style. The coordinated pieces create an elegant look with minimal effort."],
    [/straight.?leg jean|jean/, "Classic straight-leg denim designed for versatile everyday wear. Style with a T-shirt and sneakers for casual outfits or a shirt for a smarter finish."],
    [/jogger|relaxed.?fit pant/, "Relaxed-fit jogger trousers made for comfortable casual styling. Pair with a basic tee, sweatshirt or lightweight jacket."],
    [/printed jacket|jacket/, "A statement jacket that adds texture and personality to everyday outfits. Layer it over a simple top with denim or neutral trousers."],
    [/casual shirt|striped.*shirt|shirt/, "A versatile shirt with a contemporary casual finish. Wear it buttoned with tailored trousers or open over a basic top for easy layering."],
    [/letter print.*t.?shirt|t.?shirt/, "A versatile graphic T-shirt that brings a modern touch to everyday outfits. Pair with jeans, joggers or tailored trousers for an easy casual look."],
    [/trouser|pant/, "Contemporary trousers with a versatile silhouette for work, weekends and everyday styling. Pair with a shirt, blouse or simple T-shirt."],
  ];
  const match = descriptions.find(([pattern]) => pattern.test(title));
  return match?.[1] || "A versatile wardrobe piece selected by AVEART for contemporary everyday style. Easy to combine with your existing wardrobe and suitable for creating polished, effortless outfits.";
}

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
    image_url: (variant.image_url ?? variant.imageUrl ?? "").startsWith("data:image/") ? "" : (variant.image_url ?? variant.imageUrl ?? ""),
  }));
  const variantStock = variants.reduce((sum: number, variant: any) => sum + Math.max(0, Number(variant.stock_quantity) || 0), 0);
  const declaredStock = Number(product.total_stock ?? product.stock_quantity ?? product.stock ?? product.inventory_quantity ?? 0);
  const totalStock = declaredStock > 0 ? declaredStock : variantStock;
  const cleanProduct = { ...product };
  delete cleanProduct.imageUrl;
  delete cleanProduct.image_url;
  delete cleanProduct.thumbnail;
  delete cleanProduct.thumbnail_url;
  delete cleanProduct.images;
  delete cleanProduct.variants;
  const normalized = {
    ...cleanProduct,
    title: product.title ?? product.name ?? "",
    description: descriptionForProduct(product),
    images: Array.isArray(product.images) ? product.images.filter((image: any) => typeof image === "string" && image.trim()) : (product.imageUrl || product.image_url ? [product.imageUrl || product.image_url] : []),
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
    let product = products.find((p: any) =>
      String(p.slug || "") === slug ||
      String(p.id || "") === slug ||
      String(p.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === slug
    );

    if (!product) return res.status(404).json({ error: "Product not found in the AVEART catalogue." });

    const detailResponse = await fetch(`${PRODUCT_API}/${encodeURIComponent(String(product.id))}`, { headers: { Accept: "application/json" } });
    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      product = normalizeProduct(detailData);
    }

    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=600");
    return res.status(200).json(product);
  } catch (error: any) {
    return res.status(502).json({
      error: "Unable to load the AVEART product.",
      details: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined,
    });
  }
}
