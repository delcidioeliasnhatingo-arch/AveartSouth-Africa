import React from 'react';
import { AVEART_COLLECTIONS } from '../collections.ts';
import { Logo } from './Logo.tsx';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

const openCollection = (onNavigate: FooterProps['onNavigate'], slug: string) => {
  onNavigate(slug === 'new-arrivals' ? 'catalog_new' : 'catalog_collection', slug);
};

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => (
  <footer id="aveart-footer" className="aveart-reference-footer">
    <div className="aveart-footer-main">
      <div className="aveart-footer-brand">
        <button className="aveart-footer-wordmark" onClick={() => onNavigate('home')} aria-label="AVEART home">
          <Logo className="aveart-footer-logo" />
          <span>AVEART</span>
        </button>
        <span className="aveart-footer-tagline">STYLE EDITION</span>
        <p>Everyday fashion and easy-to-wear pieces. Style, your way.</p>
      </div>

      <div className="aveart-footer-column">
        <h3>Collections</h3>
        {AVEART_COLLECTIONS.map((collection) => (
          <button key={collection.slug} onClick={() => openCollection(onNavigate, collection.slug)}>{collection.title}</button>
        ))}
      </div>

      <div className="aveart-footer-column">
        <h3>Shop</h3>
        <button onClick={() => onNavigate('catalog')}>Shop all</button>
        <button onClick={() => onNavigate('catalog_new')}>New arrivals</button>
        <button onClick={() => onNavigate('catalog_gender', 'unisex')}>Unisex</button>
        <button onClick={() => onNavigate('account')}>My account</button>
      </div>

      <div className="aveart-footer-column">
        <h3>Customer care</h3>
        <button onClick={() => onNavigate('policy', 'shipping')}>Shipping &amp; delivery</button>
        <button onClick={() => onNavigate('policy', 'returns')}>Returns &amp; refunds</button>
        <button onClick={() => onNavigate('policy', 'size-guide')}>Size guide</button>
        <button onClick={() => onNavigate('policy', 'contact')}>Contact us</button>
        <button onClick={() => onNavigate('track')}>Track an order</button>
      </div>

      <div className="aveart-footer-column">
        <h3>Information</h3>
        <button onClick={() => onNavigate('atelier')}>About AVEART</button>
        <button onClick={() => onNavigate('policy', 'privacy')}>Privacy policy</button>
        <button onClick={() => onNavigate('policy', 'cookies')}>Cookie policy</button>
        <button onClick={() => onNavigate('policy', 'terms')}>Terms of service</button>
      </div>
    </div>
    <div className="aveart-footer-bottom">
      <span>© 2026 AVEART. All rights reserved.</span>
      <span>STYLE EDITION</span>
    </div>
  </footer>
);
