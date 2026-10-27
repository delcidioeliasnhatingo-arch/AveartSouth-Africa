import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Sparkles,
  Truck,
  ShieldCheck,
  Flame,
  Check,
  Star,
  Tag,
  Copy,
  Scissors,
  Leaf,
  Clock,
  RotateCcw,
  Mail,
  Heart,
} from 'lucide-react';
import { Product, Category, formatZAR } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import heroImage from '../assets/images/fashion_women_linen_blazer_1792263530901.jpg';
import { Logo } from '../components/Logo.tsx';

interface HomeViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'women' | 'men' | 'sale'>('all');
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ])
      .then(([productsData, categoriesData]) => {
        setProducts(Array.isArray(productsData) ? productsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      })
      .catch((err) => console.error('Error fetching home data:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopyCoupon = () => {
    navigator.clipboard?.writeText('AVEART15');
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 3000);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    }
  };

  // Filtered products for Section 3
  const filteredProducts = products.filter((p) => {
    if (activeTab === 'women') return p.gender === 'women';
    if (activeTab === 'men') return p.gender === 'men';
    if (activeTab === 'sale') return p.is_on_sale === 1;
    return true; // 'all'
  });

  return (
    <div className="space-y-16 md:space-y-24 pb-16">
      
      {/* =========================================================================
          SECTION 1: FULL-SCREEN HERO (MODEL OCCUPYING ENTIRE HERO WITH NEW LOGO)
          ========================================================================= */}
      <section className="relative w-full min-h-[90vh] lg:min-h-[calc(100vh-4.5rem)] flex items-center bg-[#090D16] text-white overflow-hidden border-b border-slate-800/60">
        
        {/* Full-Bleed Model Photo: Occupies the entire hero background from edge to edge */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src={heroImage}
            alt="AVEART Model wearing Sand Tailored Linen Double-Breasted Blazer"
            className="w-full h-full object-cover object-[center_top] sm:object-[center_15%] md:object-[68%_18%] lg:object-[68%_18%] xl:object-[65%_15%] scale-100 transition-transform duration-1000 ease-out"
          />
          {/* Subtle cinematic overlays for high-contrast typography while leaving the model radiant and prominent */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 sm:via-slate-950/45 md:via-slate-950/30 to-slate-950/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40" />
        </div>

        {/* Content Layer over the Full Hero Photo */}
        <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12 md:py-16">
          <div className="max-w-xl lg:max-w-2xl space-y-6">
            
            {/* Announcement badge with Geometric Flight Emblem */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-emerald-600/20 border border-emerald-300/30 backdrop-blur-md rounded-full text-xs font-bold text-rose-200 shadow-xs">
              <Logo className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>New Season 2026 · Ready to Ship</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl text-white font-black leading-[1.08] tracking-tight [text-wrap:balance] drop-shadow-md">
              AUTHENTIC FASHION CRAFTED FOR EVERYDAY ELEGANCE
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-200 leading-relaxed font-medium max-w-xl">
              Versatile silhouettes in pure European linen, natural silk, organic cotton, and selvedge denim. Contemporary comfort and effortless style tailored for daily life.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                onClick={() => onNavigate('catalog_gender', 'women')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-3.5 text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 transition-all cursor-pointer active:scale-95"
              >
                <span>Women's Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('catalog_gender', 'men')}
                className="border border-white/30 hover:border-white text-white hover:bg-white/10 backdrop-blur-sm px-7 py-3.5 text-sm font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Men's Collection
              </button>

              <button
                onClick={() => onNavigate('catalog')}
                className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 hover:text-white py-3 px-2 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Pill: Outfit Identifier with brand emblem */}
            <div
              onClick={() => onNavigate('product', 'tailored-double-breasted-linen-blazer')}
              className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md border border-white/15 text-xs text-slate-200 shadow-lg transition-all cursor-pointer group/pill active:scale-98"
            >
              <Logo className="w-3.5 h-3.5 text-emerald-600 group-hover/pill:rotate-12 transition-transform" />
              <span>
                Featured on model: <strong className="text-white font-extrabold">Tailored Linen Blazer in Sand</strong> · <span className="text-emerald-600 font-black">R 3,450</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider group-hover/pill:bg-emerald-600 transition-colors">
                View Piece
              </span>
            </div>

            {/* Trust Highlights in Glassmorphism */}
            <div className="pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-200">
              <div className="p-3.5 bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/10 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-300/30 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <span className="font-extrabold text-white text-sm block">Free Express Delivery</span>
                  <p className="text-[11px] text-slate-300">Complimentary nationwide shipping on orders over R 1,000.</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/60 backdrop-blur-md rounded-xl border border-white/10 shadow-sm flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="font-extrabold text-white text-sm block">Secure Payment</span>
                  <p className="text-[11px] text-slate-300">Instant EFT, Debit Cards & Capitec Pay protected.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 2: FEATURED CATEGORIES & DEPARTMENTS (Categories Grid)
          ========================================================================= */}
      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-wider text-emerald-700 font-extrabold block">
            Shop by Category
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
            Curated Silhouettes for Every Wardrobe
          </h2>
          <p className="text-sm text-slate-600 mt-2 font-medium">
            Explore collections designed with timeless cuts, premium natural fabrics, and thoughtful tailoring.
          </p>
        </div>

        {/* 4 Department Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Women's Fashion */}
          <div
            onClick={() => onNavigate('catalog_gender', 'women')}
            className="group relative aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden cursor-pointer border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300"
          >
            <img
              src="/src/assets/images/fashion_women_silk_midi_dress_1792263530827.jpg"
              alt="Women's Fashion AVEART"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-xs uppercase tracking-wider text-emerald-600 font-extrabold">Women</span>
              <h3 className="text-xl font-black mt-0.5">Dresses & Tailoring</h3>
              <p className="text-xs text-slate-200 mt-1 line-clamp-2">Pure silk dresses, relaxed blazers, and fluid trousers.</p>
              <div className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-600 group-hover:text-white flex items-center gap-1.5 transition-colors">
                <span>Shop Women</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 2: Men's Fashion */}
          <div
            onClick={() => onNavigate('catalog_gender', 'men')}
            className="group relative aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden cursor-pointer border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300"
          >
            <img
              src="/src/assets/images/fashion_men_wool_overshirt_1792263531608.jpg"
              alt="Men's Fashion AVEART"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-xs uppercase tracking-wider text-amber-400 font-extrabold">Men</span>
              <h3 className="text-xl font-black mt-0.5">Overshirts & Outerwear</h3>
              <p className="text-xs text-slate-200 mt-1 line-clamp-2">Heavy-gauge wool overshirts, tactile knitwear, and easy layering.</p>
              <div className="mt-3 text-xs font-bold uppercase tracking-wider text-amber-300 group-hover:text-white flex items-center gap-1.5 transition-colors">
                <span>Shop Men</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 3: Selvedge Denim & Trousers */}
          <div
            onClick={() => onNavigate('catalog_category', 'pants')}
            className="group relative aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden cursor-pointer border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300"
          >
            <img
              src="/src/assets/images/fashion_men_selvedge_jeans_1792263532797.jpg"
              alt="Selvedge Denim & Trousers"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-xs uppercase tracking-wider text-blue-400 font-extrabold">Artisanal Denim</span>
              <h3 className="text-xl font-black mt-0.5">Selvedge Jeans & Trousers</h3>
              <p className="text-xs text-slate-200 mt-1 line-clamp-2">Traditional shuttle-loom denim and tailored cuts made to last.</p>
              <div className="mt-3 text-xs font-bold uppercase tracking-wider text-blue-300 group-hover:text-white flex items-center gap-1.5 transition-colors">
                <span>Shop Trousers & Denim</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 4: Bags & Accessories */}
          <div
            onClick={() => onNavigate('catalog_gender', 'accessories')}
            className="group relative aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden cursor-pointer border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-300"
          >
            <img
              src="/src/assets/images/fashion_acc_leather_tote_1792263547555.jpg"
              alt="Bags and Genuine Leather Accessories"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-6 text-white">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-extrabold">Accessories</span>
              <h3 className="text-xl font-black mt-0.5">Leather Bags & Accents</h3>
              <p className="text-xs text-slate-200 mt-1 line-clamp-2">Vegetable-tanned leather tote bags and artisanal brass jewelry.</p>
              <div className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-300 group-hover:text-white flex items-center gap-1.5 transition-colors">
                <span>Shop Accessories</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

        </div>

        {/* Quick Filter Chips */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-emerald-700" />
            <span>Quick search:</span>
          </span>
          {[
            { label: 'Blazers & Jackets', slug: 'blazers' },
            { label: 'Dresses & Skirts', slug: 'dresses' },
            { label: 'Shirts & Tops', slug: 'shirts' },
            { label: 'Trousers & Denim', slug: 'pants' },
            { label: 'Knitwear & Sweaters', slug: 'knitwear' },
            { label: 'Bags & Accessories', slug: 'accessories' },
          ].map((chip) => (
            <button
              key={chip.slug}
              onClick={() => onNavigate('catalog_category', chip.slug)}
              className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 rounded-full text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </section>


      {/* =========================================================================
          SECTION 3: SEASON HIGHLIGHTS & BESTSELLERS (Trending Products Grid)
          ========================================================================= */}
      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        
        {/* Section Header with Interactive Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-emerald-700 font-extrabold block">
              Curated Selection
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-1">
              Trending & Bestsellers
            </h2>
          </div>

          {/* Quick Select Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('women')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'women'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Women
            </button>
            <button
              onClick={() => setActiveTab('men')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'men'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Men
            </button>
            <button
              onClick={() => setActiveTab('sale')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'sale'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-rose-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Sale</span>
            </button>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(slug) => onNavigate('product', slug)}
              />
            ))}
          </div>
        )}

        {/* Promotional Banner & Interactive Discount Code */}
        <div className="mt-12 bg-gradient-to-r from-rose-500 via-rose-600 to-orange-500 rounded-xl p-6 md:p-8 text-white shadow-xl shadow-rose-500/15 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full text-xs font-black uppercase tracking-wider inline-block">
              Welcome Special
            </span>
            <h3 className="text-2xl sm:text-3xl font-black">
              Enjoy 15% OFF your first order
            </h3>
            <p className="text-sm text-rose-100 max-w-xl font-medium">
              Valid on all new-season styles. Apply code at checkout before placing your order.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-xl px-5 py-3 text-center">
              <span className="text-[10px] text-rose-100 block font-bold uppercase tracking-wider">Promo Code</span>
              <span className="text-xl font-black font-mono tracking-wider">AVEART15</span>
            </div>
            <button
              onClick={handleCopyCoupon}
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-3 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              {copiedCoupon ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>


      {/* =========================================================================
          SECTION 4: BENEFITS, CUSTOMER REVIEWS & NEWSLETTER (Social Proof & Trust)
          ========================================================================= */}
      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        
        {/* Top Block: 4 Quality Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-rose-200 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
              <Leaf className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">100% Natural Fabrics</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Certified European linen, mulberry silk, and responsibly harvested organic cotton.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-rose-200 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Scissors className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Tailored Drape</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Engineered patterns designed for comfortable, breathable, and flattering daily wear.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-rose-200 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Express SA Delivery</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Swift dispatch with door-to-door courier tracking across all nine South African provinces.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-rose-200 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">Hassle-Free Returns</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              14-day exchange and return policy with zero complicated red tape or hidden fees.
            </p>
          </div>
        </div>

        {/* Middle Block: Real Customer Reviews */}
        <div className="mb-16">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs uppercase tracking-wider text-emerald-700 font-extrabold block">
              What Our Customers Say
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              5-Star Customer Reviews
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Over 2,400 satisfied clients dressed across South Africa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Review 1 */}
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                "The linen blazer exceeded all expectations. The interior horn-button craftsmanship and shoulder drape are impeccable. Arrived in just two days here in Cape Town!"
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-900 block">Camila M.</span>
                  <span className="text-[11px] text-slate-400">Cape Town · Verified Purchase</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                  Verified ✓
                </span>
              </div>
            </div>

            {/* Review 2 */}
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                "The virgin wool overshirt has substantial heft and warmth without feeling bulky. Quality rivaling European luxury fashion houses, with fair pricing and swift local service."
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-900 block">Lucas S.</span>
                  <span className="text-[11px] text-slate-400">Johannesburg · Verified Purchase</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                  Verified ✓
                </span>
              </div>
            </div>

            {/* Review 3 */}
            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                "The full-grain leather tote bag is stunning. The rich aroma of natural leather and reinforced saddle stitching demonstrate true craftsmanship. A customer for life!"
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-900 block">Beatriz D.</span>
                  <span className="text-[11px] text-slate-400">Durban · Verified Purchase</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                  Verified ✓
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Block: Newsletter & Community */}
        <div className="bg-slate-900 rounded-xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
            <span className="text-xs uppercase tracking-wider text-emerald-600 font-extrabold block">
              AVEART Community
            </span>
            <h3 className="text-3xl sm:text-4xl font-black">
              Stay in the loop with what's new
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Subscribe for early invitations to seasonal collections, capsule drops, and exclusive offers delivered straight to your inbox.
            </p>

            {newsletterSubscribed ? (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Thank you for subscribing! Check your email to confirm your 15% OFF voucher.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 pt-2 max-w-md mx-auto">
                <div className="relative flex-1">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-600 focus:ring-2 focus:ring-rose-500/30 text-white placeholder-slate-400 pl-11 pr-4 py-3 rounded-xl text-sm transition-all outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-rose-500/25 active:scale-95 shrink-0"
                >
                  Subscribe
                </button>
              </form>
            )}

            <p className="text-[11px] text-slate-400 pt-1">
              We respect your privacy. You can unsubscribe anytime with one click.
            </p>
          </div>
        </div>

      </section>

    </div>
  );
};
