import React, { useState } from 'react';
import { Search, ShoppingCart, User as UserIcon, Shield, X, ChevronDown } from 'lucide-react';
import { AVEART_COLLECTIONS } from '../collections.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { Logo } from './Logo.tsx';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user } = useAuth();
  const { openDrawer, totalItemCount } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    onNavigate('catalog', searchQuery.trim());
    setIsSearchOpen(false);
  };

  const openCollection = (slug: string) => {
    onNavigate(slug === 'new-arrivals' ? 'catalog_new' : 'catalog_collection', slug);
    setIsCollectionsOpen(false);
  };
  const isStaff = user?.role === 'admin' || user?.role === 'store_manager';

  return (
    <>
      <div className="aveart-announcement">FREE DELIVERY ON ALL ORDERS</div>

      <header className="aveart-site-header sticky top-0 z-40 w-full">
        <div className="aveart-header-inner">
          <button onClick={() => onNavigate('home')} aria-label="AVEART home" className="aveart-wordmark">
            <Logo size="42px" className="aveart-header-logo" />
            <span>AVEART<small>STYLE EDITION</small></span>
          </button>

          <nav className="aveart-main-nav" aria-label="Main navigation">
            <button onClick={() => onNavigate('catalog')} className={currentView.startsWith('catalog') ? 'active' : ''}>Shop</button>
            <button onClick={() => onNavigate('catalog_new')} className={currentView === 'catalog_new' ? 'active' : ''}>New In</button>
            <div className="aveart-nav-dropdown">
              <button type="button" aria-expanded={isCollectionsOpen} onClick={() => setIsCollectionsOpen((open) => !open)}>
                Collections <ChevronDown size={13} />
              </button>
              {isCollectionsOpen && (
                <div className="aveart-collections-menu">
                  {AVEART_COLLECTIONS.map((collection) => (
                    <button key={collection.slug} type="button" onClick={() => openCollection(collection.slug)}>{collection.title}</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => onNavigate('catalog_gender', 'unisex')}>Unisex</button>
            <button onClick={() => onNavigate('atelier')} className={currentView === 'atelier' ? 'active' : ''}>Our Story</button>
          </nav>

          <div className="aveart-header-actions">
            <button onClick={() => setIsSearchOpen(true)} aria-label="Search products"><Search size={19} /></button>
            {isStaff && <button onClick={() => onNavigate('admin')} aria-label="Open admin hub" className="aveart-admin-shortcut"><Shield size={17} /><span>Admin</span></button>}
            <button onClick={() => onNavigate('account')} aria-label="Customer account" className={currentView === 'account' ? 'active' : ''}>
              <UserIcon size={19} />
            </button>
            <button onClick={openDrawer} aria-label="View shopping bag" className="aveart-bag-button">
              <ShoppingCart size={19} />
              {totalItemCount > 0 && <span className="aveart-bag-count">{totalItemCount}</span>}
            </button>
          </div>
        </div>

        <nav className="aveart-mobile-nav" aria-label="Mobile navigation">
          <button onClick={() => onNavigate('catalog')}>Shop</button>
          <button onClick={() => onNavigate('catalog_new')}>New In</button>
          <button onClick={() => setIsCollectionsOpen((open) => !open)} aria-expanded={isCollectionsOpen}>Collections</button>
          <button onClick={() => onNavigate('catalog_gender', 'unisex')}>Unisex</button>
        </nav>
      </header>

      {isCollectionsOpen && (
        <div className="aveart-mobile-collections">
          {AVEART_COLLECTIONS.map((collection) => (
            <button key={collection.slug} type="button" onClick={() => openCollection(collection.slug)}>{collection.title}</button>
          ))}
        </div>
      )}

      {isSearchOpen && (
        <div className="aveart-search-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsSearchOpen(false); }}>
          <section className="aveart-search-panel" role="dialog" aria-modal="true" aria-label="Search AVEART products">
            <div className="aveart-search-heading">
              <span>Search products</span>
              <button onClick={() => setIsSearchOpen(false)} aria-label="Close search"><X size={19} /></button>
            </div>
            <form onSubmit={handleSearchSubmit}>
              <input
                type="search"
                autoFocus
                placeholder="What are you looking for?"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                aria-label="Search products"
              />
              <button type="submit" disabled={!searchQuery.trim()}>Search</button>
            </form>
          </section>
        </div>
      )}
    </>
  );
};
