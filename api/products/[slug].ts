import { getSupabaseProducts, mapSupabaseProduct, sendSupabaseError } from "../_supabase.ts";

export default async function handler(req: any, res: any) {
  try {
    const slug = String(req.query?.slug || "");
    if (!slug) return res.status(400).json({ error: "Product handle is required." });
    const rows = await getSupabaseProducts();
    const row = rows.find((p) => (p.slug || p.id) === slug || p.id === slug);
    if (!row) return res.status(404).json({ error: "Product not found in Supabase." });
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json(mapSupabaseProduct(row));
  } catch (error) { sendSupabaseError(res, error); }
}
