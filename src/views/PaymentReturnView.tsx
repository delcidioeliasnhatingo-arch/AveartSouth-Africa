import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, ArrowLeft, ShieldCheck, XCircle } from 'lucide-react';

interface PaymentReturnViewProps { onNavigateHome: () => void; }
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'unknown';

export const PaymentReturnView: React.FC<PaymentReturnViewProps> = ({ onNavigateHome }) => {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('order_id');
  const [status, setStatus] = useState<PaymentStatus>(orderId ? 'pending' : 'unknown');
  const [orderNumber, setOrderNumber] = useState(params.get('order_number') || '');
  const [checkError, setCheckError] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    let attempts = 0;
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/payments/status?order_id=' + encodeURIComponent(orderId), { cache: 'no-store' });
        if (!response.ok) throw new Error('Could not check payment status.');
        const data = await response.json();
        if (!active) return;
        setOrderNumber(data.order_number || orderNumber);
        const next = String(data.payment_status || 'pending').toLowerCase() as PaymentStatus;
        setStatus(['paid', 'failed', 'refunded', 'pending'].includes(next) ? next : 'unknown');
        setCheckError(false);
        if (['paid', 'failed', 'refunded'].includes(next) && timer) clearInterval(timer);
      } catch {
        if (active) setCheckError(true);
      }
    };
    void checkStatus();
    timer = setInterval(() => {
      attempts += 1;
      if (attempts >= 30) { if (timer) clearInterval(timer); return; }
      void checkStatus();
    }, 4000);
    return () => { active = false; if (timer) clearInterval(timer); };
  }, [orderId]);

  const paid = status === 'paid';
  const failed = status === 'failed';
  const refunded = status === 'refunded';
  const heading = paid ? 'Payment confirmed' : failed ? 'Payment not completed' : refunded ? 'Payment refunded' : status === 'unknown' ? 'Check your order' : 'We’re checking your payment';
  const message = paid
    ? 'Thank you. Debitopay has confirmed your payment and AVEART has updated your order.'
    : failed
    ? 'Debitopay reports that this payment did not complete. You can return to AVEART and try again.'
    : refunded
    ? 'This payment has been marked as refunded. Contact AVEART support if you need more information.'
    : status === 'unknown'
    ? 'We could not identify this order from the return link. Please contact AVEART support before paying again.'
    : 'Your payment may still be processing. We will keep checking for confirmation. Do not pay again while the status is pending.';

  return (
    <section className="flex-1 w-full bg-[#F8FAFC] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${paid ? 'bg-emerald-50 text-emerald-700' : failed ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
          {paid ? <CheckCircle2 size={30} aria-hidden="true" /> : failed ? <XCircle size={30} aria-hidden="true" /> : <Clock3 size={30} aria-hidden="true" />}
        </div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-slate-500">AVEART · Payment</p>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{heading}</h1>
        <p className="mx-auto max-w-md text-sm leading-6 text-slate-600">{message}</p>
        {orderNumber && (
          <div className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">Order reference: </span>
            <strong className="break-all text-slate-900">{orderNumber}</strong>
          </div>
        )}
        {checkError && status === 'pending' && <p role="status" className="mt-4 text-xs text-amber-700">We could not refresh the status just now. We will try again automatically.</p>}
        <div className="mt-7 flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-left">
          <ShieldCheck className="mt-0.5 shrink-0 text-slate-600" size={20} aria-hidden="true" />
          <p className="text-xs leading-5 text-slate-600">The result is checked with AVEART’s payment backend. The browser return message alone is never treated as proof of payment.</p>
        </div>
        <button type="button" onClick={onNavigateHome} className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
          <ArrowLeft size={16} aria-hidden="true" /> Return to AVEART
        </button>
      </div>
    </section>
  );
};
