const PRODUCT_API = "https://aveart-api.delcidioeliasnhatingo.workers.dev/api/products";

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
    description: descriptionForProduct(product),
    images: Array.isArray(product.images) ? product.images : (product.imageUrl || product.image_url ? [product.imageUrl || product.image_url] : []),
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
