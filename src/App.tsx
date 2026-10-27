import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { Order } from './types/index.ts';
import { CookieConsent } from './components/CookieConsent.tsx';

const HomeView = React.lazy(() => import('./views/HomeView.tsx').then((m) => ({ default: m.HomeView })));
const CatalogView = React.lazy(() => import('./views/CatalogView.tsx').then((m) => ({ default: m.CatalogView })));
const ProductDetailView = React.lazy(() => import('./views/ProductDetailView.tsx').then((m) => ({ default: m.ProductDetailView })));
const CheckoutView = React.lazy(() => import('./views/CheckoutView.tsx').then((m) => ({ default: m.CheckoutView })));
const OrderConfirmationView = React.lazy(() => import('./views/OrderConfirmationView.tsx').then((m) => ({ default: m.OrderConfirmationView })));
const PaymentReturnView = React.lazy(() => import('./views/PaymentReturnView.tsx').then((m) => ({ default: m.PaymentReturnView })));
const CustomerAccountView = React.lazy(() => import('./views/CustomerAccountView.tsx').then((m) => ({ default: m.CustomerAccountView })));
const OrderTrackingView = React.lazy(() => import('./views/OrderTrackingView.tsx').then((m) => ({ default: m.OrderTrackingView })));
const PolicyView = React.lazy(() => import('./views/PolicyView.tsx').then((m) => ({ default: m.PolicyView })));
const AtelierView = React.lazy(() => import('./views/AtelierView.tsx').then((m) => ({ default: m.AtelierView })));
const AdminHubView = React.lazy(() => import('./views/AdminHubView.tsx').then((m) => ({ default: m.AdminHubView })));

export default function App() {
  const [currentView, setCurrentView] = useState<string>(() =>
    window.location.pathname.replace(/\/+$/, '') === '/payment-return' ? 'payment-return' : 'home'
  );
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, viewParam]);

  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param);
  };

  const handleSelectProduct = (slug: string) => {
    setCurrentView('product');
    setViewParam(slug);
  };

  const handleOrderComplete = (order: Order) => {
    setConfirmedOrder(order);
    setCurrentView('confirmation');
  };

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen w-full flex flex-col bg-[#F8FAFC] text-[#0F172A] overflow-x-hidden">
          <Navbar currentView={currentView} onNavigate={handleNavigate} />

          <main className="flex-1 w-full">
            <React.Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-500">Loading collection…</div>}>
            {currentView === 'payment-return' && (
              <PaymentReturnView onNavigateHome={() => setCurrentView('home')} />
            )}

            {currentView === 'home' && (
              <HomeView onNavigate={handleNavigate} />
            )}

            {currentView === 'catalog' && (
              <CatalogView initialSearch={viewParam} onSelectProduct={handleSelectProduct} />
            )}

            {currentView === 'catalog_new' && (
              <CatalogView onSelectProduct={handleSelectProduct} />
            )}

            {currentView === 'catalog_gender' && (
              <CatalogView initialGender={viewParam as any} onSelectProduct={handleSelectProduct} />
            )}

            {currentView === 'catalog_sale' && (
              <CatalogView initialSale={true} onSelectProduct={handleSelectProduct} />
            )}

            {currentView === 'catalog_category' && (
              <CatalogView initialCategory={viewParam} onSelectProduct={handleSelectProduct} />
            )}

            {currentView === 'product' && viewParam && (
              <ProductDetailView
                slug={viewParam}
                onBack={() => setCurrentView('catalog')}
                onSelectProduct={handleSelectProduct}
                onNavigateToCategory={(cat) => handleNavigate('catalog_category', cat)}
                onBuyNow={() => setCurrentView('checkout')}
              />
            )}

            {currentView === 'checkout' && (
              <CheckoutView onBackToBag={() => setCurrentView('catalog')} onOrderComplete={handleOrderComplete} />
            )}

            {currentView === 'confirmation' && confirmedOrder && (
              <OrderConfirmationView
                order={confirmedOrder}
                onNavigateHome={() => setCurrentView('home')}
                onTrackOrder={(num) => handleNavigate('track', num)}
              />
            )}

            {currentView === 'account' && (
              <CustomerAccountView onTrackOrder={(num) => handleNavigate('track', num)} />
            )}

            {currentView === 'track' && (
              <OrderTrackingView initialOrderNumber={viewParam} />
            )}

            {currentView === 'policy' && (
              <PolicyView initialTab={viewParam || 'shipping'} onNavigateCatalog={() => setCurrentView('catalog')} />
            )}

            {currentView === 'atelier' && (
              <AtelierView onNavigateCatalog={() => setCurrentView('catalog')} />
            )}

            {currentView === 'admin' && (
              <AdminHubView onNavigateHome={() => setCurrentView('home')} />
            )}
            </React.Suspense>
          </main>

          <CartDrawer onNavigateToCheckout={() => setCurrentView('checkout')} />
          <CookieConsent onNavigate={handleNavigate} />
          <Footer onNavigate={handleNavigate} />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
