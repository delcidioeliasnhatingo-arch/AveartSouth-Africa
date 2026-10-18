import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  Check,
  AlertCircle,
  ShoppingBag,
  RotateCcw,
  Heart,
  Share2,
} from 'lucide-react';
import { Product, ProductVariant, formatZAR } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { ProductCard } from '../components/ProductCard.tsx';

interface ProductDetailViewProps {
  slug: string;
  onBack: () => void;
  onSelectProduct: (slug: string) => void;
  onNavigateToCategory: (categorySlug: string) => void;
}

const RECENTLY_VIEWED_KEY = 'aveart_recently_viewed_slugs';

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  slug,
  onBack,
  onSelectProduct,
  onNavigateToCategory,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'provenance' | 'dimensions' | 'care'>('provenance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Recommendations state
  const [recommendationType, setRecommendationType] = useState<'also_like' | 'similar' | 'complete_look' | 'recent'>('also_like');
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const { addItem } = useCart();

  // 1. Fetch Product Details
  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found in fashion catalog.');
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          const first = data.variants[0];
          setSelectedVariant(first);
          setSelectedSize(first.size || (data.sizes && data.sizes[0]) || '');
          setSelectedColor(first.color || (data.colors && data.colors[0]?.name) || '');
        }

        // Add to Recently Viewed in localStorage
        try {
          const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
          const slugs: string[] = stored ? JSON.parse(stored) : [];
          const updated = [slug, ...slugs.filter((s) => s !== slug)].slice(0, 8);
          localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // 2. Fetch Recommendations based on current product and active recommendation type
  useEffect(() => {
    if (!product) return;

    if (recommendationType === 'recent') {
      // Load recently viewed
      try {
        const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
        const slugs: string[] = stored ? JSON.parse(stored) : [];
        const otherSlugs = slugs.filter((s) => s !== slug);
        if (otherSlugs.length > 0) {
          Promise.all(
            otherSlugs.slice(0, 4).map((s) =>
              fetch(`/api/products/${s}`).then((r) => (r.ok ? r.json() : null))
            )
          ).then((items) => {
            setRecentProducts(items.filter(Boolean));
          });
        } else {
          setRecentProducts([]);
        }
      } catch {
        setRecentProducts([]);
      }
      return;
    }

    setRecommendationsLoading(true);
    fetch(`/api/products/${slug}/recommendations?type=${recommendationType}`)
      .then((res) => res.json())
      .then((data) => {
        setRecommendations(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Failed to fetch recommendations:', err))
      .finally(() => setRecommendationsLoading(false));
  }, [slug, product, recommendationType]);

  // Update selected variant when size or color changes
  const handleSizeSelect = (sz: string) => {
    setSelectedSize(sz);
    if (product?.variants) {
      const match = product.variants.find((v) => v.size === sz && (!selectedColor || v.color === selectedColor));
      if (match) {
        setSelectedVariant(match);
      }
    }
  };

  const handleColorSelect = (colName: string) => {
    setSelectedColor(colName);
    if (product?.variants) {
      const match = product.variants.find((v) => v.color === colName && (!selectedSize || v.size === selectedSize));
      if (match) {
        setSelectedVariant(match);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 animate-pulse space-y-8">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 aspect-[3/4] bg-slate-200 rounded-2xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-8 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-1/2 bg-slate-200 rounded" />
            <div className="h-12 w-full bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center space-y-4">
        <p className="text-2xl font-bold text-slate-900">Product Not Found</p>
        <p className="text-xs text-slate-500">The selected piece may have sold out or been updated.</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-rose-500 text-white text-xs font-bold uppercase rounded-xl hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
        >
          Return to Fashion Collection
        </button>
      </div>
    );
  }

  const currentPrice = product.base_price + (selectedVariant?.price_offset || 0);
  const isOutOfStock = !selectedVariant || selectedVariant.stock_quantity <= 0;
  const isLowStock = selectedVariant && selectedVariant.stock_quantity > 0 && selectedVariant.stock_quantity <= selectedVariant.low_stock_threshold;
  const hasDiscount = product.original_price && product.original_price > product.base_price;

  const galleryImages = [
    selectedVariant?.image_url || product.primary_image || '/src/assets/images/fashion_women_linen_blazer_1792263530901.jpg',
  ];

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) return;
    addItem(selectedVariant.id, quantity, {
      productTitle: product.title,
      variantName: selectedVariant.name,
      size: selectedSize || selectedVariant.size,
      color: selectedColor || selectedVariant.color,
      productSlug: product.slug,
      unitPrice: currentPrice,
      imageUrl: selectedVariant.image_url || product.primary_image,
      stockAvailable: selectedVariant.stock_quantity,
    });
  };

  const displayedRecommendations = recommendationType === 'recent' ? recentProducts : recommendations;

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 space-y-16">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <button
          onClick={onBack}
          className="flex items-center gap-1 hover:text-rose-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Shop</span>
        </button>
        <span aria-hidden="true">/</span>
        <span className="uppercase tracking-wider font-bold text-slate-700">
          {product.gender}
        </span>
        <span aria-hidden="true">/</span>
        <button
          onClick={() => onNavigateToCategory(product.category_slug)}
          className="hover:text-rose-600 transition-colors cursor-pointer uppercase tracking-wider font-bold"
        >
          {product.category_name}
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-slate-900 font-bold truncate max-w-xs">{product.title}</span>
      </div>

      {/* Main PDP Grid: Gallery (Left) vs Purchase Module (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: High-Res Fashion Imagery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            <img
              src={galleryImages[activeImageIndex]}
              alt={product.title}
              className="w-full h-full object-cover object-top"
            />
            {isOutOfStock ? (
              <div className="absolute top-4 left-4 bg-slate-800 text-white text-xs uppercase tracking-wider px-3.5 py-1.5 font-bold rounded-full shadow-sm">
                Sold Out
              </div>
            ) : hasDiscount ? (
              <div className="absolute top-4 left-4 bg-rose-500 text-white text-xs uppercase tracking-wider px-3.5 py-1.5 font-bold rounded-full shadow-sm">
                Sale Offer
              </div>
            ) : isLowStock ? (
              <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs uppercase tracking-wider px-3.5 py-1.5 font-bold rounded-full shadow-sm">
                Only {selectedVariant?.stock_quantity || 1} Remaining
              </div>
            ) : null}
          </div>

          {/* Fabric & Design Highlights */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-rose-600 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Fabric & Design Highlights</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {product.description}
            </p>
            <div className="pt-3 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 font-medium">
              <span>Brand: <strong className="text-slate-900 font-bold">{product.artisan}</strong></span>
              <span>Origin: <strong className="text-slate-900 font-bold">{product.provenance}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-6">
            
            {/* Header / Brand metadata */}
            <div>
              <div className="flex items-center gap-2 text-xs text-rose-600 uppercase tracking-wider font-extrabold mb-1.5">
                <span>{product.gender}</span>
                <span aria-hidden="true">·</span>
                <span>{product.category_name}</span>
                <span aria-hidden="true">·</span>
                <span>{product.artisan}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl text-slate-900 font-black leading-tight [text-wrap:balance]">
                {product.title}
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                {product.subtitle}
              </p>
            </div>

            {/* Price Display in South African Rand (ZAR) */}
            <div className="pt-4 border-t border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Price (ZAR)</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  {hasDiscount && (
                    <span className="font-mono tabular-nums text-lg text-slate-400 line-through">
                      {formatZAR(product.original_price!)}
                    </span>
                  )}
                  <span className={`font-mono tabular-nums text-3xl font-black ${hasDiscount ? 'text-rose-600' : 'text-slate-900'}`}>
                    {formatZAR(currentPrice)}
                  </span>
                </div>
              </div>

              {/* Real Availability status */}
              <div className="text-right">
                {isOutOfStock ? (
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full uppercase tracking-wider">
                    Sold Out
                  </span>
                ) : isLowStock ? (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Only {selectedVariant.stock_quantity} left</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>In Stock · Ready to Ship</span>
                  </span>
                )}
              </div>
            </div>

            {/* Colour Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="uppercase tracking-wider font-bold text-slate-700">
                    Colour: <strong className="text-slate-900 capitalize font-bold">{selectedColor || product.colors[0].name}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleColorSelect(c.name)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedColor === c.name
                          ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="uppercase tracking-wider font-bold text-slate-700">
                    Select Size
                  </span>
                  <span className="text-xs text-rose-600 font-bold cursor-pointer hover:underline">South African Sizing Guide</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {product.sizes.map((sz) => {
                    const isAvailable = product.variants?.some(
                      (v) => v.size === sz && v.stock_quantity > 0
                    );
                    return (
                      <button
                        key={sz}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleSizeSelect(sz)}
                        className={`py-2.5 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          selectedSize === sz
                            ? 'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/25'
                            : isAvailable
                            ? 'border-slate-200 bg-slate-50 text-slate-800 hover:border-rose-400'
                            : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Add to Bag CTA */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 h-12 px-3">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-2 text-base font-bold text-slate-600 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 font-mono tabular-nums text-sm font-bold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock || (selectedVariant && quantity >= selectedVariant.stock_quantity)}
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-2 text-base font-bold text-slate-600 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white h-12 text-sm uppercase tracking-wider font-extrabold rounded-xl disabled:opacity-40 transition-all shadow-lg shadow-rose-500/25 hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
                </button>
              </div>

              {/* Trust Markers */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Free Express Courier in South Africa over R 1,000</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>14-day hassle-free South African returns & exchanges</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Secure Debito Pay, Instant EFT & Card Checkout</span>
                </div>
              </div>
            </div>

          </div>

          {/* Details Tabs */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setActiveTab('provenance')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'provenance'
                    ? 'border-b-2 border-rose-500 text-rose-600 bg-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Fabrication
              </button>
              <button
                onClick={() => setActiveTab('dimensions')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'dimensions'
                    ? 'border-b-2 border-rose-500 text-rose-600 bg-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Fit & Cut
              </button>
              <button
                onClick={() => setActiveTab('care')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'care'
                    ? 'border-b-2 border-rose-500 text-rose-600 bg-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Care
              </button>
            </div>

            <div className="p-6 text-xs text-slate-600 leading-relaxed font-medium">
              {activeTab === 'provenance' && (
                <div className="space-y-1.5">
                  <p><strong>Composition:</strong> {product.material}</p>
                  <p><strong>Maker / Brand:</strong> {product.artisan}</p>
                  <p><strong>Origin:</strong> {product.provenance}</p>
                </div>
              )}
              {activeTab === 'dimensions' && (
                <div className="space-y-1.5">
                  <p><strong>Sizing Guide:</strong> {product.dimensions || 'Fits true to standard South African contemporary tailored sizing.'}</p>
                  <p className="text-slate-500">Models wear size S (Women) and size L (Men). Tailored for comfortable everyday wear.</p>
                </div>
              )}
              {activeTab === 'care' && (
                <div className="space-y-1.5">
                  <p>{product.care_instructions || 'Gentle wash or specialist dry clean.'}</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* RELATED PRODUCTS & RECOMMENDATIONS SECTION               */}
      {/* ======================================================== */}
      <section className="pt-12 border-t border-slate-200 space-y-8">
        
        {/* Section Header with Main Heading & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-rose-600 font-extrabold block">
              Curated Wardrobe Styling
            </span>
            <h2 className="text-2xl sm:text-3xl text-slate-900 font-black mt-1">
              {recommendationType === 'also_like' && 'You May Also Like'}
              {recommendationType === 'complete_look' && 'Complete the Look'}
              {recommendationType === 'similar' && 'Similar Products'}
              {recommendationType === 'recent' && 'Recently Viewed'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {recommendationType === 'also_like' && `Harmonious ${product.gender === 'women' ? "women's" : product.gender === 'men' ? "men's" : 'curated'} pieces matched by cut, fabric, and styling.`}
              {recommendationType === 'complete_look' && `Curated head-to-toe ensemble pairings to style with the ${product.title}.`}
              {recommendationType === 'similar' && `Alternative silhouettes and cuts crafted from equivalent quality fabrics.`}
              {recommendationType === 'recent' && 'Pieces and handcrafted accessories from your recent browsing trail.'}
            </p>
          </div>

          {/* Interactive Recommendation Mode Switchers */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setRecommendationType('also_like')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                recommendationType === 'also_like'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              You May Also Like
            </button>
            <button
              onClick={() => setRecommendationType('complete_look')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                recommendationType === 'complete_look'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Complete the Look
            </button>
            <button
              onClick={() => setRecommendationType('similar')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                recommendationType === 'similar'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Similar Products
            </button>
            <button
              onClick={() => setRecommendationType('recent')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                recommendationType === 'recent'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recently Viewed
            </button>
          </div>
        </div>

        {/* 4-Card Responsive Recommendation Grid */}
        {recommendationsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-white border border-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : displayedRecommendations.length === 0 ? (
          <div className="bg-white border border-slate-200 p-10 rounded-3xl text-center space-y-2 shadow-sm">
            <p className="text-lg font-bold text-slate-900">
              {recommendationType === 'recent' ? 'No Recently Viewed Pieces' : 'No Additional Recommendations in this Category'}
            </p>
            <p className="text-xs text-slate-500">
              Browse the catalog to view more fashionable pieces from this collection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedRecommendations.map((rec) => (
              <ProductCard
                key={rec.id}
                product={rec}
                onSelect={(newSlug) => {
                  onSelectProduct(newSlug);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        )}

      </section>

    </div>
  );
};
