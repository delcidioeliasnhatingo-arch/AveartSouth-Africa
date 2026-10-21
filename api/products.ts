import { medusa, mapProduct, sendError } from "./_medusa";

export default async function handler(req: any, res: any) {
  try {
    const params = new URLSearchParams({ limit: "100", fields: "*variants,*variants.calculated_price,*variants.options,*categories,*images,*tags" });
    const q = req.query || {};
    if (q.search) params.set("q", String(q.search));
    if (q.category) params.set("category_handle", String(q.category));
    if (q.gender && q.gender !== "all") params.set("metadata[gender]", String(q.gender));
    const data = await medusa(`/store/products?${params.toString()}`);
    let products = (data.products || []).map(mapProduct).filter((p: any) => p.is_published === 1);
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
