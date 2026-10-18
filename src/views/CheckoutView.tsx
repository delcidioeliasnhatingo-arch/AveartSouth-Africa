import React, { useState, useEffect } from 'react';
import { resolveImageUrl } from '../utils/imageUrl.ts';
import { ShieldCheck, Lock, CreditCard, AlertCircle, ArrowLeft, CheckCircle2, Building2, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { Order, formatZAR } from '../types/index.ts';

interface CheckoutViewProps {
  onBackToBag: () => void;
  onOrderComplete: (order: Order) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ onBackToBag, onOrderComplete }) => {
  const { user, addresses } = useAuth();
  const { items, calculation, discountCode, setDiscountCode, shippingMethod, setShippingMethod, clearCart } = useCart();

  // Contact & Address
  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];
  const [customerEmail, setCustomerEmail] = useState(user?.email || 'zola.dlamini@domain.co.za');
  const [customerName, setCustomerName] = useState(user?.name || defaultAddress?.recipient_name || 'Zola Dlamini');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+27 (0) 82 555 4190');
  const [shippingStreet, setShippingStreet] = useState(defaultAddress?.street || '14 Kloof Street');
  const [shippingApartment, setShippingApartment] = useState(defaultAddress?.apartment || 'Suite 402, Tamboerskloof');
  const [shippingCity, setShippingCity] = useState(defaultAddress?.city || 'Cape Town');
  const [shippingState, setShippingState] = useState(defaultAddress?.state || 'Western Cape');
  const [shippingPostalCode, setShippingPostalCode] = useState(defaultAddress?.postal_code || '8001');
  const [shippingCountry, setShippingCountry] = useState(defaultAddress?.country || 'South Africa');
  const [notes, setNotes] = useState('');

  // Payment Selection: Debito Pay (Primary SA rail) or Sandbox Card
  const [paymentProvider, setPaymentProvider] = useState<'debito_pay' | 'stripe_sandbox'>('debito_pay');
  const [selectedBank, setSelectedBank] = useState('Capitec Pay');

  // Sandbox Card Inputs
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardPostal, setCardPostal] = useState('8001');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && !customerEmail) {
      setCustomerEmail(user.email);
      setCustomerName(user.name);
    }
  }, [user, customerEmail]);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-900">Your Shopping Bag is Empty</h2>
        <p className="text-sm text-slate-500">Please select items from the fashion collection before checkout.</p>
        <button
          onClick={onBackToBag}
          className="px-6 py-3.5 bg-rose-500 text-white text-xs font-bold uppercase rounded-xl hover:bg-rose-600 transition-colors shadow-md cursor-pointer"
        >
          Return to Fashion Collection
        </button>
      </div>
    );
  }

  const handleTestCardSelect = (card: string) => {
    setCardNumber(card);
    setErrorMessage(null);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // 1. Create order on backend (recalculates server-side in ZAR & reserves inventory)
      const orderPayload = {
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        discountCode: discountCode || undefined,
        shippingMethod,
        customerEmail,
        customerName,
        customerPhone,
        shippingStreet,
        shippingApartment,
        shippingCity,
        shippingState,
        shippingPostalCode,
        shippingCountry,
        paymentProvider,
        notes,
      };

      const token = localStorage.getItem('aveart_auth_token');
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || 'Failed to initialize order.');
      }

      const orderData = await orderRes.json();
      const createdOrder: Order = orderData.order;

      // 2. Simulate Payment processing via adapter
      const paymentRes = await fetch('/api/payments/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: createdOrder.id,
          provider: paymentProvider,
          details: {
            bankName: selectedBank,
            cardNumber,
            cardExpiry,
            cardCvc,
            amount: createdOrder.total_amount,
            currency: 'ZAR',
          },
        }),
      });

      const paymentData = await paymentRes.json();

      if (!paymentRes.ok || !paymentData.success) {
        throw new Error(paymentData.error || 'Payment authorization was declined. Please verify details.');
      }

      // Success
      clearCart();
      onOrderComplete(paymentData.order || createdOrder);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during payment processing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Top back button */}
      <button
        onClick={onBackToBag}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors mb-6 cursor-pointer font-bold"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Shopping Bag</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Checkout Inputs Form */}
        <form onSubmit={handleSubmitOrder} className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Customer Contact */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-900">
                01. Customer Contact
              </span>
              <span className="text-xs text-rose-600 font-bold">
                {user ? `Signed in as ${user.email}` : 'Guest checkout'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Email Address *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-bold">Delivery Contact Number (South Africa) *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Shipping Destination */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-900">
                02. South African Shipping Destination
              </span>
              <span className="text-xs text-slate-500 font-bold">Express Courier</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-bold">Street Address *</label>
                <input
                  type="text"
                  required
                  value={shippingStreet}
                  onChange={(e) => setShippingStreet(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Apartment, Suite or Building</label>
                <input
                  type="text"
                  value={shippingApartment}
                  onChange={(e) => setShippingApartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">City / Suburb *</label>
                <input
                  type="text"
                  required
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Province *</label>
                <select
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white cursor-pointer"
                >
                  <option value="Western Cape">Western Cape</option>
                  <option value="Gauteng">Gauteng</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Free State">Free State</option>
                  <option value="Mpumalanga">Mpumalanga</option>
                  <option value="Limpopo">Limpopo</option>
                  <option value="North West">North West</option>
                  <option value="Northern Cape">Northern Cape</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Postal Code *</label>
                <input
                  type="text"
                  required
                  value={shippingPostalCode}
                  onChange={(e) => setShippingPostalCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-bold">Special Delivery Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Leave with gate reception, buzzer 402..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Step 3: South African Shipping Method */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-900 block pb-3 border-b border-slate-100">
              03. Shipping Logistics
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between ${
                  shippingMethod === 'standard_curated'
                    ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="standard_curated"
                      checked={shippingMethod === 'standard_curated'}
                      onChange={() => setShippingMethod('standard_curated')}
                      className="accent-rose-500 mr-2"
                    />
                    <strong className="text-slate-900 font-bold">Express Door-to-Door Courier</strong>
                  </div>
                  <span className="font-mono tabular-nums font-extrabold text-rose-600">
                    {(calculation?.subtotal || 0) >= 1000 ? 'FREE' : 'R 95.00'}
                  </span>
                </div>
                <p className="text-slate-500 mt-2 text-[11px] leading-relaxed">
                  The Courier Guy / RAM Hand-to-Hand across all SA metros (2–4 business days).
                </p>
              </label>

              <label
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between ${
                  shippingMethod === 'white_glove_freight'
                    ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="white_glove_freight"
                      checked={shippingMethod === 'white_glove_freight'}
                      onChange={() => setShippingMethod('white_glove_freight')}
                      className="accent-rose-500 mr-2"
                    />
                    <strong className="text-slate-900 font-bold">Priority Same-Day Dispatch</strong>
                  </div>
                  <span className="font-mono tabular-nums font-extrabold text-slate-900">
                    R 350.00
                  </span>
                </div>
                <p className="text-slate-500 mt-2 text-[11px] leading-relaxed">
                  Express direct delivery in Cape Town & Johannesburg metropolitan zones.
                </p>
              </label>
            </div>
          </div>

          {/* Step 4: Payment Method Selection */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-900">
                04. Payment Gateway Selection
              </span>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                Official Rail: Debito Pay (South Africa)
              </span>
            </div>

            {/* Provider Switcher */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label
                className={`p-3.5 border rounded-2xl cursor-pointer flex items-center gap-2.5 transition-all ${
                  paymentProvider === 'debito_pay'
                    ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  checked={paymentProvider === 'debito_pay'}
                  onChange={() => setPaymentProvider('debito_pay')}
                  className="accent-rose-500"
                />
                <div>
                  <strong className="text-slate-900 block font-bold">Debito Pay (Instant EFT & Card)</strong>
                  <span className="text-[11px] text-slate-500">Capitec Pay, Nedbank, FNB, Standard Bank</span>
                </div>
              </label>

              <label
                className={`p-3.5 border rounded-2xl cursor-pointer flex items-center gap-2.5 transition-all ${
                  paymentProvider === 'stripe_sandbox'
                    ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentProvider"
                  checked={paymentProvider === 'stripe_sandbox'}
                  onChange={() => setPaymentProvider('stripe_sandbox')}
                  className="accent-rose-500"
                />
                <div>
                  <strong className="text-slate-900 block font-bold">International Card Sandbox</strong>
                  <span className="text-[11px] text-slate-500">Visa, Mastercard (Test Tokens)</span>
                </div>
              </label>
            </div>

            {/* Debito Pay Bank Selection */}
            {paymentProvider === 'debito_pay' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
                <span className="font-bold text-slate-900 block">
                  Select Bank / Payment Rail via Debito Pay:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Capitec Pay', 'FNB', 'Standard Bank', 'Nedbank', 'ABSA', 'Discovery Bank', 'TymeBank', 'Debit Card'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                        selectedBank === b
                          ? 'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/25'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-rose-300'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  You will be securely authorized via Debito Pay's instant banking confirmation rail.
                </p>
              </div>
            )}

            {/* Sandbox Card Inputs if Sandbox Selected */}
            {paymentProvider === 'stripe_sandbox' && (
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex flex-wrap gap-2 pb-2">
                  <button
                    type="button"
                    onClick={() => handleTestCardSelect('4242 4242 4242 4242')}
                    className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-[11px] cursor-pointer"
                  >
                    ✓ Test Success Card
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestCardSelect('4000 0000 0000 0002')}
                    className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl text-[11px] cursor-pointer"
                  >
                    ✕ Test Declined Card
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-slate-700 mb-1 font-bold">Card Number *</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">CVC</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 mb-1 font-bold">Postal Code</label>
                    <input
                      type="text"
                      value={cardPostal}
                      onChange={(e) => setCardPostal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-rose-500 text-white py-4 text-sm font-extrabold uppercase tracking-wider rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-all shadow-lg shadow-rose-500/25 hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Lock className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Processing Authorization...'
                : paymentProvider === 'debito_pay'
                ? `Pay with Debito Pay · ${formatZAR(calculation?.totalAmount || 0)}`
                : `Authorize Card · ${formatZAR(calculation?.totalAmount || 0)}`}
            </span>
          </button>

          <div className="text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Protected by Debito Pay & Instant EFT South Africa</span>
          </div>
        </form>

        {/* Right Column: Order Summary (Recalculated in ZAR) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100">
            Order Summary (ZAR)
          </h3>

          <div className="space-y-4 max-h-96 overflow-y-auto divide-y divide-slate-100">
            {(calculation?.lineItems || items).map((item: any) => (
              <div key={item.variantId} className="pt-3 first:pt-0 flex gap-3">
                <div className="w-16 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                  <img
                    src={resolveImageUrl(item.imageUrl || '/src/assets/images/fashion_women_linen_blazer_1792263530901.jpg')}
                    alt={item.productTitle}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between text-xs">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {item.productTitle}
                    </h4>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">
                      {item.size ? `Size: ${item.size}` : ''} {item.color ? `· ${item.color}` : ''}
                    </p>
                    <span className="text-slate-500 font-medium">Qty: {item.quantity}</span>
                  </div>
                  <div className="font-mono tabular-nums font-black text-slate-900 text-right">
                    {formatZAR(item.unitPrice * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs text-slate-600 pt-4 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums font-bold text-slate-900">
                {formatZAR(calculation?.subtotal || 0)}
              </span>
            </div>

            {calculation?.appliedDiscount && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount ({calculation.appliedDiscount.code})</span>
                <span className="font-mono tabular-nums font-bold">
                  -{formatZAR(calculation.discountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Delivery (South Africa)</span>
              <span className="font-mono tabular-nums font-semibold">
                {calculation?.shippingAmount === 0 ? 'Free Delivery' : formatZAR(calculation?.shippingAmount || 0)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>VAT (15% Included)</span>
              <span className="font-mono tabular-nums">
                {formatZAR(calculation?.taxAmount || 0)}
              </span>
            </div>

            <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-100">
              <span>Total to Pay</span>
              <span className="font-mono tabular-nums text-xl text-rose-600 font-black">
                {formatZAR(calculation?.totalAmount || 0)}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
