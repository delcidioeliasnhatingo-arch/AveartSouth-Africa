import React, { useEffect, useState } from 'react';
import { ArrowRight, Truck, ShieldCheck, Heart } from 'lucide-react';
import { Product } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { AVEART_COLLECTIONS, getCollectionProducts, productImage } from '../collections.ts';
import heroImage from '../assets/images/Editorial streetwear com duplas e sombras diagonais.png';
import womenImage from '../assets/images/fashion_women_silk_midi_dress_1792263530827.jpg';
import neutralEditorialImage from '../assets/images/Retrato urbano em tons neutros.png';

const PUBLIC_PRODUCTS_URL = 'https://aveart-products-public.delcidioeliasnhatingo.workers.dev/api/products';

function hasProductImage(product: any): boolean {
  return Boolean([product?.primary_image, product?.image_url, product?.imageUrl, product?.thumbnail_url, product?.thumbnail, ...(Array.isArray(product?.images) ? product.images : []), ...(Array.isArray(product?.variants) ? product.variants.map((variant: any) => variant?.image_url ?? variant?.imageUrl) : [])].some((image) => typeof image === 'string' && image.trim()));
}

async function fetchProductsWithFallback(url: string, signal: AbortSignal): Promise<Response> {
  let lastError: unknown;
  for (const endpoint of [url, PUBLIC_PRODUCTS_URL]) {
    try {
      const response = await fetch(endpoint, { signal, headers: { Accept: 'application/json' } });
      if (!response.ok) { lastError = new Error(`Product API returned HTTP ${response.status}`); continue; }
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
      return Array.isArray(parsed) ? parsed.filter((product: any) => hasProductImage(product)) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(() => {
    try { return !Array.isArray(JSON.parse(localStorage.getItem('aveart:products:v1') || 'null')); }
    catch { return true; }
  });
  const [activeTab, setActiveTab] = useState<'all' | 'women' | 'men' | 'accessories'>('all');
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  const heroSlides = [
    { image: heroImage, alt: 'AVEART fashion editorial with modern streetwear' },
    { image: neutralEditorialImage, alt: 'AVEART timeless neutral-toned fashion editorial' },
  ];

  useEffect(() => {
    const slideTimer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 5000);
    return () => window.clearInterval(slideTimer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 6500);
    fetchProductsWithFallback('/api/products', controller.signal)
      .then((r) => {
        if (!r.ok) throw new Error(`Product catalogue returned HTTP ${r.status}`);
        return r.json();
      })
      .then((productsData) => {
        const liveProducts = Array.isArray(productsData)
          ? productsData
          : Array.isArray(productsData?.products)
          ? productsData.products
          : Array.isArray(productsData?.data)
          ? productsData.data
          : [];
        const validProducts = liveProducts.filter((product: any) =>
          product && (product.title || product.name) && hasProductImage(product) &&
          Number(product.base_price ?? product.price ?? 0) > 0
        );
        try { localStorage.setItem('aveart:products:v1', JSON.stringify(validProducts)); } catch {}
        setProducts(validProducts);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') console.error('Error fetching home data:', err);
      })
      .finally(() => {
        window.clearTimeout(timer);
        setLoading(false);
      });
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, []);

  const bestSellerProducts = getCollectionProducts(products, 'best-sellers');
  const filteredProducts = bestSellerProducts.filter((product) => {
    if (activeTab === 'women') return product.gender === 'women';
    if (activeTab === 'men') return product.gender === 'men';
    if (activeTab === 'accessories') {
      const categoryText = String(product.category_name ?? '').toLowerCase();
      const tags = Array.isArray(product.tags) ? product.tags.join(' ').toLowerCase() : '';
      return /accessor|bag|cap|belt/.test(categoryText + ' ' + tags);
    }
    return true;
  });
  const newArrivalProducts = getCollectionProducts(products, 'new-arrivals').slice(0, 8);
  const collectionCards = AVEART_COLLECTIONS
    .map((collection) => ({ collection, items: getCollectionProducts(products, collection.slug) }))
    .filter(({ items }) => items.length > 0);

  return (
    <div className="aveart-reference-home">
      {/* 1. HERO */}
      <section className="aveart-reference-hero">
        <img key={heroSlides[activeHeroSlide].image} src={heroSlides[activeHeroSlide].image} alt={heroSlides[activeHeroSlide].alt} className="aveart-reference-hero-image aveart-hero-slide-fade" loading="eager" fetchPriority="high" decoding="async" />
        <div className="aveart-hero-slide-indicators" aria-label={`Slide ${activeHeroSlide + 1} of ${heroSlides.length}`}>
          {heroSlides.map((slide, index) => <span key={slide.alt} className={index === activeHeroSlide ? "aveart-hero-dot active" : "aveart-hero-dot"} />)}
        </div>
        <div className="aveart-reference-hero-shade" />
        <div className="aveart-reference-hero-content">
          <p className="aveart-eyebrow">Modern / Sophisticated / Minimal</p>
          <h1>Timeless<br />Style</h1>
          <p className="aveart-hero-copy">Effortless looks for every moment. Discover considered essentials designed to move with you.</p>
          <button className="aveart-primary-button" onClick={() => onNavigate('catalog')}>
            Shop the collection <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* 3. BEST SELLERS — only products explicitly marked as featured or supported by sales data */}
      {(loading || filteredProducts.length > 0) && (
      <section className="aveart-reference-section" id="best-sellers">
        <div className="aveart-section-heading">
          <div>
            <p className="aveart-eyebrow">The edit</p>
            <h2>Best Sellers</h2>
            
          </div>
          <button className="aveart-text-link" onClick={() => onNavigate('catalog')}>Explore all pieces ↗</button>
        </div>
        <div className="aveart-filter-row" role="group" aria-label="Filter best sellers">
          {([
            ['all', 'All pieces'],
            ['women', 'Women'],
            ['men', 'Men'],
            ['accessories', 'Accessories'],
          ] as const).map(([value, label]) => (
            <button key={value} className={activeTab === value ? 'aveart-filter active' : 'aveart-filter'} onClick={() => setActiveTab(value)}>{label}</button>
          ))}
        </div>
        {loading ? (
          <div className="aveart-product-grid">
            {[1, 2, 3, 4].map((item) => <div key={item} className="aveart-product-skeleton" />)}
          </div>
        ) : filteredProducts.length ? (
          <div className="aveart-product-grid">
            {filteredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} onSelect={(slug) => onNavigate('product', slug)} onBuyNow={onBuyNow} />
            ))}
          </div>
        ) : (
          <div className="aveart-empty-products">
            <p>No products in this selection yet.</p>
            <button className="aveart-text-link" onClick={() => setActiveTab('all')}>View all pieces <ArrowRight size={15} /></button>
          </div>
        )}
      </section>
      )}

      {newArrivalProducts.length > 0 && (
        <section className="aveart-reference-section" id="new-arrivals">
          <div className="aveart-section-heading">
            <div>
              <p className="aveart-eyebrow">Recently added</p>
              <h2>New Arrivals</h2>
              <p className="aveart-section-intro">Fresh additions to the AVEART collection.</p>
            </div>
            <button className="aveart-text-link" onClick={() => onNavigate('catalog_new')}>Shop new arrivals ↗</button>
          </div>
          <div className="aveart-product-grid">
            {newArrivalProducts.map((product) => (
              <ProductCard key={product.id} product={product} onSelect={(slug) => onNavigate('product', slug)} onBuyNow={onBuyNow} />
            ))}
          </div>
        </section>
      )}

      {/* 4. EDITORIAL SPLIT */}
      <section className="aveart-reference-editorial">
        <div className="aveart-editorial-image-wrap">
          <img src={womenImage} alt="AVEART women’s silk midi dress editorial" loading="lazy" decoding="async" />
        </div>
        <div className="aveart-editorial-copy">
          <p className="aveart-eyebrow">Style, your way</p>
          <h2>Made for your<br />everyday story.</h2>
          <p>Versatile silhouettes, considered details and effortless combinations. Find the pieces that feel like you.</p>
          <button className="aveart-outline-button" onClick={() => onNavigate('atelier')}>Discover the edit <ArrowRight size={15} /></button>
        </div>
      </section>

      {/* 6. SHOP BY COLLECTION — only show collections that contain published products with photos */}
      {collectionCards.length > 0 && (
        <section className="aveart-reference-section aveart-collection-section" id="collections">
          <div className="aveart-section-heading centered">
            <div>
              <p className="aveart-eyebrow">Explore the edit</p>
              <h2>Shop by collection</h2>
            </div>
          </div>
          <div className="aveart-collection-grid">
            {collectionCards.map(({ collection, items }) => (
              <button key={collection.slug} type="button" className="aveart-collection-card" onClick={() => onNavigate('catalog_collection', collection.slug)}>
                <img src={productImage(items[0])} alt={collection.title} loading="lazy" decoding="async" />
                <span className="aveart-collection-shade" />
                <span className="aveart-collection-copy">
                  <small>{collection.eyebrow}</small>
                  <strong>{collection.title}</strong>
                  <span>Explore collection ↗</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 7. EDITORIAL CTA — no pretend newsletter subscription until a mailing service is connected */}
      <section className="aveart-reference-newsletter">
        <div className="aveart-newsletter-inner">
          <p className="aveart-eyebrow">The AVEART edit</p>
          <h2>A little more style in every day.</h2>
          <p>Explore the latest additions and find pieces that fit your own way of dressing.</p>
          <button className="aveart-primary-button" onClick={() => onNavigate('catalog_new')}>Explore New Arrivals <ArrowRight size={15} /></button>
        </div>
      </section>

      {/* 8. SHOPPING ASSURANCE — placed directly above the footer */}
      {/* BENEFITS STRIP */}
      <section className="aveart-reference-benefits" aria-label="Shopping benefits">
        <div className="aveart-benefit">
          <Truck size={23} strokeWidth={1.6} />
          <div><strong>Thoughtful delivery</strong><span>Clear shipping updates</span></div>
        </div>
        <div className="aveart-benefit">
          <ShieldCheck size={23} strokeWidth={1.6} />
          <div><strong>Secure checkout</strong><span>Your details stay protected</span></div>
        </div>
        <div className="aveart-benefit">
          <Heart size={23} strokeWidth={1.6} />
          <div><strong>Here to help</strong><span>Customer support when you need it</span></div>
        </div>
      </section>
    </div>
  );
};
