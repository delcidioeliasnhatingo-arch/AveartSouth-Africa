import { getSupabaseProducts, slugify, sendSupabaseError } from "./_supabase.ts";

export default async function handler(_req: any, res: any) {
  try {
    const products = await getSupabaseProducts();
    const counts = new Map<string, number>();
    for (const product of products) {
      const name = product.category || "Clothing";
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    const categories = [...counts.entries()].map(([name, product_count]) => ({
      id: slugify(name), name, slug: slugify(name), description: "", image_url: "",
      gender: "women", sort_order: 0, product_count,
    }));
    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json(categories);
  } catch (error) { sendSupabaseError(res, error); }
}
