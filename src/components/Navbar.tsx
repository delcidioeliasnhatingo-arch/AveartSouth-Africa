import React, { useState } from 'react';
import { Search, ShoppingCart, User as UserIcon, Shield, X } from 'lucide-react';
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
      <div className="bg-[#78936a] text-white text-xs py-2 px-4 text-center tracking-wide font-medium flex items-center justify-center gap-2 shadow-xs">
        <span>Complimentary shipping on all orders · Discover the new season</span>
        <span className="hidden sm:inline bg-[#e8ece4] text-[#65775d] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
          STYLE EDITION
        </span>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all shadow-xs w-full">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 min-h-[88px] py-3 flex items-center justify-between gap-5">
          <button
            onClick={() => onNavigate('home')}
            aria-label="AVEART home"
            className="flex items-center gap-3 text-slate-900 hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer group"
          >
            <Logo size={68} className="w-[68px] h-auto max-h-[52px] object-contain" />
            <span className="text-[25px] sm:text-[29px] font-bold tracking-[0.18em]">AVEART</span>
          </button>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-semibold tracking-wide text-[#555b53]">
            <button onClick={() => onNavigate('home')} className={`hover:text-[#78936a] transition-colors cursor-pointer ${currentView === 'home' ? 'text-[#78936a]' : ''}`}>Home</button>
            <button onClick={() => onNavigate('catalog')} className={`hover:text-[#78936a] transition-colors cursor-pointer ${currentView.startsWith('catalog') ? 'text-[#78936a]' : ''}`}>Shop</button>
            <button onClick={() => onNavigate('atelier')} className={`hover:text-[#78936a] transition-colors cursor-pointer ${currentView === 'atelier' ? 'text-[#78936a]' : ''}`}>Our Story</button>
            <button onClick={() => document.getElementById('aveart-footer')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#78936a] transition-colors cursor-pointer">Contact</button>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search catalog"
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            {isStaff && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-[#65775D] text-white border-rose-600 shadow-xs'
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
                currentView === 'account' ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200' : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
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
              className="relative p-2 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItemCount > 0 && (
                <span className="absolute top-1 right-0 min-w-[20px] h-[20px] px-1 text-[11px] font-extrabold bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xs animate-bounce">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

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
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#87977D] focus:bg-white text-slate-900 placeholder-slate-400 font-medium"
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
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-slate-700 font-medium transition-colors cursor-pointer"
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
