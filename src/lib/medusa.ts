const MEDUSA_URL = (import.meta.env.VITE_MEDUSA_BACKEND_URL || 'https://aveart-medusa-api.onrender.com').replace(/\/$/, '');
const PUBLISHABLE_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || '';

type MedusaRegion = { id: string; currency_code: string; name?: string };
type MedusaVariant = {
  id: string;
  title?: string;
  sku?: string | null;
  manage_inventory?: boolean;
  inventory_quantity?: number;
  calculated_price?: { calculated_amount?: number; currency_code?: string } | null;
  options?: Array<{ id?: string; value?: string; option?: { title?: string } }>;
  metadata?: Record<string, unknown> | null;
};
type MedusaProduct = {
  id: string;
  title: string;
  handle: string;
  subtitle?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  images?: Array<{ url: string }>;
  variants?: MedusaVariant[];
  categories?: Array<{ id: string; name: string; handle: string }>;
  options?: Array<{ title: string; values?: Array<{ value: string }> }>;
  metadata?: Record<string, unknown> | null;
};

let regionPromise: Promise<MedusaRegion> | null = null;

function headers() {
  if (!PUBLISHABLE_KEY) {
    throw new Error('A chave publicável do Medusa não está configurada. Defina VITE_MEDUSA_PUBLISHABLE_KEY nas variáveis de ambiente do tema.');
  }
  return { 'Content-Type': 'application/json', 'x-publishable-api-key': PUBLISHABLE_KEY };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${MEDUSA_URL}${path}`, {
    ...init,
    headers: { ...headers(), ...(init?.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || payload.error || `Medusa respondeu com HTTP ${response.status}`);
  }
  return payload as T;
}

export async function getMedusaRegion(): Promise<MedusaRegion> {
  if (!regionPromise) {
    regionPromise = request<{ regions?: MedusaRegion[] }>('/store/regions?limit=100')
      .then(({ regions }) => {
        const region = regions?.find((item) => item.currency_code?.toLowerCase() === 'zar') || regions?.[0];
        if (!region) throw new Error('O Medusa ainda não tem uma região de venda. Cria uma região (ZAR) no painel administrativo.');
        return region;
      })
      .catch((error) => {
        regionPromise = null;
        throw error;
      });
  }
  return regionPromise;
}

function amount(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value || 0);
  return Number.isFinite(number) ? number / 100 : 0;
}

function optionValue(variant: MedusaVariant, optionTitle: string): string | undefined {
  return variant.options?.find((option) => option.option?.title?.toLowerCase() === optionTitle.toLowerCase())?.value;
}

function toThemeProduct(product: MedusaProduct) {
  const variants = (product.variants || []).map((variant) => {
    const price = amount(variant.calculated_price?.calculated_amount);
    const size = optionValue(variant, 'size') || optionValue(variant, 'sizes');
    const color = optionValue(variant, 'color') || optionValue(variant, 'colour');
    const inventory = variant.inventory_quantity ?? 0;
    return {
      id: variant.id,
      product_id: product.id,
      sku: variant.sku || '',
      name: variant.title || [size, color].filter(Boolean).join(' / ') || product.title,
      size,
      color,
      price_offset: price,
      stock_quantity: variant.manage_inventory === false ? 999 : inventory,
      low_stock_threshold: 3,
      image_url: product.thumbnail || product.images?.[0]?.url || '',
      created_at: '',
      _calculatedPrice: price,
    };
  });
  const prices = variants.map((variant) => variant._calculatedPrice).filter((price) => price > 0);
  const basePrice = prices.length ? Math.min(...prices) : 0;
  const metadata = product.metadata || {};
  const category = product.categories?.[0];
  const sizes = Array.from(new Set(variants.map((variant) => variant.size).filter(Boolean))) as string[];
  const colors = Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean))) as string[];
  return {
    id: product.id,
    category_id: category?.id || '',
    category_name: category?.name || '',
    category_slug: category?.handle || '',
    gender: (metadata.gender === 'men' || metadata.gender === 'women' ? metadata.gender : 'unisex') as 'men' | 'women' | 'unisex',
    title: product.title,
    slug: product.handle,
    subtitle: product.subtitle || '',
    description: product.description || '',
    material: String(metadata.material || ''),
    dimensions: '',
    artisan: 'AVEART',
    provenance: '',
    care_instructions: String(metadata.care_instructions || ''),
    base_price: basePrice,
    original_price: typeof metadata.original_price === 'number' ? metadata.original_price : undefined,
    sizes,
    colors: colors.map((name) => ({ name, hex: '#B8B8B8' })),
    tags: Array.isArray(metadata.tags) ? metadata.tags.map(String) : [],
    is_published: 1,
    is_featured: metadata.featured === true ? 1 : 0,
    is_on_sale: typeof metadata.original_price === 'number' && metadata.original_price > basePrice ? 1 : 0,
    created_at: '',
    variants: variants.map(({ _calculatedPrice, ...variant }) => ({ ...variant, price_offset: _calculatedPrice - basePrice })),
    min_price: prices.length ? Math.min(...prices) : basePrice,
    max_price: prices.length ? Math.max(...prices) : basePrice,
    total_stock: variants.reduce((sum, variant) => sum + variant.stock_quantity, 0),
    primary_image: product.thumbnail || product.images?.[0]?.url || '',
  };
}

const PRODUCT_FIELDS = 'id,title,handle,subtitle,description,thumbnail,images,metadata,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.options,+options,+categories';

export async function listMedusaProducts(filters: {
  gender?: string;
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  inStockOnly?: boolean;
  featured?: boolean;
  onSale?: boolean;
  sort?: string;
} = {}) {
  const region = await getMedusaRegion();
  const params = new URLSearchParams({ limit: '100', region_id: region.id, fields: PRODUCT_FIELDS });
  if (filters.category) params.set('category_handle', filters.category);
  if (filters.search) params.set('q', filters.search);
  if (filters.minPrice) params.set('price[gte]', String(Math.round(Number(filters.minPrice) * 100)));
  if (filters.maxPrice) params.set('price[lte]', String(Math.round(Number(filters.maxPrice) * 100)));
  if (filters.sort === 'price_asc') params.set('order', 'variants.calculated_price.calculated_amount');
  else if (filters.sort === 'price_desc') params.set('order', '-variants.calculated_price.calculated_amount');
  else if (filters.sort === 'newest') params.set('order', '-created_at');
  const { products = [] } = await request<{ products?: MedusaProduct[] }>(`/store/products?${params.toString()}`);
  let mapped = products.map(toThemeProduct);
  if (filters.gender && filters.gender !== 'all') mapped = mapped.filter((product) => product.gender === filters.gender || product.gender === 'unisex');
  if (filters.featured) mapped = mapped.filter((product) => product.is_featured === 1);
  if (filters.onSale) mapped = mapped.filter((product) => product.is_on_sale === 1);
  if (filters.minPrice) mapped = mapped.filter((product) => (product.min_price || product.base_price) >= Number(filters.minPrice));
  if (filters.maxPrice) mapped = mapped.filter((product) => (product.max_price || product.base_price) <= Number(filters.maxPrice));
  if (filters.sort === 'price_asc') mapped.sort((a, b) => (a.min_price || a.base_price) - (b.min_price || b.base_price));
  if (filters.sort === 'price_desc') mapped.sort((a, b) => (b.max_price || b.base_price) - (a.max_price || a.base_price));
  return mapped.filter((product) => !filters.inStockOnly || (product.total_stock || 0) > 0);
}

export async function listMedusaCategories() {
  const { product_categories = [] } = await request<{ product_categories?: Array<{ id: string; name: string; handle: string; description?: string; metadata?: Record<string, unknown> }> }>('/store/product-categories?limit=100');
  return product_categories.map((category, index) => ({
    id: category.id,
    name: category.name,
    slug: category.handle,
    description: category.description || '',
    image_url: '',
    gender: (category.metadata?.gender === 'men' || category.metadata?.gender === 'women' ? category.metadata.gender : 'unisex') as 'men' | 'women' | 'unisex',
    sort_order: index,
  }));
}

export async function getMedusaProduct(handle: string) {
  const region = await getMedusaRegion();
  const params = new URLSearchParams({ handle, region_id: region.id, fields: PRODUCT_FIELDS });
  const { products = [] } = await request<{ products?: MedusaProduct[] }>(`/store/products?${params.toString()}`);
  if (!products[0]) throw new Error('Este produto não foi encontrado no catálogo do Medusa.');
  return toThemeProduct(products[0]);
}

export async function getMedusaRecommendations(handle: string) {
  const products = await listMedusaProducts();
  const current = products.find((product) => product.slug === handle);
  return products.filter((product) => product.slug !== handle && (!current?.category_slug || product.category_slug === current.category_slug)).slice(0, 4);
}

export function medusaIsConfigured() {
  return Boolean(PUBLISHABLE_KEY);
}
