import React, { useState } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { Product, formatZAR } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';

interface ProductCardProps {
  product: Product;
  onSelect: (slug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : null
  );
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const fallbackImage = '/src/assets/images/fashion_women_linen_blazer_1792263530901.jpg';
  const displayImage = product.primary_image || fallbackImage;

  const isLowStock = product.total_stock !== undefined && product.total_stock > 0 && product.total_stock <= 3;
  const isOutOfStock = product.total_stock !== undefined && product.total_stock <= 0;
  const hasDiscount = product.original_price && product.original_price > product.base_price;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <article
      onClick={() => onSelect(product.slug)}
      className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:border-rose-300 transition-all duration-300"
    >
      {/* 3:4 Proportional Fashion Image Container */}
      <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
        <img
          src={displayImage}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Status Badges */}
        {isOutOfStock ? (
          <div className="absolute top-3 left-3 bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
            Sold Out
          </div>
        ) : hasDiscount ? (
          <div className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
            Sale Offer
          </div>
        ) : isLowStock ? (
          <div className="absolute top-3 left-3 bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
            Only {product.total_stock} left
          </div>
        ) : null}

        {/* Quick Add Overlay on Hover */}
        {!isOutOfStock && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            {isQuickAddOpen ? (
              <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-bold text-slate-900">Select Size</span>
                  <button
                    onClick={() => setIsQuickAddOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(product.sizes || ['XS', 'S', 'M', 'L']).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                        selectedSize === sz
                          ? 'border-rose-500 bg-rose-500 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-rose-400'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleQuickAdd}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2 text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Confirm Size · Add to Bag
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (product.sizes && product.sizes.length > 1) {
                    setIsQuickAddOpen(true);
                  } else {
                    handleQuickAdd(e);
                  }
                }}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 px-3 text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Added to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Quick Add</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          {/* Metadata (Gender · Category) */}
          <div className="flex items-center gap-1.5 text-xs text-rose-600 uppercase font-bold tracking-wider">
            <span>{product.gender || 'Fashion'}</span>
            <span aria-hidden="true">·</span>
            <span>{product.category_name}</span>
          </div>

          {/* Product Title */}
          <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-600 transition-colors mt-1 leading-snug line-clamp-1">
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
            <span className={`font-mono tabular-nums text-base font-extrabold ${hasDiscount ? 'text-rose-600' : 'text-slate-900'}`}>
              {formatZAR(product.base_price)}
            </span>
          </div>

          <span className="text-xs font-bold text-rose-600 group-hover:text-rose-700 flex items-center gap-1">
            View <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </article>
  );
};
