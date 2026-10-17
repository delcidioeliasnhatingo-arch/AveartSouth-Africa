import React, { useState, useEffect } from 'react';
import { Search, Package, Truck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Order, formatZAR } from '../types/index.ts';

interface OrderTrackingViewProps {
  initialOrderNumber?: string;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ initialOrderNumber }) => {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber || 'AVE-2026-9042');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = (num: string) => {
    if (!num.trim()) return;
    setLoading(true);
    setError(null);

    fetch(`/api/orders/track/${encodeURIComponent(num.trim())}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('No order record found for this order number.');
        }
        return res.json();
      })
      .then((data) => setOrder(data))
      .catch((err) => {
        setError(err.message);
        setOrder(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumber(initialOrderNumber);
      fetchOrder(initialOrderNumber);
    } else {
      fetchOrder('AVE-2026-9042');
    }
  }, [initialOrderNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderNumber);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      
      {/* Search Header */}
      <div className="text-center space-y-3">
        <span className="text-xs uppercase tracking-wider text-rose-600 font-extrabold flex items-center justify-center gap-1.5">
          <Truck className="w-4 h-4" />
          <span>Live Order Tracking (South Africa)</span>
        </span>
        <h1 className="text-3xl sm:text-4xl text-slate-900 font-black">
          Track Your Fashion Delivery
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto font-medium">
          Enter your order reference (e.g. AVE-2026-XXXX) to check live courier status, dispatch scans, and delivery estimates.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-6 flex gap-2">
          <input
            type="text"
            required
            placeholder="e.g. AVE-2026-9042"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs uppercase tracking-wider text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-rose-500 text-white px-6 py-3 text-xs uppercase tracking-wider font-bold rounded-xl hover:bg-rose-600 transition-colors whitespace-nowrap cursor-pointer shadow-md shadow-rose-500/25"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2 max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {order && (
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-8">
          
          {/* Top Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Order Reference
              </span>
              <span className="font-mono text-xl font-black text-slate-900">
                {order.order_number}
              </span>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Recipient: {order.customer_name} · Delivery to {order.shipping_city}, {order.shipping_country}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Courier Waybill Number
              </span>
              <span className="font-mono text-sm font-black text-rose-600">
                {order.tracking_number || 'Dispatch booking in progress'}
              </span>
              <p className="text-xs text-slate-500 mt-0.5 capitalize font-medium">
                Service: {order.shipping_method.replace('_', ' ')}
              </p>
            </div>
          </div>

          {/* Timeline Visualizer */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-slate-600 font-bold">
              Delivery Milestones
            </h3>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="space-y-1">
                <div className="h-2 bg-emerald-500 rounded-full" />
                <span className="font-bold text-emerald-700">01. Paid</span>
              </div>
              <div className="space-y-1">
                <div className={`h-2 rounded-full ${order.status !== 'pending_payment' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                <span className={order.status !== 'pending_payment' ? 'font-bold text-emerald-700' : 'text-slate-400 font-semibold'}>
                  02. Packing
                </span>
              </div>
              <div className="space-y-1">
                <div className={`h-2 rounded-full ${order.status === 'in_transit' || order.status === 'delivered' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                <span className={order.status === 'in_transit' || order.status === 'delivered' ? 'font-bold text-emerald-700' : 'text-slate-400 font-semibold'}>
                  03. In Transit
                </span>
              </div>
              <div className="space-y-1">
                <div className={`h-2 rounded-full ${order.status === 'delivered' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                <span className={order.status === 'delivered' ? 'font-bold text-emerald-700' : 'text-slate-400 font-semibold'}>
                  04. Delivered
                </span>
              </div>
            </div>
          </div>

          {/* Consignment Items */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-slate-600 font-bold">
              Items in this Package
            </h4>
            <div className="divide-y divide-slate-100">
              {(order.items || []).map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image_url || '/src/assets/images/fashion_women_linen_blazer_1792263530901.jpg'}
                      alt={item.product_title}
                      className="w-12 h-14 object-cover rounded-xl border border-slate-200"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {item.product_title}
                      </span>
                      <span className="text-slate-500 text-[11px] font-medium">{item.variant_name} · Qty {item.quantity}</span>
                    </div>
                  </div>
                  <span className="font-mono tabular-nums font-black text-slate-900">
                    {formatZAR(item.line_total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">Total Order Value:</span>
            <span className="font-mono tabular-nums font-black text-rose-600 text-sm">
              {formatZAR(order.total_amount)}
            </span>
          </div>

        </div>
      )}
    </div>
  );
};
