import { medusa, mapProduct, sendError } from "../_medusa";

export default async function handler(req: any, res: any) {
  try {
    const slug = String(req.query?.slug || "");
    if (!slug) return res.status(400).json({ error: "Product handle is required." });
    const data = await medusa(`/store/products?handle=${encodeURIComponent(slug)}&limit=1&fields=*variants,*variants.calculated_price,*variants.options,*categories,*images,*tags`);
    const product = (data.products || []).find((p: any) => p.handle === slug) || data.products?.[0];
    if (!product) return res.status(404).json({ error: "Product not found in Medusa." });
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json(mapProduct(product));
  } catch (error) { sendError(res, error); }
}
