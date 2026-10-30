import React, { useState } from 'react';
import { flushSync } from 'react-dom';
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
  const { addItem } = useCart();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectionAction, setSelectionAction] = useState<'cart' | 'buy'>('cart');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  const displayImage = product.primary_image || product.images?.[0] || product.variants?.find((v) => v.image_url)?.image_url || '';
  const inferredAudience = inferAudience(product);
  const audienceTag = inferredAudience ? inferredAudience.toUpperCase() : '';
  const inStockVariants = (product.variants || []).filter((v) => Number(v.stock_quantity) > 0);
  const hasVariantAttributes = inStockVariants.some((v) => Boolean(v.size || v.color));
  const totalStock = product.total_stock !== undefined
    ? Number(product.total_stock)
    : inStockVariants.reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0);
  const isOutOfStock = totalStock <= 0;
  const isLowStock = totalStock > 0 && totalStock <= 3;
  const hasDiscount = Boolean(product.original_price && product.original_price > product.base_price);

  const sizes = Array.from(new Set(inStockVariants.map((v) => v.size).filter(Boolean))) as string[];
  const colors = Array.from(new Set(inStockVariants.map((v) => v.color).filter(Boolean))) as string[];
  const filteredSizes = sizes.filter((size) => !selectedColor || inStockVariants.some((v) => v.size === size && v.color === selectedColor));
  const filteredColors = colors.filter((color) => !selectedSize || inStockVariants.some((v) => v.color === color && v.size === selectedSize));
  const selectedVariant = inStockVariants.find((v) =>
    (!sizes.length || v.size === selectedSize) && (!colors.length || v.color === selectedColor)
  );
  const defaultVariant = {
    id: product.id, product_id: product.id, sku: product.id, name: 'Default',
    size: '', color: '', price_offset: 0, stock_quantity: totalStock,
    low_stock_threshold: 3, image_url: product.primary_image || product.images?.[0] || '', created_at: '',
  } as NonNullable<Product['variants']>[number];
  const chosenVariant = hasVariantAttributes ? selectedVariant : defaultVariant;
  const maxQuantity = Number(chosenVariant?.stock_quantity || 0);

  const openSelector = (e: React.MouseEvent, action: 'cart' | 'buy') => {
    e.stopPropagation();
    const first = inStockVariants[0];
    setSelectedSize(first?.size || '');
    setSelectedColor(first?.color || '');
    setQuantity(1);
    setSelectionAction(action);
    setSelectorOpen(true);
  };

  const confirmAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chosenVariant || quantity < 1 || quantity > maxQuantity) return;
    flushSync(() => addItem(chosenVariant.id, quantity, {
      productTitle: product.title,
      variantName: chosenVariant.name || [chosenVariant.size, chosenVariant.color].filter(Boolean).join(' / ') || 'Default',
      size: chosenVariant.size || '',
      color: chosenVariant.color || '',
      productSlug: product.slug,
      unitPrice: product.base_price + Number(chosenVariant.price_offset || 0),
      imageUrl: chosenVariant.image_url || product.primary_image || product.images?.[0] || '',
      stockAvailable: maxQuantity,
    }, { openDrawer: false }));
    setSelectorOpen(false);
    if (selectionAction === 'buy') onBuyNow();
  };

  return (
    <article
      onClick={() => onSelect(product.slug)}
      className="aveart-reference-product-card group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#b7c5ad] transition-all duration-200"
    >
      <div className="relative aspect-[3/4] bg-[#f5f6f2] overflow-hidden">
        {displayImage ? (
          <img src={displayImage} alt={product.title} referrerPolicy="no-referrer" className="w-full h-full object-cover object-top group-hover:scale-[1.025] transition-transform duration-300 ease-out" loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center px-4 text-center text-xs text-slate-400">Product image unavailable</div>
        )}
        {audienceTag && <span className="absolute top-3 right-3 z-[1] bg-white/95 text-slate-900 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-[0.14em] shadow-sm">{audienceTag}</span>}
        {isOutOfStock ? (
          <div className="absolute top-3 left-3 bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">Sold Out</div>
        ) : hasDiscount ? (
          <div className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">Sale</div>
        ) : isLowStock ? (
          <div className="absolute top-3 left-3 bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">Only {totalStock} left</div>
        ) : null}
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mt-1 leading-snug line-clamp-1">{product.title}</h3>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">{product.subtitle || product.material}</p>
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2.5">
              {product.colors.map((c) => <span key={c.name} title={c.name} className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs inline-block" style={{ backgroundColor: c.hex }} />)}
              <span className="text-[11px] text-slate-400 font-medium ml-1">{product.colors.length} {product.colors.length === 1 ? 'colour' : 'colours'}</span>
            </div>
          )}
        </div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            {hasDiscount && <span className="font-mono tabular-nums text-xs text-slate-400 line-through">{formatZAR(product.original_price!)}</span>}
            <span className={'font-mono tabular-nums text-base font-extrabold ' + (hasDiscount ? 'text-[#65775D]' : 'text-slate-900')}>{formatZAR(product.base_price)}</span>
          </div>
          <span className="text-xs font-bold text-rose-600 group-hover:text-[#52664A] flex items-center gap-1">View <span aria-hidden="true">→</span></span>
        </div>

        {!isOutOfStock && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button type="button" onClick={(e) => openSelector(e, 'cart')} className="min-h-10 px-2 py-2 border border-[#87977D] text-[#52664A] hover:bg-[#f0f3ed] text-[10px] sm:text-xs font-extrabold uppercase tracking-wide rounded-lg transition-colors cursor-pointer">Add to Cart</button>
            <button type="button" onClick={(e) => openSelector(e, 'buy')} className="min-h-10 px-2 py-2 bg-[#87977D] hover:bg-[#65775D] text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-wide rounded-lg transition-colors cursor-pointer">Buy Now</button>
          </div>
        )}

        {selectorOpen && !isOutOfStock && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={(e) => { e.stopPropagation(); setSelectorOpen(false); }}>
            <section role="dialog" aria-modal="true" aria-label={'Choose options for ' + product.title} onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="text-lg font-bold text-slate-900">{product.title}</h3><p className="text-sm text-slate-500">Choose options and quantity</p></div>
                <button type="button" onClick={() => setSelectorOpen(false)} aria-label="Close selector" className="rounded-full px-3 py-1 text-slate-500 hover:bg-slate-100">✕</button>
              </div>

              {hasVariantAttributes ? (
                <>
                  {colors.length > 0 && <div>
                    <p className="mb-2 text-sm font-bold text-slate-800">Colour</p>
                    <div className="flex flex-wrap gap-2">{filteredColors.map((color) => (
                      <button key={color} type="button" onClick={() => { setSelectedColor(color); setQuantity(1); }} className={'rounded-lg border px-3 py-2 text-sm ' + (selectedColor === color ? 'border-[#65775D] bg-[#eef2eb] font-bold text-[#52664A]' : 'border-slate-200')}>{color}</button>
                    ))}</div>
                  </div>}
                  {sizes.length > 0 && <div>
                    <p className="mb-2 text-sm font-bold text-slate-800">Size</p>
                    <div className="flex flex-wrap gap-2">{filteredSizes.map((size) => (
                      <button key={size} type="button" onClick={() => { setSelectedSize(size); setQuantity(1); }} className={'rounded-lg border px-3 py-2 text-sm ' + (selectedSize === size ? 'border-[#65775D] bg-[#eef2eb] font-bold text-[#52664A]' : 'border-slate-200')}>{size}</button>
                    ))}</div>
                  </div>}
                  {!selectedVariant && <p className="text-sm text-amber-700">Choose a valid in-stock size and colour combination.</p>}
                  {selectedVariant && <p className="text-xs text-slate-500">Stock for this combination: {selectedVariant.stock_quantity}</p>}
                </>
              ) : <p className="text-sm text-slate-600">No variants for this product. Select the quantity you want.</p>}

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div><p className="text-sm font-bold text-slate-800">Quantity</p><p className="text-xs text-slate-500">{chosenVariant ? 'Maximum: ' + maxQuantity : 'Select an available combination'}</p></div>
                <div className="flex items-center gap-3">
                  <button type="button" disabled={!chosenVariant || quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-9 w-9 rounded-lg border border-slate-300 text-lg disabled:opacity-30">−</button>
                  <span className="min-w-6 text-center font-bold tabular-nums">{quantity}</span>
                  <button type="button" disabled={!chosenVariant || quantity >= maxQuantity} onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))} className="h-9 w-9 rounded-lg border border-slate-300 text-lg disabled:opacity-30">+</button>
                </div>
              </div>
              <button type="button" disabled={!chosenVariant || quantity < 1 || quantity > maxQuantity} onClick={confirmAdd} className="w-full rounded-xl bg-[#87977D] py-3 text-sm font-extrabold uppercase tracking-wide text-white hover:bg-[#65775D] disabled:cursor-not-allowed disabled:opacity-40">{selectionAction === 'buy' ? 'Continue to Checkout' : `Add ${quantity} to Cart`}</button>
            </section>
          </div>
        )}
      </div>
    </article>
  );
};
