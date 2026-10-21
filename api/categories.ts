import { medusa, mapCategory, sendError } from "./_medusa.ts";

export default async function handler(_req: any, res: any) {
  try {
    const data = await medusa("/storefront/categories");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json((data.product_categories || []).map(mapCategory));
  } catch (error) { sendError(res, error); }
}
