import React, { useEffect, useState } from 'react';
import { ArrowRight, Truck, ShieldCheck, Heart } from 'lucide-react';
import { Product } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { AVEART_COLLECTIONS, getCollectionProducts, isVisibleStoreProduct, productImage } from '../collections.ts';
import heroStreetwearImage from '../assets/images/Editorial streetwear com duplas e sombras diagonais.png';
import heroNeutralImage from '../assets/images/Retrato urbano em tons neutros.png';

const PUBLIC_PRODUCTS_URL = 'https://aveart-products-public.delcidioeliasnhatingo.workers.dev/api/products';

const heroCampaignSlides = [
  { image: heroStreetwearImage, alt: 'AVEART urban streetwear campaign' },
  { image: heroNeutralImage, alt: 'AVEART fashion campaign in neutral tones' },
];

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
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
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

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('.aveart-reveal:not(.is-visible)'));
    if (!('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });
    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [loading, products.length]);

  const visibleProducts = products.filter(isVisibleStoreProduct);
  const newArrivalPool = getCollectionProducts(visibleProducts, 'new-arrivals');
  const heroProduct = newArrivalPool[0] || visibleProducts[0];
  const newArrivalProducts = newArrivalPool
    .filter((product) => product.id !== heroProduct?.id)
    .slice(0, 3);
  const excludedIds = new Set([heroProduct?.id, ...newArrivalProducts.map((product) => product.id)].filter(Boolean));
  const editorialProduct = visibleProducts.find((product) => !excludedIds.has(product.id));
  if (editorialProduct) excludedIds.add(editorialProduct.id);
  const shopMoreProducts = visibleProducts
    .filter((product) => !excludedIds.has(product.id))
    .slice(0, 4);

  const collectionCards = AVEART_COLLECTIONS
    .filter((collection) => collection.slug !== 'new-arrivals')
    .map((collection) => ({ collection, items: getCollectionProducts(visibleProducts, collection.slug) }))
    .filter(({ items }) => items.length > 0)
    .slice(0, 3);

  const heroImage = heroProduct ? productImage(heroProduct) : '';
  const editorialImage = editorialProduct ? productImage(editorialProduct) : '';

  return (
    <div className="aveart-home-v2">
      <section className="aveart-home-hero aveart-reveal" aria-labelledby="aveart-home-title">
        <div className="aveart-home-hero-copy">
          <p className="aveart-home-kicker">AVEART · STYLE EDITION</p>
          <h1 id="aveart-home-title">Style,<br /><span>your way.</span></h1>
          <p className="aveart-home-intro">Everyday pieces. A fresh point of view. Find the styles that feel like you.</p>
          <div className="aveart-home-actions">
            <button className="aveart-home-button" onClick={() => onNavigate('catalog')}>Shop now <ArrowRight size={15} /></button>
            <button className="aveart-home-text-button" onClick={() => document.getElementById('aveart-home-collections')?.scrollIntoView({ behavior: 'smooth' })}>Explore collections</button>
          </div>
        </div>
        <div className="aveart-home-hero-visual">
          <span className="aveart-home-hero-word" aria-hidden="true">STYLE</span>
          <img
            key={heroCampaignSlides[activeHeroSlide].image}
            className="aveart-home-hero-slide"
            src={heroCampaignSlides[activeHeroSlide].image}
            alt={heroCampaignSlides[activeHeroSlide].alt}
            decoding="async"
            fetchPriority="high"
          />
          <div className="aveart-home-hero-dots" aria-label={`Campaign image ${activeHeroSlide + 1} of ${heroCampaignSlides.length}`}>
            {heroCampaignSlides.map((slide, index) => (
              <span key={slide.alt} className={index === activeHeroSlide ? 'active' : ''} />
            ))}
          </div>
          <span className="aveart-home-hero-caption">THE EVERYDAY EDIT · AVEART</span>
        </div>
        <span className="aveart-home-hero-index">01 / NEW SEASON</span>
      </section>

      {editorialProduct && editorialImage && (
        <section className="aveart-home-editorial aveart-reveal">
          <div className="aveart-home-editorial-image">
            <img src={editorialImage} alt={editorialProduct.title} loading="lazy" decoding="async" />
            <span>AVEART / STYLE EDITION</span>
          </div>
          <div className="aveart-home-editorial-copy">
            <p className="aveart-home-kicker">A DIFFERENT POINT OF VIEW</p>
            <h2>Wear the moment.<br />Make it yours.</h2>
            <p>Easy-to-wear pieces and everyday styles, selected to fit your own way of dressing.</p>
            <button className="aveart-home-link" onClick={() => onNavigate('catalog')}>Explore the collection <ArrowRight size={14} /></button>
          </div>
        </section>
      )}

      <section className="aveart-home-section aveart-home-new-in aveart-reveal" id="aveart-home-new">
        <div className="aveart-home-section-heading">
          <div><p className="aveart-home-kicker">JUST ADDED</p><h2>New arrivals</h2></div>
          <button className="aveart-home-link" onClick={() => onNavigate('catalog_new')}>View all <ArrowRight size={14} /></button>
        </div>
        {loading ? (
          <div className="aveart-home-product-grid aveart-home-product-grid-three">
            {[1, 2, 3].map((item) => <div key={item} className="aveart-home-skeleton" />)}
          </div>
        ) : newArrivalProducts.length > 0 ? (
          <div className="aveart-home-product-grid aveart-home-product-grid-three">
            {newArrivalProducts.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={(slug) => onNavigate('product', slug)} onBuyNow={onBuyNow} />
            ))}
          </div>
        ) : (
          <div className="aveart-home-empty">
            <p>Explore the latest pieces in the AVEART collection.</p>
            <button className="aveart-home-button" onClick={() => onNavigate('catalog')}>Visit the shop <ArrowRight size={14} /></button>
          </div>
        )}
      </section>

      {collectionCards.length > 0 && (
        <section className="aveart-home-section aveart-reveal" id="aveart-home-collections">
          <div className="aveart-home-section-heading">
            <div><p className="aveart-home-kicker">FIND YOUR STYLE</p><h2>Shop by collection</h2></div>
            <button className="aveart-home-link" onClick={() => onNavigate('catalog')}>View all <ArrowRight size={14} /></button>
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

      {shopMoreProducts.length > 0 && (
        <section className="aveart-home-section aveart-home-more aveart-reveal">
          <div className="aveart-home-section-heading">
            <div><p className="aveart-home-kicker">MORE TO EXPLORE</p><h2>Find your next favourite</h2></div>
            <button className="aveart-home-link" onClick={() => onNavigate('catalog')}>Shop all products <ArrowRight size={14} /></button>
          </div>
          <div className="aveart-home-product-grid">
            {shopMoreProducts.map((product) => (
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
