import React, { useState } from 'react';
import { Product, formatZAR } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';

interface ProductCardProps {
  product: Product;
  onSelect: (slug: string) => void;
  onBuyNow: () => void;
}

function inferAudience(product: any): 'women' | 'men' | 'unisex' | '' {
  // Prefer evidence in the actual product name, image filename, and product metadata.
  // Do not trust a generic stored "women" value when it conflicts with those signals.
  const images = [
    product.primary_image, product.image_url, product.imageUrl,
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.variants) ? product.variants.map((v: any) => v.image_url) : []),
  ].filter(Boolean).join(' ');
  const evidence = [
    product.title, product.name, product.subtitle, product.category_name,
    product.category, product.category_slug, product.audience,
    ...(Array.isArray(product.tags) ? product.tags : []),
    images,
  ].filter(Boolean).join(' ').toLowerCase().replace(/[_-]+/g, ' ');
  if (/\b(unisex|all gender|gender neutral)\b/.test(evidence)) return 'unisex';

  // Strong men's signals in product labels or image filenames take precedence.
  if (/\b(men|mens|men's|man|male|menswear|male clothing)\b/.test(evidence)) return 'men';
  if (/fashion men|menswear|\bmen\b/.test(images.toLowerCase())) return 'men';

  // Only mark women when the name/image/category gives a positive signal.
  if (/\b(women|womens|women's|woman|female|womenswear)\b/.test(evidence)) return 'women';
  if (/fashion women|womenswear|\bwomen\b/.test(images.toLowerCase())) return 'women';

  // Ambiguous items remain unlabelled instead of being incorrectly marked WOMEN.
  return '';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, onBuyNow }) => {
  const { addItem, closeDrawer } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : null
  );
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddIntent, setQuickAddIntent] = useState<'cart' | 'buy'>('cart');

  // Never use another product's photo as a fallback.
  const displayImage = product.primary_image || product.images?.[0] || product.variants?.find((variant) => variant.image_url)?.image_url || '';

  const inferredAudience = inferAudience(product);
  const audienceTag = inferredAudience ? inferredAudience.toUpperCase() : '';

  const isLowStock = product.total_stock !== undefined && product.total_stock > 0 && product.total_stock <= 3;
  const isOutOfStock = product.total_stock !== undefined && product.total_stock <= 0;
  const hasDiscount = product.original_price && product.original_price > product.base_price;

  const handleQuickAdd = (e?: React.MouseEvent, buyNow = false) => {
    e?.stopPropagation();
    if (!product.variants || product.variants.length === 0) {
      onSelect(product.slug);
      return;
    }

    // Match selected size or take first available
    const matchedVariant =
      product.variants.find((v) => v.size === selectedSize && v.stock_quantity > 0) ||
      product.variants.find((v) => v.stock_quantity > 0) ||
      product.variants[0];

    if (!matchedVariant || matchedVariant.stock_quantity <= 0) {
      onSelect(product.slug);
      return;
    }

    addItem(matchedVariant.id, 1, {
      productTitle: product.title,
      variantName: matchedVariant.name,
      size: matchedVariant.size,
      color: matchedVariant.color,
      productSlug: product.slug,
      unitPrice: product.base_price + matchedVariant.price_offset,
      imageUrl: matchedVariant.image_url || product.primary_image,
      stockAvailable: matchedVariant.stock_quantity,
    }, { openDrawer: !buyNow });

    if (buyNow) {
      closeDrawer();
      setIsQuickAddOpen(false);
      onBuyNow();
    }
  };

  return (
    <article
      onClick={() => onSelect(product.slug)}
      className="aveart-reference-product-card group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#b7c5ad] transition-all duration-200"
    >
      {/* 3:4 Proportional Fashion Image Container */}
      <div className="relative aspect-[3/4] bg-[#f5f6f2] overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top group-hover:scale-[1.025] transition-transform duration-300 ease-out"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center px-4 text-center text-xs text-slate-400">
            Product image unavailable
          </div>
        )}

        {/* Audience tag: separates men's and women's products visually */}
        {audienceTag && (
          <span className="absolute top-3 right-3 z-[1] bg-white/95 text-slate-900 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-[0.14em] shadow-sm">
            {audienceTag}
          </span>
        )}

        {/* Status Badges */}
        {isOutOfStock ? (
          <div className="absolute top-3 left-3 bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
            Sold Out
          </div>
        ) : hasDiscount ? (
          <div className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
            Sale
          </div>
        ) : isLowStock ? (
          <div className="absolute top-3 left-3 bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
            Only {product.total_stock} left
          </div>
        ) : null}


      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          {/* Product Title */}
          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mt-1 leading-snug line-clamp-1">
            {product.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">
            {product.subtitle || product.material}
          </p>

          {/* Colour Swatches Indicators */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2.5">
              {product.colors.map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs inline-block"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <span className="text-[11px] text-slate-400 font-medium ml-1">
                {product.colors.length} {product.colors.length === 1 ? 'colour' : 'colours'}
              </span>
            </div>
          )}
        </div>

        {/* Price Row in South African Rand (ZAR) */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            {hasDiscount && (
              <span className="font-mono tabular-nums text-xs text-slate-400 line-through">
                {formatZAR(product.original_price!)}
              </span>
            )}
            <span className={`font-mono tabular-nums text-base font-extrabold ${hasDiscount ? 'text-[#65775D]' : 'text-slate-900'}`}>
              {formatZAR(product.base_price)}
            </span>
          </div>

          <span className="text-xs font-bold text-rose-600 group-hover:text-[#52664A] flex items-center gap-1">
            View <span aria-hidden="true">→</span>
          </span>
        </div>

        {/* Purchase actions remain visible on desktop and mobile */}
        {!isOutOfStock && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!product.variants || product.variants.length === 0) {
                  onSelect(product.slug);
                } else if (product.sizes && product.sizes.length > 1) {
                  setQuickAddIntent('cart');
                  setIsQuickAddOpen(true);
                } else {
                  handleQuickAdd(e);
                }
              }}
              className="min-h-10 px-2 py-2 border border-[#87977D] text-[#52664A] hover:bg-[#f0f3ed] text-[10px] sm:text-xs font-extrabold uppercase tracking-wide rounded-lg transition-colors cursor-pointer"
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!product.variants || product.variants.length === 0) {
                  onSelect(product.slug);
                } else if (product.sizes && product.sizes.length > 1) {
                  setQuickAddIntent('buy');
                  setIsQuickAddOpen(true);
                } else {
                  handleQuickAdd(e, true);
                }
              }}
              className="min-h-10 px-2 py-2 bg-[#87977D] hover:bg-[#65775D] text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-wide rounded-lg transition-colors cursor-pointer"
            >
              Buy Now
            </button>
          </div>
        )}

        {isQuickAddOpen && !isOutOfStock && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-2 bg-white p-3 rounded-xl border border-slate-200 space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold text-slate-900">Select Size</span>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="text-slate-400 hover:text-slate-700 px-2 py-1 cursor-pointer"
                aria-label="Close size selection"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(product.sizes || ['One Size']).map((sz) => (
                <button
                  type="button"
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                    selectedSize === sz
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-emerald-400'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleQuickAdd(undefined, quickAddIntent === 'buy')}
              className="w-full bg-[#87977D] hover:bg-[#65775D] text-white py-2 text-xs font-bold rounded-lg cursor-pointer"
            >
              {quickAddIntent === 'buy' ? 'Confirm Size · Buy Now' : 'Confirm Size · Add to Cart'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
};
