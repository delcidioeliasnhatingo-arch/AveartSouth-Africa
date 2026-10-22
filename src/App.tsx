import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { HomeView } from './views/HomeView.tsx';
import { CatalogView } from './views/CatalogView.tsx';
import { ProductDetailView } from './views/ProductDetailView.tsx';
import { CheckoutView } from './views/CheckoutView.tsx';
import { PaymentReturnView } from './views/PaymentReturnView.tsx';
import { OrderConfirmationView } from './views/OrderConfirmationView.tsx';
import { CustomerAccountView } from './views/CustomerAccountView.tsx';
import { OrderTrackingView } from './views/OrderTrackingView.tsx';
import { PolicyView } from './views/PolicyView.tsx';
import { AtelierView } from './views/AtelierView.tsx';
import { AdminHubView } from './views/AdminHubView.tsx';
import { Order } from './types/index.ts';
import { CookieConsent } from './components/CookieConsent.tsx';

export default function App() {
  const [currentView, setCurrentView] = useState<string>(() => window.location.pathname.replace(/\/+$/, '') === '/payment-return' ? 'payment-return' : 'home');
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
          
          {/* Top Bar Navigation */}
          <Navbar currentView={currentView} onNavigate={handleNavigate} />

          {/* Main Content Area */}
          <main className="flex-1 w-full">
            {currentView === 'payment-return' && <PaymentReturnView onNavigateHome={() => setCurrentView('home')} />}

            {currentView === 'home' && (
              <HomeView onNavigate={handleNavigate} />
            )}

            {currentView === 'catalog' && (
              <CatalogView
                initialSearch={viewParam}
                onSelectProduct={handleSelectProduct}
              />
            )}

            {currentView === 'catalog_new' && (
              <CatalogView
                onSelectProduct={handleSelectProduct}
              />
            )}

            {currentView === 'catalog_gender' && (
              <CatalogView
                initialGender={viewParam as any}
                onSelectProduct={handleSelectProduct}
              />
            )}

            {currentView === 'catalog_sale' && (
              <CatalogView
                initialSale={true}
                onSelectProduct={handleSelectProduct}
              />
            )}

            {currentView === 'catalog_category' && (
              <CatalogView
                initialCategory={viewParam}
                onSelectProduct={handleSelectProduct}
              />
            )}

            {currentView === 'product' && viewParam && (
              <ProductDetailView
                slug={viewParam}
                onBack={() => setCurrentView('catalog')}
                onSelectProduct={handleSelectProduct}
                onNavigateToCategory={(cat) => handleNavigate('catalog_category', cat)}
              />
            )}

            {currentView === 'checkout' && (
              <CheckoutView
                onBackToBag={() => setCurrentView('catalog')}
                onOrderComplete={handleOrderComplete}
              />
            )}

            {currentView === 'confirmation' && confirmedOrder && (
              <OrderConfirmationView
                order={confirmedOrder}
                onNavigateHome={() => setCurrentView('home')}
                onTrackOrder={(num) => handleNavigate('track', num)}
              />
            )}

            {currentView === 'account' && (
              <CustomerAccountView
                onTrackOrder={(num) => handleNavigate('track', num)}
              />
            )}

            {currentView === 'track' && (
              <OrderTrackingView initialOrderNumber={viewParam} />
            )}

            {currentView === 'policy' && (
              <PolicyView
                initialTab={viewParam || 'shipping'}
                onNavigateCatalog={() => setCurrentView('catalog')}
              />
            )}

            {currentView === 'atelier' && (
              <AtelierView
                onNavigateCatalog={() => setCurrentView('catalog')}
              />
            )}

            {currentView === 'admin' && (
              <AdminHubView
                onNavigateHome={() => setCurrentView('home')}
              />
            )}
          </main>

          {/* Persistent Slide-Over Cart Drawer */}
          <CartDrawer onNavigateToCheckout={() => setCurrentView('checkout')} />

          {/* Cookie consent controls */}
          <CookieConsent onNavigate={handleNavigate} />

          {/* Editorial Footer */}
          <Footer onNavigate={handleNavigate} />

        </div>
      </CartProvider>
    </AuthProvider>
  );
}
