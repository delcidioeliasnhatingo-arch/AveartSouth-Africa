import React from 'react';
import { Clock3, ArrowLeft, ShieldCheck } from 'lucide-react';

interface PaymentReturnViewProps {
  onNavigateHome: () => void;
}

export const PaymentReturnView: React.FC<PaymentReturnViewProps> = ({ onNavigateHome }) => {
  const params = new URLSearchParams(window.location.search);
  const orderReference =
    params.get('order_number') ||
    params.get('orderNumber') ||
    params.get('order_id') ||
    params.get('reference');

  return (
    <section className="flex-1 w-full bg-[#F8FAFC] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <Clock3 size={30} aria-hidden="true" />
        </div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">AVEART · Payment</p>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          We’re checking your payment
        </h1>
        <p className="mx-auto max-w-md text-sm leading-6 text-slate-600">
          You have returned to AVEART. Your payment is not marked as confirmed on this page.
          We will confirm the order after the payment provider verifies the transaction.
        </p>

        {orderReference && (
          <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">Order reference: </span>
            <strong className="break-all text-slate-900">{orderReference}</strong>
          </div>
        )}

        <div className="mt-7 flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-left">
          <ShieldCheck className="mt-0.5 shrink-0 text-slate-600" size={20} aria-hidden="true" />
          <p className="text-xs leading-5 text-slate-600">
            For your security, this return page alone does not prove that a payment succeeded.
            Please do not pay again if you are unsure of the status; contact support and provide your order reference.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateHome}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Return to AVEART
        </button>
      </div>
    </section>
  );
};
