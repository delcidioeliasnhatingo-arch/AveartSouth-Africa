export default async function handler(_req: any, res: any) {
  try {
    const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase public configuration is missing.");

    const query = new URLSearchParams({
      select: "id,name,category,status",
      status: "in.(active,ativo,published)",
      order: "created_at.desc",
    });
    const response = await fetch(`${supabaseUrl}/rest/v1/products?${query.toString()}`, {
      headers: { Accept: "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      cache: "no-store",
    });
    const responseText = await response.text();
    if (!response.ok) throw new Error(`Supabase categories query returned ${response.status}: ${responseText.slice(0, 400)}`);
    const products = JSON.parse(responseText);
    const map = new Map<string, any>();
    for (const product of (Array.isArray(products) ? products : [])) {
      const name = String(product.category || "Clothing");
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "clothing";
      if (!map.has(slug)) map.set(slug, {
        id: product.id || slug,
        name,
        slug,
        description: "",
        image_url: "",
        gender: "unisex",
        sort_order: map.size,
        product_count: 0,
      });
      map.get(slug).product_count += 1;
    }
    res.setHeader("Cache-Control", "public, s-maxage=5, stale-while-revalidate=10");
    res.setHeader("CDN-Cache-Control", "public, s-maxage=5, stale-while-revalidate=10");
    return res.status(200).json(Array.from(map.values()));
  } catch (error: any) {
    console.error("AVEART categories query failed:", error?.message || error);
    res.setHeader("Cache-Control", "no-store");
    return res.status(502).json({ error: "Unable to load AVEART categories.", details: process.env.NODE_ENV === "development" ? String(error?.message || error) : undefined });
  }
}
