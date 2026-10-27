import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, RotateCcw, Search, Sparkles } from 'lucide-react';
import { Product, Category, formatZAR } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';

interface CatalogViewProps {
  initialCategory?: string;
  initialGender?: 'women' | 'men' | 'accessories' | 'all';
  initialSearch?: string;
  initialSale?: boolean;
  onSelectProduct: (slug: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  initialCategory,
  initialGender,
  initialSearch,
  initialSale,
  onSelectProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedGender, setSelectedGender] = useState<string>(initialGender || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch || '');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [onlySale, setOnlySale] = useState<boolean>(initialSale || false);
  const [sortOption, setSortOption] = useState<string>('featured');
  const [priceRange, setPriceRange] = useState<string>('all');

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  useEffect(() => {
    if (initialGender) setSelectedGender(initialGender);
    if (initialCategory) setSelectedCategory(initialCategory);
    if (initialSearch) setSearchQuery(initialSearch);
    if (initialSale) setOnlySale(true);
  }, [initialGender, initialCategory, initialSearch, initialSale]);

  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams();
    if (selectedGender && selectedGender !== 'all') {
      if (selectedGender === 'accessories') {
        params.append('category', 'accessories');
      } else {
        params.append('gender', selectedGender);
      }
    }
    if (selectedCategory && selectedCategory !== 'all') {
      params.append('category', selectedCategory);
    }
    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }
    if (inStockOnly) {
      params.append('inStockOnly', 'true');
    }
    if (onlySale) {
      params.append('onSale', 'true');
    }
    if (sortOption) {
      params.append('sort', sortOption);
    }

    if (priceRange === 'under1000') {
      params.append('maxPrice', '1000');
    } else if (priceRange === '1000to2500') {
      params.append('minPrice', '1000');
      params.append('maxPrice', '2500');
    } else if (priceRange === 'above2500') {
      params.append('minPrice', '2500');
    }

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data);
      })
      .catch((err) => console.error('Failed to load products:', err))
      .finally(() => setLoading(false));
  }, [selectedGender, selectedCategory, searchQuery, inStockOnly, onlySale, sortOption, priceRange]);

  const resetFilters = () => {
    setSelectedGender('all');
    setSelectedCategory('all');
    setSearchQuery('');
    setInStockOnly(false);
    setOnlySale(false);
    setPriceRange('all');
    setSortOption('featured');
  };

  const hasActiveFilters =
    selectedGender !== 'all' ||
    selectedCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    inStockOnly ||
    onlySale ||
    priceRange !== 'all';

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 space-y-8">
      
      {/* Header & Market Indicator */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-700 font-extrabold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fashion Catalog · South Africa (ZAR)</span>
          </span>
          <h1 className="text-3xl sm:text-4xl text-slate-900 font-bold mt-1 tracking-tight">
            {selectedGender === 'women'
              ? "Women's Collection"
              : selectedGender === 'men'
              ? "Men's Collection"
              : selectedGender === 'accessories'
              ? "Bags & Accessories"
              : onlySale
              ? "Seasonal Sale Promotions"
              : "All Fashion Categories"}
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl font-medium">
            Contemporary silhouettes made for comfort and personal style. All prices in South African Rand (ZAR), VAT included.
          </p>
        </div>

        {/* Tabular Item Count */}
        <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
          <span>Showing</span>
          <span className="font-mono tabular-nums font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-rose-100">
            {products.length} products
          </span>
        </div>
      </div>

      {/* Primary Gender & Department Segmented Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => {
            setSelectedGender('all');
            setSelectedCategory('all');
            setOnlySale(false);
          }}
          className={`px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer rounded-lg ${
            selectedGender === 'all' && !onlySale
              ? 'bg-[#87977D] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'
          }`}
        >
          All Departments
        </button>

        <button
          onClick={() => {
            setSelectedGender('women');
            setSelectedCategory('all');
            setOnlySale(false);
          }}
          className={`px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer rounded-lg ${
            selectedGender === 'women' && !onlySale
              ? 'bg-[#87977D] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'
          }`}
        >
          Women
        </button>

        <button
          onClick={() => {
            setSelectedGender('men');
            setSelectedCategory('all');
            setOnlySale(false);
          }}
          className={`px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer rounded-lg ${
            selectedGender === 'men' && !onlySale
              ? 'bg-[#87977D] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'
          }`}
        >
          Men
        </button>

        <button
          onClick={() => {
            setSelectedGender('accessories');
            setSelectedCategory('all');
            setOnlySale(false);
          }}
          className={`px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer rounded-lg ${
            selectedGender === 'accessories' && !onlySale
              ? 'bg-[#87977D] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'
          }`}
        >
          Accessories
        </button>

        <button
          onClick={() => {
            setOnlySale(true);
            setSelectedGender('all');
          }}
          className={`px-4 py-2.5 text-xs font-black transition-all whitespace-nowrap cursor-pointer rounded-lg ${
            onlySale
              ? 'bg-[#87977D] text-white shadow-sm'
              : 'bg-[#f0f3ed] text-[#52664A] border border-[#dce4d7] hover:bg-[#e5ece1]'
          }`}
        >
          SALE %
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
      ) : products.length === 0 ? (
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
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}

    </div>
  );
};
