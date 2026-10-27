import React, { useState } from 'react';
import { Truck, RotateCcw, FileText, Shield, ArrowRight, CheckCircle2, Cookie } from 'lucide-react';

interface PolicyViewProps {
  initialTab?: string;
  onNavigateCatalog: () => void;
}

export const PolicyView: React.FC<PolicyViewProps> = ({ initialTab = 'shipping', onNavigateCatalog }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="text-xs uppercase tracking-wider text-[#65775D] font-extrabold block">
          Customer Care & Store Policies
        </span>
        <h1 className="text-3xl sm:text-4xl text-slate-900 font-black">
          Shopping, Delivery & Returns in South Africa
        </h1>
        <p className="text-sm text-slate-500 max-w-xl mx-auto font-medium">
          Transparent South African fashion delivery times, hassle-free returns, secure payments, and privacy.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('shipping')}
          className={`flex items-center gap-2 px-6 py-3.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'shipping'
              ? 'border-b-2 border-[#87977D] text-[#65775D] font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Express SA Delivery</span>
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`flex items-center gap-2 px-6 py-3.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'returns'
              ? 'border-b-2 border-[#87977D] text-[#65775D] font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>14-Day Free Returns</span>
        </button>

        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-6 py-3.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'terms'
              ? 'border-b-2 border-[#87977D] text-[#65775D] font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Terms of Service</span>
        </button>

        <button
          onClick={() => setActiveTab('cookies')}
          className={`flex items-center gap-2 px-6 py-3.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'cookies'
              ? 'border-b-2 border-[#87977D] text-[#65775D] font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cookie className="w-4 h-4" />
          <span>Cookies</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-6 py-3.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'border-b-2 border-[#87977D] text-[#65775D] font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy & Security</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-3xl shadow-sm leading-relaxed text-xs text-slate-600 space-y-6">
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900">
              South African Express Delivery
            </h2>
            <p className="font-medium text-slate-600">
              We dispatch all orders directly from our Cape Town fulfillment center. Our trusted logistics partners (The Courier Guy and RAM Hand-to-Hand) ensure quick and secure delivery right to your door across all provinces.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2">
                <strong className="text-xs uppercase tracking-wider text-[#65775D] block font-bold">
                  Standard Express Courier (R 95 / Free over R 1,000)
                </strong>
                <p className="text-slate-600 font-medium">
                  2–4 business days delivery across Cape Town, Johannesburg, Pretoria, Durban, Gqeberha, and Bloemfontein.
                </p>
              </div>

              <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2">
                <strong className="text-xs uppercase tracking-wider text-[#65775D] block font-bold">
                  Priority Metro Same-Day Dispatch (R 350)
                </strong>
                <p className="text-slate-600 font-medium">
                  Same-day courier dispatch for orders placed before 11:00 AM within Cape Town and Johannesburg metropolitan areas.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Every parcel includes live SMS tracking notifications and digital proof of delivery.
            </p>
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900">
              14-Day Hassle-Free Returns & Size Exchanges
            </h2>
            <p className="font-medium text-slate-600">
              We want you to feel confident in every garment you choose. If the fit, size, or style isn't completely right for you, return or exchange it within 14 days of receipt.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">Free Size Exchanges:</strong>
                  <span className="text-slate-600">We collect your item and deliver the replacement size free of charge across South Africa.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">Garment Condition:</strong>
                  <span className="text-slate-600">Items must be unworn, unwashed, and in their original packaging with tags intact.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">Fast Refunds:</strong>
                  <span className="text-slate-600">Refunds are credited directly to your bank account or payment card within 2–3 business days of return inspection.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900">
              Terms of Sale & Store Information
            </h2>
            <p className="font-medium text-slate-600">
              AVEART South Africa operates under South African Consumer Protection Act (CPA) regulations. All transactions are billed in South African Rand (ZAR) and include 15% South African VAT.
            </p>
            <div className="space-y-3">
              <p>
                <strong className="text-slate-900">Authenticity & Quality:</strong> All products featured in our catalog are original garments designed with premium organic cotton, European flax linen, and Japanese selvedge denim.
              </p>
              <p>
                <strong className="text-slate-900">Pricing Transparency:</strong> The price shown at checkout is the complete amount you will pay. No surprise import duties or hidden handling charges.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Cookie Policy</h2>
            <p className="font-medium text-slate-600">
              AVEART uses cookies and similar technologies to operate this online store, remember essential shopping settings, and—only where permitted and enabled—measure store performance or personalise marketing.
            </p>
            <div className="space-y-3">
              <p><strong className="text-slate-900">Strictly necessary cookies:</strong> Support core functions such as navigation, cart and checkout security. These cannot be switched off through the cookie preference tool.</p>
              <p><strong className="text-slate-900">Analytics cookies:</strong> Help us understand how visitors use the store. They remain disabled unless you choose to allow them and the relevant analytics tools are configured.</p>
              <p><strong className="text-slate-900">Marketing cookies:</strong> May be used to measure campaigns or show relevant advertising. They remain disabled unless you choose to allow them and the relevant tools are configured.</p>
              <p><strong className="text-slate-900">Your choices:</strong> Use “Cookie Preferences” at the bottom of the store to change or withdraw your optional-cookie consent. Blocking necessary cookies in your browser may affect cart or checkout functions.</p>
              <p><strong className="text-slate-900">Personal information:</strong> Where cookie data identifies or can be linked to an individual, we handle it in accordance with our Privacy Policy and applicable South African data-protection law, including POPIA.</p>
              <p><strong className="text-slate-900">Contact:</strong> For privacy questions, contact hello@aveart.co.za. This policy should be reviewed against the actual technologies enabled on the store before launch.</p>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900">
              Customer Privacy & Payment Protection
            </h2>
            <p className="font-medium text-slate-600">
              Your security and privacy are fundamental to how we operate. We safeguard your personal and transaction data using industry-leading encryption.
            </p>
            <div className="space-y-3">
              <p>
                <strong className="text-slate-900">Debito Pay & 3D Secure Protection:</strong> All card payments and Instant EFT transactions are processed through tokenized, PCI-DSS Level 1 certified gateways. We never see or store your bank credentials or card CVC codes.
              </p>
              <p>
                <strong className="text-slate-900">POPIA Compliance:</strong> In accordance with the South African Protection of Personal Information Act (POPIA), your contact details are strictly used to fulfill and track your orders. We never sell customer records to third parties.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="text-center pt-4">
        <button
          onClick={onNavigateCatalog}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#87977D] hover:bg-[#65775D] text-white text-xs uppercase tracking-wider font-bold rounded-xl transition-colors shadow-md cursor-pointer"
        >
          <span>Return to Fashion Collection</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
