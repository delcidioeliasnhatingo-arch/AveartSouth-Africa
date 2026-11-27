import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, RotateCcw, Search } from 'lucide-react';
import { Product, formatZAR } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { AVEART_COLLECTIONS, getCollectionProducts, isVisibleStoreProduct } from '../collections.ts';

const PUBLIC_PRODUCTS_URL = 'https://aveart-products-public.delcidioeliasnhatingo.workers.dev/api/products';

function hasProductImage(product: any): boolean {
  return Boolean([
    product?.primary_image, product?.image_url, product?.imageUrl, product?.thumbnail_url, product?.thumbnail,
    ...(Array.isArray(product?.images) ? product.images : []),
    ...(Array.isArray(product?.variants) ? product.variants.flatMap((variant: any) => [variant?.images?.[0], variant?.image_url, variant?.imageUrl]) : []),
  ].some((image) => typeof image === 'string' && image.trim()));
}

async function fetchProductsWithFallback(url: string, signal: AbortSignal): Promise<Response> {
  let lastError: unknown;
  for (const endpoint of [url, PUBLIC_PRODUCTS_URL]) {
    try {
      const response = await fetch(endpoint, { signal, headers: { Accept: 'application/json' } });
      if (!response.ok) { lastError = new Error(`Product API returned HTTP ${response.status}`); continue; }
      const data = await response.clone().json();
      const rows = Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : Array.isArray(data?.data) ? data.data : [];
      if (Array.isArray(data) || Array.isArray(data?.products) || Array.isArray(data?.data)) return response;
      lastError = new Error('Product API returned an invalid catalogue response');
    } catch (error: any) {
      if (error?.name === 'AbortError') throw error;
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unable to load AVEART products');
}

interface CatalogViewProps {
  initialCategory?: string;
  initialGender?: 'women' | 'men' | 'unisex' | 'accessories' | 'all';
  initialSearch?: string;
  initialSale?: boolean;
  initialCollection?: string;
  onSelectProduct: (slug: string) => void;
  onBuyNow: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  initialCategory,
  initialGender,
  initialSearch,
  initialSale,
  initialCollection,
  onSelectProduct,
  onBuyNow,
}) => {
  const initialProductsKey = 'aveart:catalog:v2:all';
  const [products, setProducts] = useState<Product[]>(() => {
    try { const value = localStorage.getItem(initialProductsKey); const parsed = value ? JSON.parse(value) : []; return Array.isArray(parsed) ? parsed.filter((product: any) => hasProductImage(product) && isVisibleStoreProduct(product)) : []; }
    catch { return []; }
  });
  const [loading, setLoading] = useState(() => {
    try { return !Array.isArray(JSON.parse(localStorage.getItem(initialProductsKey) || 'null')); }
    catch { return true; }
  });

  // Filters state
  const [selectedGender, setSelectedGender] = useState<string>(initialGender || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedCollection, setSelectedCollection] = useState<string>(initialCollection || '');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>(initialSearch || '');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [onlySale, setOnlySale] = useState<boolean>(initialSale || false);
  const [sortOption, setSortOption] = useState<string>('featured');
  const [priceRange, setPriceRange] = useState<string>('all');

  useEffect(() => {
    if (initialGender) setSelectedGender(initialGender);
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialSearch) setSearchQuery(initialSearch);
    if (initialSale) setOnlySale(true);
    setSelectedCollection(initialCollection || '');
    if (initialCollection) {
      setSelectedGender('all');
      setSelectedCategory('all');
      setOnlySale(false);
    }
  }, [initialGender, initialCategory, initialSearch, initialSale, initialCollection]);

  useEffect(() => {
    const controller = new AbortController();
    try {
      const cached = localStorage.getItem(initialProductsKey);
      const parsed = cached ? JSON.parse(cached) : null;
      if (Array.isArray(parsed)) {
        setProducts(parsed.filter((product: any) => hasProductImage(product)));
        setLoading(false);
      }
    } catch {}

    fetchProductsWithFallback('/api/products', controller.signal)
      .then((response) => {
        if (!response.ok) throw new Error(`Product catalogue returned HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const liveProducts = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.data)
          ? data.data
          : [];
        const productsWithImages = liveProducts.filter((product: any) => hasProductImage(product) && isVisibleStoreProduct(product));
        try { localStorage.setItem(initialProductsKey, JSON.stringify(productsWithImages)); } catch {}
        setProducts(productsWithImages);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.error('Failed to load products:', error);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const resetFilters = () => {
    setSelectedGender('all');
    setSelectedCategory('all');
    setSelectedCollection('');
    setSelectedTag('');
    setSearchQuery('');
    setInStockOnly(false);
    setOnlySale(false);
    setPriceRange('all');
    setSortOption('featured');
  };

  const hasActiveFilters =
    selectedGender !== 'all' ||
    selectedCategory !== 'all' ||
    selectedCollection !== '' ||
    selectedTag !== '' ||
    searchQuery.trim() !== '' ||
    inStockOnly ||
    onlySale ||
    priceRange !== 'all';

  const activeCollection = AVEART_COLLECTIONS.find((collection) => collection.slug === selectedCollection);
  const normalizeTag = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[_\\s]+/g, '-');
  const availableTags = Array.from(new Set(products.flatMap((product) => (Array.isArray((product as any).tags) ? (product as any).tags : [])
    .map(normalizeTag)
    .filter((tag: string) => tag && tag !== 'aveart' && !/^ave-[0-9]+$/.test(tag))
  ))).sort((a, b) => a.localeCompare(b));
  const filteredProducts = products.filter((product) => {
    const item = product as any;
    const values = [
      item.title, item.name, item.subtitle, item.description,
      item.category_name, item.category_slug, item.category,
      ...(Array.isArray(item.tags) ? item.tags : [item.tags]),
      ...(Array.isArray(item.variants) ? item.variants.flatMap((variant: any) => [variant?.size, variant?.color, variant?.name]) : []),
    ].filter(Boolean).join(' ').toLowerCase();

    if (selectedTag && !(Array.isArray(item.tags) ? item.tags : []).some((tag: unknown) => normalizeTag(tag) === selectedTag)) return false;
    if (selectedGender !== 'all' && String(item.gender || '').toLowerCase() !== selectedGender) return false;
    if (selectedCategory !== 'all') {
      const categoryValues = [item.category_id, item.category_slug, item.category_name, item.category]
        .filter(Boolean).map((value) => String(value).toLowerCase());
      const expected = selectedCategory.toLowerCase();
      if (!categoryValues.some((value) => value === expected || value.includes(expected))) return false;
    }
    if (searchQuery.trim() && !values.includes(searchQuery.trim().toLowerCase())) return false;

    const variants = Array.isArray(item.variants) ? item.variants : [];
    const stock = Number(item.total_stock ?? item.stock ?? variants.reduce((total: number, variant: any) => total + Number(variant?.stock_quantity || variant?.stock || 0), 0));
    if (inStockOnly && stock <= 0) return false;

    const price = Number(item.min_price ?? item.base_price ?? item.price ?? 0);
    const original = Number(item.original_price || 0);
    const hasDiscount = Boolean(item.is_on_sale || original > price || variants.some((variant: any) => Number(variant?.sale_price || 0) > 0 && Number(variant?.price || 0) > Number(variant?.sale_price || 0)));
    if (onlySale && !hasDiscount) return false;
    if (priceRange === 'under1000' && price >= 1000) return false;
    if (priceRange === '1000to2500' && (price < 1000 || price > 2500)) return false;
    if (priceRange === 'above2500' && price <= 2500) return false;
    return true;
  }).sort((a, b) => {
    const priceA = Number((a as any).min_price ?? a.base_price ?? 0);
    const priceB = Number((b as any).min_price ?? b.base_price ?? 0);
    if (sortOption === 'price_asc') return priceA - priceB;
    if (sortOption === 'price_desc') return priceB - priceA;
    return Date.parse(String(b.created_at || '')) - Date.parse(String(a.created_at || ''));
  });
  const visibleProducts = activeCollection ? getCollectionProducts(filteredProducts, selectedCollection) : filteredProducts;

  return (
    <div className="aveart-reference-catalog w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 space-y-8">
      
      {/* Header & Market Indicator */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-700 font-extrabold flex items-center gap-1.5">
            <span>Fashion Catalog · South Africa (ZAR)</span>
          </span>
          <h1 className="text-3xl sm:text-4xl text-slate-900 font-bold mt-1 tracking-tight">
            {activeCollection?.title || (selectedGender === 'unisex'
              ? "Unisex Collection"
              : onlySale
              ? "Seasonal Sale Promotions"
              : "All Products")}
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl font-medium">
            {activeCollection?.description || 'Contemporary styles selected for comfort and personal style. All prices are shown in South African Rand (ZAR).'}
          </p>
        </div>

        {/* Tabular Item Count */}
        <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
          <span>Showing</span>
          <span className="font-mono tabular-nums font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-rose-100">
            {visibleProducts.length} products
          </span>
        </div>
      </div>

      {/* Audience filter reflects the currently published catalogue */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => { setSelectedGender('all'); setSelectedCategory('all'); setOnlySale(false); }}
          className={`px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer rounded-lg ${selectedGender === 'all' && !onlySale ? 'bg-black text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:border-black'}`}
        >
          All Products
        </button>
        <button
          type="button"
          onClick={() => { setSelectedGender('unisex'); setSelectedCategory('all'); setOnlySale(false); }}
          className={`px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer rounded-lg ${selectedGender === 'unisex' && !onlySale ? 'bg-black text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:border-black'}`}
        >
          Unisex
        </button>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-4 shadow-sm">
        
        {/* Left: Search & Quick Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search blazers, linen, denim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#87977D] focus:bg-white"
            />
          </div>

          {/* Public style filters are generated from the tags saved on products in the admin. */}
          {availableTags.length > 0 && (
            <select
              aria-label="Filter by style tag"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
            >
              <option value="">All Styles / Tags</option>
              {availableTags.map((tag) => <option key={tag} value={tag}>{tag.replace(/-/g, ' ')}</option>)}
            </select>
          )}

          {/* Price Range Dropdown in ZAR */}
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#87977D] cursor-pointer"
          >
            <option value="all">All Prices (ZAR)</option>
            <option value="under1000">Under R 1,000</option>
            <option value="1000to2500">R 1,000 – R 2,500</option>
            <option value="above2500">Over R 2,500</option>
          </select>

          {/* In Stock Only Checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="accent-[#87977D] w-4 h-4 rounded cursor-pointer"
            />
            <span>In-Stock Only</span>
          </label>
        </div>

        {/* Right: Sort & Reset */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="hidden sm:inline font-bold">Sort by:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#87977D] cursor-pointer"
            >
              <option value="featured">Featured Picks</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">New Arrivals</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-emerald-700 hover:text-[#52664A] font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

      </div>

      {/* Product Grid Area: 4 columns desktop, 3 tablet, 2 mobile */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[3/4] bg-white border border-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-4 shadow-sm">
          <SlidersHorizontal className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900">
            No Products Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Try adjusting your search or filters to explore the rest of our fashion collection.
          </p>
          <button
            onClick={resetFilters}
            className="px-6 py-2.5 bg-[#87977D] text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      )}

    </div>
  );
};
