import React from 'react';
import { Logo } from './Logo.tsx';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => (
  <footer id="aveart-footer" className="aveart-reference-footer">
    <div className="aveart-footer-main">
      <div className="aveart-footer-brand">
        <button className="aveart-footer-wordmark" onClick={() => onNavigate('home')} aria-label="AVEART home">
          <Logo className="aveart-footer-logo" />
          <span>AVEART</span>
        </button>
        <p>STYLE EDITION<br />Modern, sophisticated and made for everyday expression.</p>
      </div>
      <div className="aveart-footer-column">
        <h3>Explore</h3>
        <button onClick={() => onNavigate('catalog')}>New arrivals</button>
        <button onClick={() => onNavigate('catalog')}>Best sellers</button>
        <button onClick={() => onNavigate('catalog_gender', 'women')}>Women</button>
        <button onClick={() => onNavigate('catalog_gender', 'men')}>Men</button>
      </div>
      <div className="aveart-footer-column">
        <h3>Customer care</h3>
        <button onClick={() => onNavigate('policy', 'shipping')}>Shipping &amp; delivery</button>
        <button onClick={() => onNavigate('policy', 'returns')}>Returns</button>
        <button onClick={() => onNavigate('policy', 'size-guide')}>Size guide</button>
        <button onClick={() => onNavigate('policy', 'contact')}>Contact us</button>
      </div>
      <div className="aveart-footer-column">
        <h3>Policies</h3>
        <button onClick={() => onNavigate('policy', 'privacy')}>Privacy policy</button>
        <button onClick={() => onNavigate('policy', 'cookies')}>Cookie policy</button>
        <button onClick={() => onNavigate('policy', 'terms')}>Terms of service</button>
      </div>
      <div className="aveart-footer-column aveart-footer-newsletter">
        <h3>Follow along</h3>
        <button onClick={() => onNavigate('atelier')}>Instagram ↗</button>
        <button onClick={() => onNavigate('atelier')}>TikTok ↗</button>
        <button onClick={() => onNavigate('atelier')}>Pinterest ↗</button>
      </div>
    </div>
    <div className="aveart-footer-bottom">
      <span>© 2026 AVEART. All rights reserved.</span>
      <span>Designed with intention · Style Edition</span>
    </div>
  </footer>
);
