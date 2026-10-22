import { getSupabaseProducts, mapSupabaseProduct, sendSupabaseError, slugify } from "./_supabase.ts";

export default async function handler(req: any, res: any) {
  try {
    const q = req.query || {};
    let products = (await getSupabaseProducts()).map(mapSupabaseProduct);
    if (q.search) {
      const s = String(q.search).toLowerCase();
      products = products.filter((p: any) => `${p.title} ${p.description} ${p.tags.join(" ")}`.toLowerCase().includes(s));
    }
    if (q.category) products = products.filter((p: any) => p.category_slug === slugify(String(q.category)) || p.category_id === String(q.category));
    if (q.gender && q.gender !== "all") products = products.filter((p: any) => p.gender === String(q.gender) || p.gender === "unisex");
    if (q.inStockOnly === "true") products = products.filter((p: any) => p.total_stock > 0);
    if (q.onSale === "true") products = products.filter((p: any) => p.is_on_sale === 1);
    if (q.minPrice) products = products.filter((p: any) => p.base_price >= Number(q.minPrice));
    if (q.maxPrice) products = products.filter((p: any) => p.base_price <= Number(q.maxPrice));
    if (q.sort === "price_asc") products.sort((a: any, b: any) => a.base_price - b.base_price);
    else if (q.sort === "price_desc") products.sort((a: any, b: any) => b.base_price - a.base_price);
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json(products);
  } catch (error) { sendSupabaseError(res, error); }
}
