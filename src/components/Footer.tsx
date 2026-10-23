import React, { useState } from 'react';
import { Mail, Check, ShieldCheck, Truck, RotateCcw, Heart } from 'lucide-react';
import { Logo } from './Logo.tsx';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-200 pt-16 pb-12 border-t border-slate-800 mt-20 w-full">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        
        {/* Value Props Row - Fresh, colorful, accessible */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-12 mb-12 border-b border-slate-800">
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">Free SA Delivery</h5>
              <p className="text-xs text-slate-400">Free delivery on all orders</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">14-Day Free Returns</h5>
              <p className="text-xs text-slate-400">Hassle-free exchanges across SA</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">Secure Checkout</h5>
              <p className="text-xs text-slate-400">Instant EFT, Debito Pay & Cards</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand & Market */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center p-1.5 shadow-sm">
                <Logo className="w-full h-full text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">AVEART</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Fresh, accessible women's and men's fashion e-commerce store in South Africa. Thoughtful silhouettes, comfortable fabrics, and everyday style for all.
            </p>
            <div className="text-xs text-slate-400 pt-1 space-y-1">
              <p className="text-white font-bold">Cape Town Hub & Dispatch:</p>
              <p>14 Kloof Street, Suite 402, Tamboerskloof, Cape Town, 8001</p>
              <p>Customer Care: +27 (0) 21 424 8900 · hello@aveart.co.za</p>
            </div>
          </div>

          {/* Women & Men Categories */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-rose-400 font-extrabold">
              Shop Fashion
            </h4>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('catalog_gender', 'women')}
                  className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                >
                  Women's Collection
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalog_gender', 'men')}
                  className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                >
                  Men's Collection
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalog_gender', 'accessories')}
                  className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                >
                  Bags & Accessories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalog_sale')}
                  className="text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer text-left flex items-center gap-1"
                >
                  <span>Sale & Specials</span>
                  <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 text-[10px] rounded font-bold">UP TO 40%</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('catalog')}
                  className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                >
                  View All Products
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold">
              Help & Policies
            </h4>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('policy', 'shipping')}
                  className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                >
                  Delivery Info
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policy', 'returns')}
                  className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                >
                  Returns & Exchanges
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policy', 'terms')}
                  className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policy', 'cookies')}
                  className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                >
                  Cookie Policy & Preferences
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('policy', 'privacy')}
                  className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('track')}
                  className="hover:text-rose-400 transition-colors cursor-pointer text-left"
                >
                  Track Your Order
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-rose-400" />
              <span>Get 10% Off Your First Order</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Subscribe for new drop alerts, flash sales, and subscriber perks across South Africa.
            </p>
            {isSubscribed ? (
              <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 font-semibold">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>You're subscribed! Use code <strong>AVEART10</strong> at checkout.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                  <button
                    type="submit"
                    className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 text-xs font-bold rounded-xl transition-colors shadow-md cursor-pointer"
                  >
                    Join
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

        {/* Bottom Bar: Copyright & Payment badges */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} AVEART South Africa. All prices in South African Rand (ZAR).</p>
          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <span>Debito Pay</span>
            <span>·</span>
            <span>Instant EFT</span>
            <span>·</span>
            <span>Visa / Mastercard</span>
            <span>·</span>
            <span>Capitec Pay</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
