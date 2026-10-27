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
              Orders are prepared and handed to a delivery provider according to the destination, stock availability and service offered at checkout. The available delivery method, estimated timeframe and any applicable fee must be shown before the order is placed. An estimate is not a guaranteed delivery date unless expressly confirmed in writing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2">
                <strong className="text-xs uppercase tracking-wider text-[#65775D] block font-bold">
                  Available delivery method and fee shown at checkout
                </strong>
                <p className="text-slate-600 font-medium">
                  Delivery estimates depend on destination, fulfilment availability, courier capacity and public holidays. The estimate displayed at checkout or in the order confirmation takes precedence.
                </p>
              </div>

              <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-2">
                <strong className="text-xs uppercase tracking-wider text-[#65775D] block font-bold">
                  Express or priority delivery, where available
                </strong>
                <p className="text-slate-600 font-medium">
                  Express options may be offered for selected destinations and order times. Availability and price are confirmed at checkout; same-day service is not guaranteed unless specifically shown for your order.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Where the delivery provider supports tracking, tracking details will be shared when available. Delivery scans and proof-of-delivery records are provided by the relevant carrier.
            </p>
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900">
              Returns, Exchanges & Consumer Rights
            </h2>
            <p className="font-medium text-slate-600">
              If an item is unsuitable, contact AVEART through the official contact method on this website before sending it back. Return eligibility, time limits, condition requirements and any return-shipping cost will be assessed under the policy shown for your order and applicable consumer law. Nothing in this policy limits non-excludable statutory rights.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">Size exchanges</strong>
                  <span className="text-slate-600">An exchange depends on stock availability and the return method confirmed by customer care. Any collection, return-shipping or replacement-delivery charge will be disclosed before the exchange is arranged, unless applicable law requires otherwise.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">Garment Condition:</strong>
                  <span className="text-slate-600">For change-of-mind requests, items should generally be unworn, unwashed, undamaged and returned with original tags and packaging where reasonably possible. Faulty, damaged, incorrect or misdescribed goods are handled in accordance with applicable consumer law and are not automatically denied because packaging is missing.</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-bold">Fast Refunds:</strong>
                  <span className="text-slate-600">Once a return is approved, the refund method and processing timeframe will be confirmed. The time for funds to appear can depend on the payment provider and issuing bank; we will not promise a fixed settlement period that the provider has not confirmed.</span>
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
              AVEART aims to present clear product, price, payment and delivery information before checkout. Prices, taxes, delivery charges and the contracting seller’s details should be shown at the point of sale as applicable to the order. This page is not a substitute for mandatory disclosures or rights under the South African Consumer Protection Act, Electronic Communications and Transactions Act, POPIA or other applicable law.
            </p>
            <div className="space-y-3">
              <p>
                <strong className="text-slate-900">Authenticity & Quality:</strong> Product descriptions, images, sizing and fabric details are provided to help you choose an item. Colours can vary by screen, and measurements may have a small tolerance. We do not claim a particular fibre composition, origin, certification or design provenance unless that information is expressly verified in the individual product listing.
              </p>
              <p>
                <strong className="text-slate-900">Pricing Transparency:</strong> The checkout should show the order total and all known mandatory charges before you confirm payment. If a cross-border order may attract customs duties, import taxes or third-party charges, those charges and responsibility for paying them must be disclosed clearly before purchase where known and legally required.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900">Cookie Policy</h2>
            <p className="font-medium text-slate-600">
              This Cookie Policy explains how AVEART uses cookies, local storage, pixels, scripts and similar technologies when you browse our online store. It should be read with our Privacy Policy. We only describe optional tracking as active where the relevant technology has actually been configured; choosing a category here does not itself install or activate a third-party service.
            </p>
            <div className="space-y-4">
              <section className="space-y-2"><h3 className="font-bold text-slate-900">1. What these technologies do</h3><p>Cookies are small text files stored by a browser. Similar technologies may store a preference locally, help maintain a session, protect forms, remember consent, measure performance or attribute a marketing campaign. Some are set by AVEART; others may be set by a service provider when that service is enabled.</p></section>
              <section className="space-y-2"><h3 className="font-bold text-slate-900">2. Categories and legal basis</h3><p><strong className="text-slate-900">Strictly necessary:</strong> Support requested store functions, security, fraud prevention, consent records and checkout continuity. They are always enabled because the store may not function correctly without them.</p><p><strong className="text-slate-900">Preferences:</strong> Remember choices such as display or shopping settings, where such functionality is implemented. If a preference is not essential, it should remain off until selected where consent is required.</p><p><strong className="text-slate-900">Analytics and performance:</strong> May provide aggregated information about visits, page performance and navigation. These remain off unless you opt in and a corresponding analytics tool is configured.</p><p><strong className="text-slate-900">Marketing and advertising:</strong> May measure campaign performance or support relevant advertising. These remain off unless you opt in and the relevant marketing technology is configured.</p></section>
              <section className="space-y-2"><h3 className="font-bold text-slate-900">3. Consent and preference controls</h3><p>On your first visit, you can accept optional categories, reject them, or open Cookie Preferences and choose categories individually. Optional categories are not pre-selected. You can change or withdraw your choice using the persistent Cookie Preferences control at the bottom of the store. Withdrawing consent does not make earlier processing unlawful, but it stops future optional processing once the change is applied by the relevant systems.</p><p>Your choice is stored in this browser. Clearing browser storage, using another device or browser, or using private browsing may cause the banner to appear again. We may update this notice or the preference version when the policy or technology changes.</p></section>
              <section className="space-y-2"><h3 className="font-bold text-slate-900">4. Duration and third parties</h3><p>Session technologies usually expire when a browsing session ends; persistent technologies remain until their expiry or deletion. Exact names, providers and lifetimes depend on the tools active at the time. AVEART does not claim that analytics or advertising providers are active merely because a preference category is available. Where third-party tools are enabled, their processing may also be governed by their own notices and settings.</p></section>
              <section className="space-y-2"><h3 className="font-bold text-slate-900">5. Browser controls</h3><p>You can block or delete cookies in your browser settings. Blocking essential technologies may affect the basket, checkout, security or saved preferences. Browser-level controls do not always remove local storage or stop all similar technologies; use the store’s Cookie Preferences as well.</p></section>
              <section className="space-y-2"><h3 className="font-bold text-slate-900">6. Personal data and international processing</h3><p>Cookie identifiers, device information and browsing events may be personal information when they can be linked to you or your device. We aim to collect only what is needed for the selected purpose and to restrict access. Where applicable, processing is handled under South African POPIA and other data-protection rules that apply to the visitor or transaction. If a provider processes data outside your country, additional safeguards may be required by applicable law.</p></section>
              <section className="space-y-2"><h3 className="font-bold text-slate-900">7. Policy updates and contact</h3><p>We may revise this policy when store features, providers or legal requirements change. The current version will be published on this page. For a privacy request or question, use the official contact method published on the AVEART website; we will not invent or display an unverified contact address here.</p></section>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900">
              Customer Privacy & Payment Protection
            </h2>
            <p className="font-medium text-slate-600">
              This notice explains the personal information AVEART may process when you browse the store, place an order, contact customer care or manage your cookie choices. The precise data processed depends on the feature you use and the service providers configured for the store.
            </p>
            <div className="space-y-4">
              <section className="space-y-2"><h3 className="font-bold text-slate-900">1. Information we may collect</h3><p>Order and contact details you provide, such as your name, email, telephone number, delivery address and order contents; transaction references and payment status returned by the payment provider; customer-service messages; and technical information such as browser, device, security logs and cookie preferences. Do not send full card numbers, passwords or bank credentials to AVEART through support messages.</p></section>
              <section className="space-y-2"><h3 className="font-bold text-slate-900">2. Why we use it</h3><p>We use relevant information to process and deliver orders, confirm payment status, provide customer support, prevent fraud, maintain site security, comply with legal obligations and remember privacy choices. Analytics or marketing purposes are used only where the relevant tools are enabled and the required consent or other lawful basis exists.</p></section>
              <section className="space-y-2"><h3 className="font-bold text-slate-900">3. Payments and service providers</h3><p>Payments may be handled by an external payment provider. The provider processes payment information under its own security and privacy controls; AVEART should receive only the information needed to confirm and reconcile the transaction. We do not claim that a specific certification or security standard applies unless verified for the exact provider and payment flow. Service providers may support hosting, database, fulfilment, delivery, email or security functions and should receive only the data needed for their service.</p></section>
              <section className="space-y-2"><h3 className="font-bold text-slate-900">4. Sharing, retention and security</h3><p>We do not sell personal information. We may disclose relevant information to service providers, payment or delivery partners, professional advisers, regulators or authorities where necessary and lawful. We retain information only for as long as reasonably needed for the purpose, customer support, security, dispute resolution and applicable record-keeping duties. Access controls and technical safeguards are used, but no internet transmission or storage system can be guaranteed completely secure.</p></section>
              <section className="space-y-2"><h3 className="font-bold text-slate-900">5. Your rights and requests</h3><p>Depending on the law applicable to you, you may be able to request access to, correction or deletion of personal information, object to or restrict certain processing, or withdraw consent. Some records may need to be retained for legal, tax, payment or dispute reasons. We may need to verify your identity before acting on a request.</p></section>
              <section className="space-y-2"><h3 className="font-bold text-slate-900">6. Children and changes</h3><p>The store is intended for people able to make purchases under the laws applicable to them; a parent or guardian should contact us if they believe a child has provided personal information without appropriate authority. We may update this notice when our store, providers or legal obligations change.</p></section>
              <section className="space-y-2"><h3 className="font-bold text-slate-900">7. Contact and governing requirements</h3><p>For privacy requests, use the official contact method shown on the AVEART website. AVEART will assess requests under applicable law, including South Africa’s Protection of Personal Information Act (POPIA) where it applies. This notice is general information, not legal advice; the store operator should verify its contact details, provider list, retention periods and applicable legal obligations before relying on it as a final compliance document.</p></section>
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
