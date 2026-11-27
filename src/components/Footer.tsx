import React from 'react';
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
        <p>Contemporary fashion, everyday pieces and personal style.</p>
      </div>

      <div className="aveart-footer-column">
        <h3>Collections</h3>
        <button onClick={() => openCollection(onNavigate, 'new-arrivals')}>New Arrivals</button>
        <button onClick={() => openCollection(onNavigate, 'best-sellers')}>Best Sellers</button>
        <button onClick={() => openCollection(onNavigate, 'everyday-essentials')}>Everyday Essentials</button>
        <button onClick={() => openCollection(onNavigate, 'street-style')}>Street Style</button>
        <button onClick={() => openCollection(onNavigate, 'sets-coords')}>Sets &amp; Co-ords</button>
        <button onClick={() => openCollection(onNavigate, 'sneakers-shoes')}>Sneakers &amp; Shoes</button>
        <button onClick={() => openCollection(onNavigate, 'bags-accessories')}>Bags &amp; Accessories</button>
        <button onClick={() => openCollection(onNavigate, 'activewear')}>Activewear</button>
        <button onClick={() => openCollection(onNavigate, 'special-offers')}>Special Offers</button>
      </div>

      <div className="aveart-footer-column">
        <h3>Shop</h3>
        <button onClick={() => onNavigate('catalog')}>Shop all</button>
        <button onClick={() => onNavigate('catalog_gender', 'women')}>Women</button>
        <button onClick={() => onNavigate('catalog_gender', 'men')}>Men</button>
        <button onClick={() => onNavigate('catalog_gender', 'accessories')}>Accessories</button>
        <button onClick={() => onNavigate('catalog_sale')}>Sale</button>
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
      <span>STYLE EDITION · Modern, sophisticated, minimalist.</span>
    </div>
  </footer>
);
