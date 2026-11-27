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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('catalog', searchQuery.trim());
      setIsSearchOpen(false);
    }
  };

  const isStaff = user?.role === 'admin' || user?.role === 'store_manager';

  return (
    <>
      <div className="bg-[#111111] text-white text-xs py-2 px-4 text-center tracking-wide font-medium flex items-center justify-center gap-2 shadow-xs">
        <span>Complimentary shipping on all orders · Discover the new season</span>
        <span className="hidden sm:inline bg-white text-[#111111] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
          STYLE EDITION
        </span>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all shadow-xs w-full">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 min-h-[68px] sm:min-h-[76px] py-2 flex items-center justify-between gap-3 sm:gap-5">
          <button
            onClick={() => onNavigate('home')}
            aria-label="AVEART home"
            className="flex items-center gap-2 text-slate-900 hover:text-black transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer group"
          >
            <Logo size="clamp(42px, 4.2vw, 62px)" className="h-auto max-h-[30px] sm:max-h-[38px] object-contain" />
            <span className="text-[17px] sm:text-[23px] font-bold tracking-[0.10em] sm:tracking-[0.14em]">AVEART</span>
          </button>

          <nav className="hidden md:flex items-center gap-7 text-[11px] font-semibold tracking-wide text-[#555b53]">
            <button onClick={() => onNavigate('home')} className={`hover:text-black transition-colors cursor-pointer ${currentView === 'home' ? 'text-black' : ''}`}>Home</button>
            <button onClick={() => onNavigate('catalog')} className={`hover:text-black transition-colors cursor-pointer ${currentView.startsWith('catalog') ? 'text-black' : ''}`}>Shop</button>
            <div className="relative">
              <button type="button" aria-expanded={isCollectionsOpen} onClick={() => setIsCollectionsOpen((open) => !open)} className="inline-flex items-center gap-1.5 hover:text-black transition-colors cursor-pointer">
                Collections <ChevronDown size={13} />
              </button>
              {isCollectionsOpen && (
                <div className="absolute left-0 top-full z-50 mt-4 w-64 max-h-[70vh] overflow-y-auto border border-neutral-200 bg-white p-2 shadow-xl">
                  {AVEART_COLLECTIONS.map((collection) => (
                    <button key={collection.slug} type="button" onClick={() => { onNavigate(collection.slug === 'new-arrivals' ? 'catalog_new' : 'catalog_collection', collection.slug); setIsCollectionsOpen(false); }} className="block w-full px-3 py-2.5 text-left text-xs text-neutral-700 hover:bg-neutral-100 hover:text-black">
                      {collection.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => onNavigate('catalog_sale')} className="hover:text-black transition-colors cursor-pointer">Sale</button>
            <button onClick={() => onNavigate('atelier')} className={`hover:text-black transition-colors cursor-pointer ${currentView === 'atelier' ? 'text-black' : ''}`}>Our Story</button>
            <button onClick={() => document.getElementById('aveart-footer')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-black transition-colors cursor-pointer">Contact</button>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search catalog"
              className="p-2 text-slate-600 hover:text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            {isStaff && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-[#111111] text-white border-black shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Hub</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('account')}
              aria-label="Customer Account"
              className={`flex items-center gap-1.5 p-2 rounded-full transition-colors cursor-pointer ${
                currentView === 'account' ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200' : 'text-slate-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <UserIcon className="w-5 h-5" />
              {user && (
                <span className="hidden lg:inline text-xs font-bold text-slate-800 truncate max-w-[100px]">
                  {user.name.split(' ')[0]}
                </span>
              )}
            </button>

            <button
              onClick={openDrawer}
              aria-label="View Shopping Bag"
              className="relative p-2 text-slate-700 hover:text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItemCount > 0 && (
                <span className="absolute top-1 right-0 min-w-[20px] h-[20px] px-1 text-[11px] font-extrabold bg-black text-white rounded-full flex items-center justify-center shadow-xs animate-bounce">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="md:hidden flex items-center justify-center gap-5 border-t border-neutral-100 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-700">
          <button type="button" onClick={() => onNavigate('catalog')}>Shop</button>
          <button type="button" onClick={() => onNavigate('catalog_new')}>New</button>
          <button type="button" onClick={() => setIsCollectionsOpen((open) => !open)}>Collections</button>
          <button type="button" onClick={() => onNavigate('catalog_sale')}>Sale</button>
        </div>
      </header>

      {isCollectionsOpen && (
        <div className="md:hidden relative z-30 grid grid-cols-2 gap-1 border-b border-neutral-200 bg-white px-4 py-3">
          {AVEART_COLLECTIONS.map((collection) => (
            <button key={collection.slug} type="button" onClick={() => { onNavigate(collection.slug === 'new-arrivals' ? 'catalog_new' : 'catalog_collection', collection.slug); setIsCollectionsOpen(false); }} className="px-2 py-3 text-left text-xs text-neutral-700 hover:bg-neutral-100">
              {collection.title}
            </button>
          ))}
        </div>
      )}

      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl p-6 rounded-xl shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <span>Search Fashion Collection</span>
              </span>
              <button
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSearchSubmit} className="mt-4 flex gap-3">
              <input
                type="text"
                autoFocus
                placeholder="Search blazers, dresses, denim, linen, shirts, hoodies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white text-slate-900 placeholder-slate-400 font-medium"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 text-sm font-bold rounded-xl shadow-md transition-colors whitespace-nowrap cursor-pointer"
              >
                Search
              </button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Trending searches:</span>
              {['Linen Blazer', 'Silk Dress', 'Selvedge Denim', 'Cotton Shirt', 'Merino Knit'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    setSearchQuery(term);
                    onNavigate('catalog', term);
                    setIsSearchOpen(false);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-neutral-100 hover:text-black rounded-lg text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
