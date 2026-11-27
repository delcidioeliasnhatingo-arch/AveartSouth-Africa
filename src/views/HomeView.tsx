import React, { useEffect, useState } from 'react';
import { ArrowRight, Truck, ShieldCheck, Heart } from 'lucide-react';
import { Product } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { AVEART_COLLECTIONS, getCollectionProducts, isVisibleStoreProduct, productImage } from '../collections.ts';

const PUBLIC_PRODUCTS_URL = 'https://aveart-products-public.delcidioeliasnhatingo.workers.dev/api/products';

function hasProductImage(product: any): boolean {
  return Boolean([
    product?.primary_image, product?.image_url, product?.imageUrl,
    product?.thumbnail_url, product?.thumbnail,
    ...(Array.isArray(product?.images) ? product.images : []),
    ...(Array.isArray(product?.variants) ? product.variants.flatMap((variant: any) => [variant?.images?.[0], variant?.image_url, variant?.imageUrl]) : []),
  ].some((image) => typeof image === 'string' && image.trim()));
}

async function fetchProductsWithFallback(url: string, signal: AbortSignal): Promise<Response> {
  let lastError: unknown;
  for (const endpoint of [url, PUBLIC_PRODUCTS_URL]) {
    try {
      const response = await fetch(endpoint, { signal, headers: { Accept: 'application/json' } });
      if (!response.ok) { lastError = new Error('Product API returned HTTP ' + response.status); continue; }
      const data = await response.clone().json();
      const rows = Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : Array.isArray(data?.data) ? data.data : [];
      if (rows.length) return response;
      lastError = new Error('Product API returned an empty catalogue');
    } catch (error: any) {
      if (error?.name === 'AbortError') throw error;
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Unable to load AVEART products');
}

interface HomeViewProps {
  onNavigate: (view: string, param?: string) => void;
  onBuyNow: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onBuyNow }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('aveart:products:v1');
      const parsed = cached ? JSON.parse(cached) : [];
      return Array.isArray(parsed) ? parsed.filter((product: any) => hasProductImage(product) && isVisibleStoreProduct(product)) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(() => {
    try { return !Array.isArray(JSON.parse(localStorage.getItem('aveart:products:v1') || 'null')); }
    catch { return true; }
  });

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 6500);
    fetchProductsWithFallback('/api/products', controller.signal)
      .then((response) => response.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : Array.isArray(data?.data) ? data.data : [];
        const visibleProducts = rows.filter((product: any) =>
          product && (product.title || product.name) && hasProductImage(product) &&
          Number(product.base_price ?? product.price ?? 0) > 0 && isVisibleStoreProduct(product)
        );
        try { localStorage.setItem('aveart:products:v1', JSON.stringify(visibleProducts)); } catch {}
        setProducts(visibleProducts);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.error('Error loading AVEART products:', error);
      })
      .finally(() => {
        window.clearTimeout(timer);
        setLoading(false);
      });
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, []);

  const visibleProducts = products.filter(isVisibleStoreProduct);
  const collectionCards = AVEART_COLLECTIONS
    .filter((collection) => collection.slug !== 'new-arrivals')
    .map((collection) => ({ collection, items: getCollectionProducts(visibleProducts, collection.slug) }))
    .filter(({ items }) => items.length > 0)
    .slice(0, 4);
  const selectedProducts = [...visibleProducts]
    .sort((a, b) => Date.parse(String((b as any).created_at || '')) - Date.parse(String((a as any).created_at || '')))
    .slice(0, 8);
  const newArrivalProducts = getCollectionProducts(visibleProducts, 'new-arrivals').slice(0, 4);

  return (
    <div className="aveart-home-v2">
      <section className="aveart-home-hero" aria-labelledby="aveart-home-title">
        <div className="aveart-home-hero-copy">
          <p className="aveart-home-kicker">AVEART · STYLE EDITION</p>
          <h1 id="aveart-home-title">Style, your way.</h1>
          <p className="aveart-home-intro">Discover easy-to-wear pieces and everyday styles selected for your own way of dressing.</p>
          <div className="aveart-home-actions">
            <button className="aveart-home-button" onClick={() => onNavigate('catalog')}>Shop all <ArrowRight size={15} /></button>
            <button className="aveart-home-text-button" onClick={() => document.getElementById('aveart-home-collections')?.scrollIntoView({ behavior: 'smooth' })}>Explore collections</button>
          </div>
        </div>
        <div className="aveart-home-hero-note" aria-hidden="true">
          <span>MODERN</span><span>EVERYDAY</span><span>YOUR STYLE</span>
          <strong>AVEART</strong>
        </div>
      </section>

      {collectionCards.length > 0 && (
        <section className="aveart-home-section" id="aveart-home-collections">
          <div className="aveart-home-section-heading">
            <div><p className="aveart-home-kicker">Find your style</p><h2>Shop by collection</h2></div>
            <button className="aveart-home-link" onClick={() => onNavigate('catalog')}>View all collections <ArrowRight size={14} /></button>
          </div>
          <div className="aveart-home-collections">
            {collectionCards.map(({ collection, items }) => (
              <button key={collection.slug} type="button" className="aveart-home-collection" onClick={() => onNavigate('catalog_collection', collection.slug)}>
                <img src={productImage(items[0])} alt="" loading="lazy" decoding="async" />
                <span className="aveart-home-collection-label">{collection.title}<ArrowRight size={14} /></span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="aveart-home-section" id="aveart-home-products">
        <div className="aveart-home-section-heading">
          <div><p className="aveart-home-kicker">Explore AVEART</p><h2>Shop the collection</h2></div>
          <button className="aveart-home-link" onClick={() => onNavigate('catalog')}>Shop all products <ArrowRight size={14} /></button>
        </div>
        {loading ? (
          <div className="aveart-home-product-grid">
            {[1, 2, 3, 4].map((item) => <div key={item} className="aveart-home-skeleton" />)}
          </div>
        ) : selectedProducts.length > 0 ? (
          <div className="aveart-home-product-grid">
            {selectedProducts.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={(slug) => onNavigate('product', slug)} onBuyNow={onBuyNow} />
            ))}
          </div>
        ) : (
          <div className="aveart-home-empty">
            <p>New pieces are being added to the collection.</p>
            <button className="aveart-home-button" onClick={() => onNavigate('catalog')}>Visit the shop <ArrowRight size={14} /></button>
          </div>
        )}
      </section>

      {newArrivalProducts.length > 0 && (
        <section className="aveart-home-section aveart-home-new-in">
          <div className="aveart-home-section-heading">
            <div><p className="aveart-home-kicker">Just added</p><h2>New arrivals</h2></div>
            <button className="aveart-home-link" onClick={() => onNavigate('catalog_new')}>See what's new <ArrowRight size={14} /></button>
          </div>
          <div className="aveart-home-product-grid">
            {newArrivalProducts.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={(slug) => onNavigate('product', slug)} onBuyNow={onBuyNow} />
            ))}
          </div>
        </section>
      )}

      <section className="aveart-home-benefits" aria-label="Shopping benefits">
        <div><Truck size={20} strokeWidth={1.6} /><span><strong>Free delivery</strong><small>On all orders</small></span></div>
        <div><ShieldCheck size={20} strokeWidth={1.6} /><span><strong>Secure checkout</strong><small>Shop with confidence</small></span></div>
        <div><Heart size={20} strokeWidth={1.6} /><span><strong>Here to help</strong><small>Support when you need it</small></span></div>
      </section>
    </div>
  );
};
