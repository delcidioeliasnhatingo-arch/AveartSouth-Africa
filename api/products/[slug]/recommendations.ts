import { medusa, mapProduct, sendError } from "../../_medusa";

export default async function handler(req: any, res: any) {
  try {
    const slug = String(req.query?.slug || "");
    const data = await medusa("/storefront/products");
    const products = (data.products || []).map(mapProduct).filter((p: any) => p.is_published === 1 && p.slug !== slug);
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json(products.slice(0, 4));
  } catch (error) { sendError(res, error); }
}
