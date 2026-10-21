const BACKEND = (process.env.MEDUSA_BACKEND_URL || "https://medusa-v2-railway.vercel.app").replace(/\/$/, "");

export async function medusa(path: string) {
  const response = await fetch(`${BACKEND}${path}`, { headers: { Accept: "application/json" } });
  const text = await response.text();
  let body: any;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  if (!response.ok) {
    const error: any = new Error(body?.message || `Medusa API returned ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

const amount = (variant: any) => {
  const price = variant?.calculated_price?.calculated_amount ?? variant?.prices?.find((p: any) => p.currency_code === "zar")?.amount ?? variant?.prices?.[0]?.amount ?? 0;
  return Number(price) / 100;
};

export function mapProduct(p: any) {
  const variants = (p.variants || []).map((v: any) => ({
    id: v.id, product_id: p.id, sku: v.sku || "",
    name: v.title || v.options?.map((o: any) => o.value).filter(Boolean).join(" / ") || "Default",
    size: v.options?.find((o: any) => /size/i.test(o.option?.title || ""))?.value,
    color: v.options?.find((o: any) => /colou?r/i.test(o.option?.title || ""))?.value,
    price_offset: 0,
    stock_quantity: v.manage_inventory ? Math.max(0, Number(v.inventory_quantity || 0)) : 999,
    low_stock_threshold: 3, image_url: v.thumbnail || p.thumbnail || p.images?.[0]?.url || "",
    created_at: v.created_at || p.created_at || new Date(0).toISOString(),
    calculated_price: amount(v)
  }));
  const prices = variants.map((v: any) => v.calculated_price).filter((n: number) => n > 0);
  const category = p.categories?.[0];
  const genderText = [p.metadata?.gender, p.type?.value, p.collection?.title].filter(Boolean).join(" ").toLowerCase();
  const gender = genderText.includes("women") || genderText.includes("woman") ? "women" : genderText.includes("men") || genderText.includes("man") ? "men" : "unisex";
  const images = (p.images || []).map((i: any) => i.url).filter(Boolean);
  return {
    id: p.id, category_id: category?.id || "", category_name: category?.name || "", category_slug: category?.handle || "",
    gender, title: p.title || "Untitled product", slug: p.handle || p.id, subtitle: p.subtitle || "",
    description: p.description || "", material: p.metadata?.material || "", dimensions: p.metadata?.dimensions || "",
    artisan: p.metadata?.artisan || "", provenance: p.metadata?.provenance || "", care_instructions: p.metadata?.care_instructions || "",
    base_price: prices.length ? Math.min(...prices) : 0, original_price: undefined,
    sizes: [...new Set(variants.map((v: any) => v.size).filter(Boolean))],
    colors: [...new Set(variants.map((v: any) => v.color).filter(Boolean))].map((name: any) => ({ name, hex: "" })),
    tags: (p.tags || []).map((t: any) => t.value || t), is_published: p.status === "published" ? 1 : 0,
    is_featured: p.metadata?.is_featured ? 1 : 0, is_on_sale: 0, created_at: p.created_at || new Date(0).toISOString(),
    variants, min_price: prices.length ? Math.min(...prices) : 0, max_price: prices.length ? Math.max(...prices) : 0,
    total_stock: variants.reduce((sum: number, v: any) => sum + v.stock_quantity, 0),
    primary_image: p.thumbnail || images[0] || "", images
  };
}

export function mapCategory(c: any) {
  return { id: c.id, name: c.name || c.handle || "Category", slug: c.handle || c.id, description: c.description || "",
    image_url: c.metadata?.image_url || "", gender: c.metadata?.gender || "unisex", sort_order: Number(c.rank || 0), product_count: 0 };
}

export function sendError(res: any, error: any) {
  const status = Number(error?.status) || 502;
  res.status(status).json({ error: "Unable to load data from Medusa.", details: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined });
}
