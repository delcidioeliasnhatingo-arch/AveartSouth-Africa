import { medusa, mapProduct, sendError } from "./_medusa.ts";

export default async function handler(req: any, res: any) {
  try {
    const data = await medusa("/storefront/products");
    const q = req.query || {};
    let products = (data.products || []).map(mapProduct).filter((p: any) => p.is_published === 1);
    if (q.search) { const s = String(q.search).toLowerCase(); products = products.filter((p: any) => `${p.title} ${p.description} ${p.tags.join(" ")}`.toLowerCase().includes(s)); }
    if (q.category) products = products.filter((p: any) => p.category_slug === String(q.category) || p.category_id === String(q.category));
    if (q.gender && q.gender !== "all") products = products.filter((p: any) => p.gender === String(q.gender));
    if (q.inStockOnly === "true") products = products.filter((p: any) => p.total_stock > 0);
    if (q.onSale === "true") products = products.filter((p: any) => p.is_on_sale === 1);
    if (q.minPrice) products = products.filter((p: any) => p.base_price >= Number(q.minPrice));
    if (q.maxPrice) products = products.filter((p: any) => p.base_price <= Number(q.maxPrice));
    if (q.sort === "price_asc") products.sort((a: any, b: any) => a.base_price - b.base_price);
    else if (q.sort === "price_desc") products.sort((a: any, b: any) => b.base_price - a.base_price);
    else products.sort((a: any, b: any) => Number(b.is_featured) - Number(a.is_featured));
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json(products);
  } catch (error) { sendError(res, error); }
}
