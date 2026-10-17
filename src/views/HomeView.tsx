import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Truck, ShieldCheck, Heart, Flame } from 'lucide-react';
import { Product, Category, formatZAR } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';

interface HomeViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/products?featured=true').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ])
      .then(([productsData, categoriesData]) => {
        setFeaturedProducts(Array.isArray(productsData) ? productsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      })
      .catch((err) => console.error('Error fetching home data:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-16 md:space-y-24">
      {/* 1. Fashion Storefront Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-6 md:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Text & Storytelling */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-50 border border-rose-200 rounded-full text-xs font-bold text-rose-600 shadow-xs">
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Spring & Summer Drop · South Africa</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl text-slate-900 font-black leading-[1.08] tracking-tight [text-wrap:balance]">
              Everyday fashion made to wear & love.
            </h1>

            <p className="text-base text-slate-600 leading-relaxed max-w-xl font-medium">
              Discover comfortable tailored linens, fluid silk dresses, pure cotton shirts, and selvedge denim designed for your contemporary South African wardrobe.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('catalog_gender', 'women')}
                className="bg-rose-500 hover:bg-rose-600 text-white px-7 py-3.5 text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 transition-all cursor-pointer active:scale-95"
              >
                <span>Shop Women</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('catalog_gender', 'men')}
                className="border-2 border-slate-300 hover:border-rose-500 text-slate-800 hover:text-rose-600 bg-white px-7 py-3.5 text-sm font-bold rounded-xl transition-all cursor-pointer hover:bg-rose-50/30 shadow-xs"
              >
                Shop Men
              </button>
            </div>

            {/* South African Trust Markers */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-rose-200 transition-colors">
                <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-rose-500" />
                  <span>Free Express Delivery</span>
                </span>
                <p className="mt-1 text-slate-500">Across South Africa on orders over R 1,000.</p>
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-rose-200 transition-colors">
                <span className="font-extrabold text-slate-900 block text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Secure Payments</span>
                </span>
                <p className="mt-1 text-slate-500">Instant EFT, Debito Pay & Cards.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Focus Fashion Editorial */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[3/4] max-h-[580px] bg-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 mx-auto">
              <img
                src="/src/assets/images/fashion_women_linen_blazer_1792263530901.jpg"
                alt="Women's Tailored Double-Breasted Linen Blazer"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wider block">
                    Editor's Highlight
                  </span>
                  <p className="text-base font-extrabold text-slate-900">
                    Double-Breasted Linen Blazer
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('product', 'tailored-double-breasted-linen-blazer')}
                  className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer shadow-md shadow-rose-500/20"
                >
                  Shop R 3,450 →
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Featured Pieces Grid (Women & Men) */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs uppercase tracking-wider text-rose-600 font-extrabold block">
              Trending This Week
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              New Season Favorites
            </h2>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs uppercase tracking-wider text-rose-600 hover:text-rose-700 font-bold transition-colors mt-3 md:mt-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Explore All Pieces ({featuredProducts.length || 8})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-2xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(slug) => onNavigate('product', slug)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Department Banners: Women & Men */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Women Department Card */}
          <div
            onClick={() => onNavigate('catalog_gender', 'women')}
            className="group relative aspect-[4/3] bg-slate-100 rounded-3xl overflow-hidden cursor-pointer border border-slate-200 shadow-md hover:shadow-2xl transition-all"
          >
            <img
              src="/src/assets/images/fashion_women_silk_midi_dress_1792263530827.jpg"
              alt="AVEART Womenswear Collection"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-end p-8 text-white">
              <span className="text-xs uppercase tracking-wider text-rose-400 font-extrabold">Womenswear</span>
              <h3 className="text-3xl font-black mt-1">Women's Collection</h3>
              <p className="text-sm text-slate-200 mt-1">Dresses, tailored blazers, trousers & fluid knits.</p>
              <div className="mt-4 text-xs font-bold uppercase tracking-wider text-rose-400 group-hover:text-white flex items-center gap-1.5 transition-colors">
                <span>Shop Women's Collection</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Men Department Card */}
          <div
            onClick={() => onNavigate('catalog_gender', 'men')}
            className="group relative aspect-[4/3] bg-slate-100 rounded-3xl overflow-hidden cursor-pointer border border-slate-200 shadow-md hover:shadow-2xl transition-all"
          >
            <img
              src="/src/assets/images/fashion_men_wool_overshirt_1792263531608.jpg"
              alt="AVEART Menswear Collection"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-end p-8 text-white">
              <span className="text-xs uppercase tracking-wider text-amber-400 font-extrabold">Menswear</span>
              <h3 className="text-3xl font-black mt-1">Men's Collection</h3>
              <p className="text-sm text-slate-200 mt-1">Overshirts, selvedge denim, heavy cotton tees & tailoring.</p>
              <div className="mt-4 text-xs font-bold uppercase tracking-wider text-amber-400 group-hover:text-white flex items-center gap-1.5 transition-colors">
                <span>Shop Men's Collection</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Warm, friendly quality promise banner */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50 rounded-3xl border border-rose-100 p-8 md:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs uppercase tracking-wider text-rose-600 font-extrabold">
                South African Craft & Materials
              </span>
              <h2 className="text-3xl font-black text-slate-900 leading-tight">
                Quality fashion made for everyday confidence.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Every garment is thoughtfully created with natural materials, breathable organic cottons, European flax linen, and Japanese selvedge denim.
              </p>
              <div className="space-y-2 text-xs text-slate-700 pt-2 font-semibold">
                <p className="flex items-center gap-2"><span className="text-rose-500 font-bold">✓</span> Certified organic cotton and breathable flax linen</p>
                <p className="flex items-center gap-2"><span className="text-rose-500 font-bold">✓</span> Shuttle-loom selvedge denim built to last</p>
                <p className="flex items-center gap-2"><span className="text-rose-500 font-bold">✓</span> 14-day hassle-free returns across South Africa</p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-rose-100 shadow-md">
                <img
                  src="/src/assets/images/fashion_men_selvedge_jeans_1792263532797.jpg"
                  alt="Selvedge denim detailing and craftsmanship"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
