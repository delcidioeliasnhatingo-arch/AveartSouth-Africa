import React from 'react';
import { CheckCircle, Printer, ArrowRight, Package, Truck, ShieldCheck } from 'lucide-react';
import { Order, formatZAR } from '../types/index.ts';

interface OrderConfirmationViewProps {
  order: Order;
  onNavigateHome: () => void;
  onTrackOrder: (orderNumber: string) => void;
}

export const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({
  order,
  onNavigateHome,
  onTrackOrder,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
      
      {/* Success Hero Header */}
      <div className="text-center space-y-4 pb-8 border-b border-slate-200">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle className="w-9 h-9" />
        </div>

        <span className="text-xs uppercase tracking-wider text-rose-600 font-extrabold block">
          Order Successfully Confirmed
        </span>

        <h1 className="text-3xl sm:text-4xl text-slate-900 font-black">
          Thank you for your order, {order.customer_name}!
        </h1>

        <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed font-medium">
          Your order <strong className="font-mono text-slate-900">{order.order_number}</strong> has been received and is being prepared for dispatch. A confirmation email has been sent to <strong className="text-slate-900">{order.customer_email}</strong>.
        </p>
      </div>

      {/* Order Status Timeline Tracker */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
              Fulfillment Status
            </span>
            <span className="text-lg font-black text-slate-900 capitalize">
              {order.status.replace('_', ' ')}
            </span>
          </div>

          {order.tracking_number && (
            <div className="text-right">
              <span className="text-xs text-slate-400 font-bold block">Tracking Waybill</span>
              <span className="font-mono tabular-nums text-xs font-black text-slate-900">
                {order.tracking_number}
              </span>
            </div>
          )}
        </div>

        {/* 4-Step Progress Bar */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2">
          <div className="space-y-1.5">
            <div className="h-2 bg-emerald-500 rounded-full" />
            <span className="font-bold text-emerald-700">Payment Paid</span>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 bg-emerald-500 rounded-full" />
            <span className="font-bold text-emerald-700">Packing Order</span>
          </div>
          <div className="space-y-1.5">
            <div className={`h-2 rounded-full ${order.status === 'in_transit' || order.status === 'delivered' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <span className={order.status === 'in_transit' || order.status === 'delivered' ? 'font-bold text-emerald-700' : 'text-slate-400 font-semibold'}>
              In Transit
            </span>
          </div>
          <div className="space-y-1.5">
            <div className={`h-2 rounded-full ${order.status === 'delivered' ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            <span className={order.status === 'delivered' ? 'font-bold text-emerald-700' : 'text-slate-400 font-semibold'}>
              Delivered
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Shipping Destination */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl text-xs space-y-3 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
            Delivery Destination
          </h3>
          <div className="text-slate-600 space-y-1 font-medium">
            <p className="font-bold text-slate-900">{order.customer_name}</p>
            <p>{order.shipping_street}</p>
            {order.shipping_apartment && <p>{order.shipping_apartment}</p>}
            <p>{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</p>
            <p>{order.shipping_country}</p>
            {order.customer_phone && <p className="pt-1 text-slate-500">Tel: {order.customer_phone}</p>}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-600 flex items-center gap-1.5 font-semibold">
            <Truck className="w-3.5 h-3.5 text-rose-500" />
            <span>Courier: {order.shipping_method === 'white_glove_freight' ? 'Priority Same-Day Dispatch' : 'Express Courier Door-to-Door'}</span>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl text-xs space-y-3 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
            Payment & Billing Summary
          </h3>
          <div className="space-y-1.5 text-slate-600 font-medium">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums font-bold text-slate-900">
                {formatZAR(order.subtotal)}
              </span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount ({order.discount_code || 'Promo'})</span>
                <span className="font-mono tabular-nums">
                  -{formatZAR(order.discount_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="font-mono tabular-nums">
                {order.shipping_amount === 0 ? 'Free Delivery' : formatZAR(order.shipping_amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>VAT (15% Included)</span>
              <span className="font-mono tabular-nums">
                {formatZAR(order.tax_amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Paid</span>
              <span className="font-mono tabular-nums text-base text-rose-600 font-black">
                {formatZAR(order.total_amount)}
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Authorized via Debito Pay (Status: {order.payment_status})</span>
          </div>
        </div>

      </div>

      {/* Itemized Line Items */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100">
          Ordered Garments
        </h3>
        <div className="divide-y divide-slate-100">
          {(order.items || []).map((item) => (
            <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4 text-xs">
              <div className="w-16 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                <img
                  src={item.image_url || '/src/assets/images/fashion_women_linen_blazer_1792263530901.jpg'}
                  alt={item.product_title}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900">
                  {item.product_title}
                </h4>
                <p className="text-slate-500 text-[11px] font-medium">{item.variant_name}</p>
                <p className="text-slate-500 text-[11px] font-medium">Quantity: {item.quantity}</p>
              </div>

              <div className="font-mono tabular-nums font-black text-slate-900 text-sm">
                {formatZAR(item.line_total)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions: Print and Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-700 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Print Order Receipt</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onTrackOrder(order.order_number)}
            className="flex items-center gap-1.5 px-5 py-3 bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-800 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Track Order</span>
          </button>

          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-6 py-3 bg-rose-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-rose-600 transition-colors shadow-md cursor-pointer"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
