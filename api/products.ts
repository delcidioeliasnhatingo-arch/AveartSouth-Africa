const PRODUCT_API = "https://aveart-products-public.delcidioeliasnhatingo.workers.dev/api/products";

function descriptionForProduct(product: any): string {
  if (typeof product.description === "string" && product.description.trim()) return product.description.replace(/\\n/g, "\n");
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
  return descriptions.find(([pattern]) => pattern.test(title))?.[1] ||
    "A versatile wardrobe piece selected by AVEART for contemporary everyday style. Easy to combine with your existing wardrobe and suitable for creating polished, effortless outfits.";
}

function inferGender(product: any): string {
  const evidence = [
    product.name, product.title, product.subtitle, product.category,
    product.category_name, product.audience,
    ...(Array.isArray(product.tags) ? product.tags : []),
  ].filter(Boolean).join(" ").toLowerCase().replace(/[_-]+/g, " ");
  if (/\b(unisex|all gender|gender neutral)\b/.test(evidence)) return "unisex";
  if (/\b(women|womens|women's|woman|female|womenswear)\b/.test(evidence)) return "women";
  if (/\b(men|mens|men's|man|male|menswear)\b/.test(evidence)) return "men";
  return "unisex";
}

function asImageList(product: any): string[] {
  const candidates = [
    ...(Array.isArray(product.images) ? product.images : []),
    product.primary_image, product.imageUrl, product.image_url,
    product.thumbnail, product.thumbnail_url,
  ];
  return [...new Set(candidates.filter((value) => typeof value === "string" && value.trim()))] as string[];
}

function normalizeProduct(raw: any, includeGallery = false) {
  const product = { ...raw };
  const images = asImageList(product);
  const variants = Array.isArray(product.variants)
    ? product.variants.map((variant: any) => ({
        ...variant,
        id: String(variant.id ?? variant.variantId ?? `${product.id}-variant`),
        name: variant.name ?? variant.variantName ?? variant.size ?? variant.color ?? "Default",
        size: variant.size ?? "",
        color: variant.color ?? variant.colorName ?? "",
        price_offset: Number(variant.price_offset ?? 0),
        stock_quantity: Number(variant.stock_quantity ?? variant.stock ?? 0),
        image_url: (variant.image_url ?? variant.imageUrl ?? "").startsWith("data:image/") ? "" : (variant.image_url ?? variant.imageUrl ?? ""),
      }))
    : [];
  const variantStock = variants.reduce(
    (sum: number, variant: any) => sum + Math.max(0, Number(variant.stock_quantity) || 0), 0
  );
  const totalStock = Number(product.total_stock ?? product.stock_quantity ?? product.stock ?? product.inventory_quantity ?? 0) || variantStock;
  const title = String(product.title ?? product.name ?? "AVEART Product");
  const slug = String(product.slug ?? title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));

  const cleanProduct = { ...product };
  delete cleanProduct.imageUrl;
  delete cleanProduct.image_url;
  delete cleanProduct.thumbnail;
  delete cleanProduct.thumbnail_url;
  delete cleanProduct.images;
  delete cleanProduct.variants;

  return {
    ...cleanProduct,
    id: String(product.id ?? slug),
    title,
    slug,
    gender: inferGender(product),
    category_name: product.category_name ?? product.category ?? "Clothing",
    category_slug: product.category_slug ?? "clothing",
    description: descriptionForProduct(product),
    images: includeGallery ? images : [],
    primary_image: product.primary_image ?? images[0] ?? "",
    base_price: Number(product.base_price ?? product.price ?? 0),
    total_stock: totalStock,
    variants,
  };
}

export default async function handler(req: any, res: any) {
  try {
    const response = await fetch(PRODUCT_API, { cache: "no-store", headers: { Accept: "application/json", "Cache-Control": "no-cache" } });
    const responseText = await response.text();
    if (!response.ok) throw new Error(`Cloudflare product API returned ${response.status}: ${responseText.slice(0, 500)}`);
    const payload = JSON.parse(responseText);
    const rawProducts = Array.isArray(payload) ? payload : Array.isArray(payload?.products) ? payload.products : Array.isArray(payload?.data) ? payload.data : [];
    let products = rawProducts
      .filter((product: any) => !product.status || ["active", "ativo", "published"].includes(String(product.status).toLowerCase()) || product.is_published === 1 || product.is_published === true)
      .map((product: any) => normalizeProduct(product, false));

    const q = req.query || {};
    if (q.search) {
      const search = String(q.search).toLowerCase();
      products = products.filter((p: any) => `${p.title} ${p.description} ${(p.tags || []).join(" ")}`.toLowerCase().includes(search));
    }
    if (q.category) {
      const category = String(q.category).toLowerCase();
      products = products.filter((p: any) => {
        const evidence = `${p.category_slug || ""} ${p.category_id || ""} ${p.category_name || ""} ${p.category || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
        return evidence.includes(category) || (category === "accessories" && /bag|accessor|jewell?ery|belt|wallet/.test(evidence));
      });
    }
    if (q.gender && q.gender !== "all") products = products.filter((p: any) => p.gender === String(q.gender));
    if (q.inStockOnly === "true") products = products.filter((p: any) => Number(p.total_stock ?? 0) > 0);
    if (q.onSale === "true") products = products.filter((p: any) => p.is_on_sale === 1 || p.onSale === true);
    if (q.minPrice) products = products.filter((p: any) => Number(p.base_price ?? 0) >= Number(q.minPrice));
    if (q.maxPrice) products = products.filter((p: any) => Number(p.base_price ?? 0) <= Number(q.maxPrice));
    if (q.sort === "price_asc") products.sort((a: any, b: any) => a.base_price - b.base_price);
    else if (q.sort === "price_desc") products.sort((a: any, b: any) => b.base_price - a.base_price);
    else products.sort((a: any, b: any) => Number(b.is_featured ?? b.featured ?? 0) - Number(a.is_featured ?? a.featured ?? 0));

    res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
    res.setHeader("CDN-Cache-Control", "no-store");
    return res.status(200).json(products);
  } catch (error: any) {
    console.error("AVEART products upstream request failed:", error?.message || error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "Unable to load AVEART products.", details: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined });
  }
}
