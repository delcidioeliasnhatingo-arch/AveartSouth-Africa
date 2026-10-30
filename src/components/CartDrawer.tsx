import React, { useState } from 'react';
import { X, Trash2, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { formatZAR } from '../types/index.ts';

interface CartDrawerProps {
  onNavigateToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigateToCheckout }) => {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    calculation,
    isCalculating,
    discountCode,
    setDiscountCode,
  } = useCart();

  const [inputCode, setInputCode] = useState(discountCode);

  if (!isDrawerOpen) return null;

  const subtotal = calculation ? calculation.subtotal : items.reduce((acc, i) => acc + (i.unitPrice || 0) * i.quantity, 0);
  

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountCode(inputCode.trim().toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Your Shopping Bag
              </h2>
              <span className="text-xs text-[#65775D] font-bold">
                {items.length} {items.length === 1 ? 'item' : 'items'} in bag
              </span>
            </div>
            <button
              onClick={closeDrawer}
              aria-label="Close Bag"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Shipping is quoted after the delivery address is entered */}
          <div className="px-6 py-3.5 bg-rose-50/70 border-b border-rose-100 text-xs">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Truck className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Live delivery prices are calculated at checkout using your address and order contents.</span>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <p className="text-lg font-bold text-slate-900 mb-2">Your Bag is Empty</p>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Explore our seasonal fashion collection for women and men.
                </p>
                <button
                  onClick={closeDrawer}
                  className="px-6 py-3 bg-[#87977D] text-white text-xs font-bold rounded-xl hover:bg-[#65775D] transition-colors shadow-md cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              (calculation?.lineItems || items).map((item: any) => (
                <div key={item.variantId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-4">
                  {/* Thumbnail (3:4 ratio) */}
                  <div className="w-20 h-24 bg-slate-200 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={item.imageUrl || '/src/assets/images/fashion_women_linen_blazer_1792263530901.jpg'}
                      alt={item.productTitle}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {item.productTitle}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.size ? `Size: ${item.size}` : ''} {item.color ? `· ${item.color}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-[#65775D] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-mono tabular-nums font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-[#65775D] cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Price in ZAR */}
                      <div className="text-right">
                        <div className="font-mono tabular-nums text-sm font-extrabold text-slate-900">
                          {formatZAR(item.unitPrice * item.quantity)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        className="text-slate-400 hover:text-[#65775D] transition-colors p-1 cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bag Footer with Totals and Checkout Button */}
          {items.length > 0 && (
            <div className="p-6 bg-white border-t border-slate-200 space-y-4 shadow-lg">
              
              {/* Promo Code Form */}
              <form onSubmit={handleApplyDiscount} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code (e.g. AVEART10)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#87977D]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-100 text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>

              {/* Discount confirmation */}
              {calculation?.appliedDiscount && (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  Code {calculation.appliedDiscount.code} applied — 10% discount.
                </div>
              )}

              {/* Server calculation feedback / errors */}
              {calculation?.errors && calculation.errors.length > 0 && (
                <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {calculation.errors[0]}
                </div>
              )}

              {/* Subtotal, Discount & Total Rows in ZAR */}
              <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">
                    {formatZAR(subtotal)}
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
                  <span>Shipping (South Africa)</span>
                  <span className="font-mono tabular-nums font-semibold">
                    Calculated at checkout
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>VAT (15% Included)</span>
                  <span className="font-mono tabular-nums">
                    {formatZAR(calculation?.taxAmount || 0)}
                  </span>
                </div>

                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                  <span>Subtotal + VAT</span>
                  <span className="font-mono tabular-nums text-lg text-[#65775D] font-extrabold">
                    {formatZAR(calculation ? calculation.subtotal - calculation.discountAmount + calculation.taxAmount : subtotal)}
                  </span>
                </div>
              </div>

              {/* Checkout Action */}
              <button
                type="button"
                disabled={isCalculating || (calculation !== null && !calculation.isValid)}
                onClick={() => {
                  closeDrawer();
                  onNavigateToCheckout();
                }}
                className="w-full bg-[#87977D] hover:bg-[#65775D] text-white py-3.5 px-4 text-sm font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protected by Debito Pay & Instant EFT</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
