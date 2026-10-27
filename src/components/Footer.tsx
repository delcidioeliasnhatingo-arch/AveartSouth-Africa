import React, { useState } from 'react';
import { ArrowUpRight, Instagram, Mail } from 'lucide-react';
import { Logo } from './Logo.tsx';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (event: React.FormEvent) => {
    event.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="aveart-reference-footer">
      <div className="aveart-footer-main">
        <div className="aveart-footer-brand">
          <button className="aveart-footer-wordmark" onClick={() => onNavigate('home')} aria-label="AVEART home">
            <Logo className="aveart-footer-logo" />
            <span>AVEART</span>
          </button>
          <p>Modern, considered style for the everyday. Discover versatile pieces designed to become part of your story.</p>
          <span className="aveart-footer-tagline">STYLE EDITION</span>
        </div>
        <div className="aveart-footer-column">
          <h3>Explore</h3>
          <button onClick={() => onNavigate('home')}>Home</button>
          <button onClick={() => onNavigate('catalog')}>Shop all</button>
          <button onClick={() => onNavigate('catalog_gender', 'women')}>Women</button>
          <button onClick={() => onNavigate('catalog_gender', 'men')}>Men</button>
          <button onClick={() => onNavigate('catalog_gender', 'accessories')}>Bags &amp; accessories</button>
        </div>
        <div className="aveart-footer-column">
          <h3>Customer care</h3>
          <button onClick={() => onNavigate('policy', 'shipping')}>Delivery information</button>
          <button onClick={() => onNavigate('policy', 'returns')}>Returns &amp; exchanges</button>
          <button onClick={() => onNavigate('policy', 'privacy')}>Privacy policy</button>
          <button onClick={() => onNavigate('policy', 'terms')}>Terms of service</button>
          <button onClick={() => onNavigate('track')}>Track an order</button>
        </div>
        <div className="aveart-footer-column aveart-footer-newsletter">
          <h3>Follow along</h3>
          <p>New arrivals, styling notes and thoughtful updates from AVEART.</p>
          {isSubscribed ? (
            <p className="aveart-footer-success" role="status">Thanks for joining the list.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="aveart-footer-form">
              <label className="sr-only" htmlFor="aveart-footer-email">Email address</label>
              <input id="aveart-footer-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" />
              <button type="submit" aria-label="Subscribe to AVEART updates"><ArrowUpRight size={17} /></button>
            </form>
          )}
          <button className="aveart-footer-social" onClick={() => onNavigate('atelier')}><Instagram size={15} /> Discover AVEART <ArrowUpRight size={13} /></button>
        </div>
      </div>
      <div className="aveart-footer-bottom">
        <span>© {new Date().getFullYear()} AVEART. All rights reserved.</span>
        <span>Thoughtfully selected. Effortlessly styled.</span>
      </div>
    </footer>
  );
};
