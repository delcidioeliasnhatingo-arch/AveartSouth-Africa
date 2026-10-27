import React, { useEffect, useState } from 'react';
import { ArrowRight, Truck, ShieldCheck, Heart, Mail } from 'lucide-react';
import { Product } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import heroImage from '../assets/images/fashion_women_linen_blazer_1792263530901.jpg';
import womenImage from '../assets/images/fashion_women_silk_midi_dress_1792263530827.jpg';
import menImage from '../assets/images/fashion_men_wool_overshirt_1792263531608.jpg';
import accessoriesImage from '../assets/images/fashion_acc_leather_tote_1792263547555.jpg';

interface HomeViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'women' | 'men' | 'accessories'>('all');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((productsData) => {
        setProducts(Array.isArray(productsData) ? productsData : []);
      })
      .catch((err) => console.error('Error fetching home data:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((product) => {
    if (activeTab === 'women') return product.gender === 'women';
    if (activeTab === 'men') return product.gender === 'men';
    if (activeTab === 'accessories') {
      const categoryText = String(product.category ?? '').toLowerCase();
      return categoryText.includes('accessor') || categoryText.includes('bag');
    }
    return true;
  });

  const handleNewsletterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
  };

  return (
    <div className="aveart-reference-home">
      {/* 1. HERO */}
      <section className="aveart-reference-hero">
        <img src={heroImage} alt="Contemporary AVEART fashion collection" className="aveart-reference-hero-image" />
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

      {/* 2. BENEFITS STRIP */}
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

      {/* 3. BEST SELLERS — live products remain connected to the existing API */}
      <section className="aveart-reference-section" id="best-sellers">
        <div className="aveart-section-heading">
          <div>
            <p className="aveart-eyebrow">The considered edit</p>
            <h2>Best Sellers</h2>
            <p className="aveart-section-intro">Everyday favourites, chosen to work beautifully together.</p>
          </div>
          <button className="aveart-text-link" onClick={() => onNavigate('catalog')}>Shop all pieces <ArrowRight size={15} /></button>
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
              <ProductCard key={product.id} product={product} onSelect={(slug) => onNavigate('product', slug)} />
            ))}
          </div>
        ) : (
          <div className="aveart-empty-products">
            <p>No products in this selection yet.</p>
            <button className="aveart-text-link" onClick={() => setActiveTab('all')}>View all pieces <ArrowRight size={15} /></button>
          </div>
        )}
      </section>

      {/* 4. EDITORIAL SPLIT */}
      <section className="aveart-reference-editorial">
        <div className="aveart-editorial-image-wrap">
          <img src={heroImage} alt="AVEART modern tailoring editorial" />
        </div>
        <div className="aveart-editorial-copy">
          <p className="aveart-eyebrow">The AVEART point of view</p>
          <h2>Made for your<br />everyday story.</h2>
          <p>Personal style should feel effortless. Explore considered shapes, versatile pieces and finishing touches that make getting dressed feel like you.</p>
          <button className="aveart-outline-button" onClick={() => onNavigate('atelier')}>Discover our story <ArrowRight size={15} /></button>
        </div>
      </section>

      {/* 5. SHOP BY CATEGORY */}
      <section className="aveart-reference-section aveart-category-section">
        <div className="aveart-section-heading centered">
          <div>
            <p className="aveart-eyebrow">Find your next favourite</p>
            <h2>Shop by Category</h2>
          </div>
        </div>
        <div className="aveart-category-grid">
          <button className="aveart-category-card" onClick={() => onNavigate('catalog_gender', 'women')}>
            <img src={womenImage} alt="Women's fashion" />
            <span className="aveart-category-overlay" />
            <span className="aveart-category-copy"><small>Explore the edit</small><strong>Women</strong><span>Shop women <ArrowRight size={15} /></span></span>
          </button>
          <button className="aveart-category-card" onClick={() => onNavigate('catalog_gender', 'men')}>
            <img src={menImage} alt="Men's fashion" />
            <span className="aveart-category-overlay" />
            <span className="aveart-category-copy"><small>Everyday essentials</small><strong>Men</strong><span>Shop men <ArrowRight size={15} /></span></span>
          </button>
          <button className="aveart-category-card" onClick={() => onNavigate('catalog_gender', 'accessories')}>
            <img src={accessoriesImage} alt="Bags and accessories" />
            <span className="aveart-category-overlay" />
            <span className="aveart-category-copy"><small>The finishing touch</small><strong>Bags &amp; Accessories</strong><span>Shop accessories <ArrowRight size={15} /></span></span>
          </button>
        </div>
      </section>

      {/* 6. NEWSLETTER */}
      <section className="aveart-reference-newsletter">
        <div className="aveart-newsletter-inner">
          <p className="aveart-eyebrow">A note from AVEART</p>
          <h2>A little more style<br />in your inbox.</h2>
          <p>Be first to discover new arrivals, considered edits and updates from AVEART.</p>
          {newsletterSubscribed ? (
            <p className="aveart-newsletter-success" role="status">Thank you for joining the AVEART list.</p>
          ) : (
            <form className="aveart-newsletter-form" onSubmit={handleNewsletterSubmit}>
              <label className="sr-only" htmlFor="aveart-newsletter-email">Email address</label>
              <input id="aveart-newsletter-email" type="email" required value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} placeholder="Your email address" />
              <button type="submit">Sign me up <ArrowRight size={15} /></button>
            </form>
          )}
          <small><Mail size={13} /> Thoughtful updates only. Unsubscribe whenever you like.</small>
        </div>
      </section>
    </div>
  );
};
