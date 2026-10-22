type SupabaseVariant = {
  id?: string;
  name?: string;
  sku?: string;
  size?: string | null;
  color?: string | null;
  color_hex?: string | null;
  price?: number | string | null;
  stock?: number | string | null;
  image_url?: string | null;
};

type SupabaseProductRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  category: string;
  price: number | string;
  image_url: string | null;
  images?: string[] | null;
  sizes: string[] | null;
  colors: string[] | null;
  variants?: SupabaseVariant[] | null;
  stock: number;
  status: string;
  created_at: string;
};

function config() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  if (!url || !key) throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel.");
  return { url, key };
}

export async function getSupabaseProducts(): Promise<SupabaseProductRow[]> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/products?select=id,name,slug,description,category,price,image_url,images,sizes,colors,variants,stock,status,created_at&status=eq.active&order=created_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Supabase products query failed (${response.status}). Check migration 003_product_variants.sql and the products table permissions.`);
  return await response.json() as SupabaseProductRow[];
}

export function mapSupabaseProduct(p: SupabaseProductRow) {
  const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ["One Size"];
  const colors = Array.isArray(p.colors) && p.colors.length ? p.colors : ["Default"];
  const savedVariants = Array.isArray(p.variants) ? p.variants : [];
  const variants = savedVariants.length
    ? savedVariants.map((v, index) => {
        const size = v.size || undefined;
        const color = v.color || undefined;
        const price = Number(v.price ?? p.price ?? 0);
        return {
          id: `${p.id}::variant::${encodeURIComponent(String(v.sku || v.id || index))}`,
          product_id: p.id,
          sku: String(v.sku || ""),
          name: String(v.name || [size, color].filter(Boolean).join(" / ") || "Default"),
          size,
          color,
          color_hex: v.color_hex || undefined,
          price_offset: price - Number(p.price || 0),
          stock_quantity: Math.max(0, Number(v.stock || 0)),
          stock_tracking: "variant",
          low_stock_threshold: 3,
          image_url: v.image_url || p.image_url || "",
          created_at: p.created_at,
          calculated_price: Math.max(0, price),
        };
      })
    : sizes.flatMap((size) => colors.map((color) => ({
        id: `${p.id}::${encodeURIComponent(size)}::${encodeURIComponent(color)}`,
        product_id: p.id,
        sku: "",
        name: [size, color].filter((v) => v !== "One Size" && v !== "Default").join(" / ") || "Default",
        size: size === "One Size" ? undefined : size,
        color: color === "Default" ? undefined : color,
        price_offset: 0,
        stock_quantity: Math.max(0, Number(p.stock || 0)),
        stock_tracking: "product",
        low_stock_threshold: 3,
        image_url: p.image_url || "",
        created_at: p.created_at,
        calculated_price: Number(p.price || 0),
      })));
  const price = Number(p.price || 0);
  const slug = p.slug || p.id;
  const totalStock = savedVariants.length
    ? savedVariants.reduce((sum, v) => sum + Math.max(0, Number(v.stock || 0)), 0)
    : Math.max(0, Number(p.stock || 0));
  return {
    id: p.id,
    category_id: p.category || "clothing",
    category_name: p.category || "Clothing",
    category_slug: slugify(p.category || "clothing"),
    gender: "women",
    title: p.name,
    slug,
    subtitle: "",
    description: p.description || "",
    material: "",
    dimensions: "",
    artisan: "",
    provenance: "",
    care_instructions: "",
    base_price: price,
    original_price: undefined,
    sizes: sizes.filter((s) => s !== "One Size"),
    colors: colors.filter((c) => c !== "Default").map((name) => ({ name, hex: "" })),
    tags: [],
    is_published: p.status === "active" ? 1 : 0,
    is_featured: 0,
    is_on_sale: 0,
    created_at: p.created_at,
    variants,
    min_price: variants.length ? Math.min(...variants.map((v) => v.calculated_price)) : price,
    max_price: variants.length ? Math.max(...variants.map((v) => v.calculated_price)) : price,
    total_stock: totalStock,
    primary_image: p.image_url || "",
    images: Array.isArray(p.images) && p.images.length ? p.images : (p.image_url ? [p.image_url] : []),
  };
}

export function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function sendSupabaseError(res: any, error: any) {
  const message = String(error?.message || error || "Unknown error");
  const missingConfig = message.includes("not configured");
  res.status(missingConfig ? 503 : 502).json({
    error: "Unable to load products from Supabase.",
    details: process.env.NODE_ENV === "development" ? message : undefined,
  });
}
