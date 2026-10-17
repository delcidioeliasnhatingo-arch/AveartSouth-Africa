import React, { useState, useEffect } from 'react';
import {
  Shield,
  DollarSign,
  Package,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Truck,
  Plus,
  RefreshCw,
  Search,
  Key,
  Database,
  Sliders,
  Send,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Order, ProductVariant, InventoryLog, AdminMetrics, formatZAR } from '../types/index.ts';

interface AdminHubViewProps {
  onNavigateHome: () => void;
}

export const AdminHubView: React.FC<AdminHubViewProps> = ({ onNavigateHome }) => {
  const { user, token, quickLoginAs } = useAuth();

  const [activeTab, setActiveTab] = useState<'metrics' | 'orders' | 'inventory' | 'logs' | 'discounts' | 'webhooks'>('metrics');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & State
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Stock Adjustment Modal
  const [adjustingVariant, setAdjustingVariant] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState<string>('restock');
  const [adjustNotes, setAdjustNotes] = useState<string>('Cape Town workshop seasonal shipment received');

  // Webhook Simulation state
  const [webhookSimOrderNum, setWebhookSimOrderNum] = useState('');
  const [webhookSimType, setWebhookSimType] = useState('payment_intent.succeeded');
  const [webhookResult, setWebhookResult] = useState<any | null>(null);

  // Discount form state
  const [newCode, setNewCode] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState('10');
  const [newMinOrder, setNewMinOrder] = useState('500');

  const isAuthorized = user && (user.role === 'admin' || user.role === 'store_manager');

  const fetchAdminData = () => {
    if (!token || !isAuthorized) return;
    setLoading(true);

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/admin/metrics', { headers }).then((r) => r.json()),
      fetch(`/api/admin/orders?status=${orderStatusFilter}&search=${encodeURIComponent(orderSearch)}`, { headers }).then((r) => r.json()),
      fetch('/api/admin/inventory', { headers }).then((r) => r.json()),
      fetch('/api/admin/inventory/logs', { headers }).then((r) => r.json()),
      fetch('/api/admin/discounts', { headers }).then((r) => r.json()),
    ])
      .then(([metricsData, ordersData, inventoryData, logsData, discountsData]) => {
        setMetrics(metricsData);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setInventory(Array.isArray(inventoryData) ? inventoryData : []);
        setLogs(Array.isArray(logsData) ? logsData : []);
        setDiscounts(Array.isArray(discountsData) ? discountsData : []);
        if (ordersData && ordersData.length > 0 && !selectedOrder) {
          setSelectedOrder(ordersData[0]);
        }
      })
      .catch((err) => console.error('Failed to load admin data:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdminData();
  }, [token, isAuthorized, orderStatusFilter, orderSearch]);

  const handleUpdateOrderStatus = async (orderId: string, status: string, trackingNumber?: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, trackingNumber }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingVariant || !token) return;

    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          variantId: adjustingVariant.id,
          adjustment: adjustAmount,
          reason: adjustReason,
          notes: adjustNotes,
        }),
      });

      if (res.ok) {
        setAdjustingVariant(null);
        fetchAdminData();
      }
    } catch (err) {
      console.error('Stock adjust error:', err);
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookSimOrderNum.trim()) return;

    try {
      const res = await fetch('/api/payment/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: webhookSimOrderNum.trim(),
          eventType: webhookSimType,
        }),
      });
      const data = await res.json();
      setWebhookResult(data);
      fetchAdminData();
    } catch (err: any) {
      setWebhookResult({ error: err.message });
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !token) return;

    try {
      const res = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          discountPercent: parseFloat(newDiscountPercent) || 0,
          minOrderValue: parseFloat(newMinOrder) || 0,
        }),
      });

      if (res.ok) {
        setNewCode('');
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to create discount:', err);
    }
  };

  // RBAC Access Control Gate
  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center space-y-6">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 shadow-sm">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          Admin Portal Authentication
        </h1>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          Access to store metrics, order fulfillment, stock audits, and webhooks requires Administrator or Store Manager credentials.
        </p>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl text-xs space-y-2 text-left shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
            Select Demo Account:
          </span>
          <button
            onClick={() => quickLoginAs('admin')}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 rounded-xl flex justify-between items-center cursor-pointer transition-colors"
          >
            <span className="font-bold text-slate-800">Administrator (admin@aveart.design)</span>
            <span className="text-rose-600 font-bold">Sign In →</span>
          </button>
          <button
            onClick={() => quickLoginAs('store_manager')}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 rounded-xl flex justify-between items-center cursor-pointer transition-colors"
          >
            <span className="font-bold text-slate-800">Store Manager (curator@aveart.design)</span>
            <span className="text-rose-600 font-bold">Sign In →</span>
          </button>
        </div>

        <button
          onClick={onNavigateHome}
          className="text-xs text-slate-500 hover:text-rose-600 hover:underline font-bold"
        >
          ← Return to Storefront
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      
      {/* Top Operations Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-rose-600 font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Store Operations</span>
            </span>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-full">
              Role: {user.role}
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mt-1">
            AVEART Retail Operations
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Live database-backed management for orders, inventory balances, discounts, and dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : ''}`} />
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-5 py-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'metrics'
              ? 'border-b-2 border-rose-500 text-rose-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Dashboard Metrics
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-b-2 border-rose-500 text-rose-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Orders & Delivery ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-5 py-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-b-2 border-rose-500 text-rose-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Inventory & Stock ({inventory.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-5 py-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-b-2 border-rose-500 text-rose-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Stock Audit Ledger ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('discounts')}
          className={`px-5 py-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'discounts'
              ? 'border-b-2 border-rose-500 text-rose-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Discounts & Promos ({discounts.length})
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-5 py-3 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'webhooks'
              ? 'border-b-2 border-rose-500 text-rose-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Webhook Sandbox
        </button>
      </div>

      {/* 1. Dashboard Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Total Settled Revenue (ZAR)
              </span>
              <div className="font-mono tabular-nums text-3xl font-black text-rose-600">
                {formatZAR(metrics?.totalRevenue || 0)}
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold">Real authorized customer payments</p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Total Orders Placed
              </span>
              <div className="font-mono tabular-nums text-3xl font-black text-slate-900">
                {metrics?.totalOrders || 0}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{metrics?.paidOrders || 0} paid & fulfilled</p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Low Stock Threshold Alerts
              </span>
              <div className={`font-mono tabular-nums text-3xl font-black ${(metrics?.lowStockCount || 0) > 0 ? 'text-amber-500' : 'text-slate-900'}`}>
                {metrics?.lowStockCount || 0}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Garments below minimum stock buffer</p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Average Basket Size
              </span>
              <div className="font-mono tabular-nums text-3xl font-black text-slate-900">
                {formatZAR(metrics && metrics.totalOrders > 0 ? metrics.totalRevenue / metrics.totalOrders : 0)}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">South African store average</p>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Recent Customer Orders
            </h3>
            <div className="divide-y divide-slate-100">
              {(metrics?.recentOrders || []).map((o) => (
                <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900 block">
                      {o.order_number}
                    </span>
                    <span className="text-slate-500 text-[11px] font-medium">
                      {o.customer_name} · {new Date(o.created_at).toLocaleDateString('en-ZA')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      o.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {o.status.replace('_', ' ')}
                    </span>
                    <span className="font-mono tabular-nums font-black text-slate-900">
                      {formatZAR(o.total_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Orders & Fulfillment Tab */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Order List */}
          <div className="lg:col-span-6 space-y-4">
            {/* Filter controls */}
            <div className="flex gap-2">
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer shadow-xs"
              >
                <option value="all">All Statuses</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="paid">Paid & Authorized</option>
                <option value="preparing_shipment">Preparing Shipment</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>

              <input
                type="text"
                placeholder="Search order #, customer..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-xs"
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-[600px] overflow-y-auto shadow-sm">
              {orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className={`p-4 text-xs cursor-pointer transition-colors ${
                    selectedOrder?.id === o.id ? 'bg-rose-50/60 border-l-4 border-rose-500' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {o.order_number}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      o.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700'
                        : o.status === 'refunded'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-slate-600 mt-1 font-medium">{o.customer_name} ({o.customer_email})</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
                    <span>{new Date(o.created_at).toLocaleDateString('en-ZA')}</span>
                    <span className="font-mono tabular-nums font-black text-slate-900">
                      {formatZAR(o.total_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Order Detail & State Actions */}
          <div className="lg:col-span-6 bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-sm">
            {selectedOrder ? (
              <div className="space-y-6 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Order {selectedOrder.order_number}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Payment Status: <strong className="text-rose-600 uppercase font-bold">{selectedOrder.payment_status}</strong>
                    </span>
                  </div>

                  <span className="font-mono tabular-nums text-lg font-black text-rose-600">
                    {formatZAR(selectedOrder.total_amount)}
                  </span>
                </div>

                {/* State Machine Transition Actions */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-700 block">
                    Fulfillment Workflow Transitions:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status === 'paid' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'preparing_shipment')}
                        className="px-3.5 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        Start Packing Parcel
                      </button>
                    )}

                    {selectedOrder.status === 'preparing_shipment' && (
                      <button
                        onClick={() => {
                          const tracking = prompt('Enter Carrier Waybill Tracking Code:', selectedOrder.tracking_number || 'AVE-EXP-889912');
                          if (tracking) handleUpdateOrderStatus(selectedOrder.id, 'in_transit', tracking);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        Dispatch In Transit →
                      </button>
                    )}

                    {selectedOrder.status === 'in_transit' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'delivered')}
                        className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        Mark Delivered ✓
                      </button>
                    )}

                    {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'refunded' && (
                      <button
                        onClick={() => {
                          if (confirm(`Refund order ${selectedOrder.order_number}? This will automatically return inventory back to stock.`)) {
                            handleUpdateOrderStatus(selectedOrder.id, 'refunded');
                          }
                        }}
                        className="px-3.5 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                      >
                        Execute Refund (Restocks Catalog)
                      </button>
                    )}
                  </div>
                </div>

                {/* Destination & Waybill */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 font-bold block">Delivery Address:</span>
                    <p className="font-bold text-slate-900">{selectedOrder.customer_name}</p>
                    <p>{selectedOrder.shipping_street}</p>
                    <p>{selectedOrder.shipping_city}, {selectedOrder.shipping_country}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Courier Waybill:</span>
                    <p className="font-mono font-bold text-rose-600">
                      {selectedOrder.tracking_number || 'Pending Dispatch Scan'}
                    </p>
                    <p className="capitalize">Method: {selectedOrder.shipping_method.replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Line Items */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="font-bold text-slate-900 block">Ordered Garments:</span>
                  {(selectedOrder.items || []).map((item) => (
                    <div key={item.id} className="flex justify-between py-1 border-b border-slate-100">
                      <span>{item.product_title} ({item.variant_name}) × {item.quantity}</span>
                      <span className="font-mono font-bold">{formatZAR(item.line_total)}</span>
                    </div>
                  ))}
                </div>

              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-12">Select an order from the list to view details.</p>
            )}
          </div>

        </div>
      )}

      {/* 3. Inventory & Stock Tab */}
      {activeTab === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-900">
              Fashion Inventory Balances & Thresholds
            </span>
            <span className="text-xs text-slate-500">
              Real-time synchronization with checkout bag reservations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Product / Variant</th>
                  <th className="py-3 px-4 font-bold">SKU</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Available Stock</th>
                  <th className="py-3 px-4 font-bold">Buffer Alert</th>
                  <th className="py-3 px-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => {
                  const isLow = item.stock_quantity <= item.low_stock_threshold;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">
                          {item.product_title}
                        </span>
                        <span className="text-slate-500 text-[11px]">{item.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono">{item.sku}</td>
                      <td className="py-3 px-4">{item.category_name}</td>
                      <td className="py-3 px-4">
                        <span className={`font-mono tabular-nums font-bold text-sm ${isLow ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {item.stock_quantity} units
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{item.low_stock_threshold}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setAdjustingVariant(item)}
                          className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          Adjust Balance
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingVariant && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-md w-full p-6 rounded-2xl shadow-2xl space-y-4 text-xs">
            <h3 className="text-lg font-black text-slate-900">
              Adjust Stock: {adjustingVariant.product_title}
            </h3>
            <p className="text-slate-500">
              Variant: {adjustingVariant.name} · Current Balance: <strong className="text-slate-900 font-bold">{adjustingVariant.stock_quantity}</strong>
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-3">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Quantity Adjustment (+ or -)</label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:bg-white focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Reason for Inventory Movement</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                >
                  <option value="restock">Seasonal Batch Restock</option>
                  <option value="manual_adjustment">Physical Warehouse Inventory Audit</option>
                  <option value="damage">Transit / Handling Write-Off</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Audit Notes</label>
                <input
                  type="text"
                  required
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-rose-500 text-white py-2.5 font-bold uppercase tracking-wider rounded-xl hover:bg-rose-600 transition-colors cursor-pointer"
                >
                  Commit Adjustment
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustingVariant(null)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Audit Ledger Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-900">
              Inventory Movement Audit Ledger
            </span>
            <span className="text-xs text-slate-500">
              Immutable log of all stock deductions, restocks and returns
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Timestamp</th>
                  <th className="py-3 px-4 font-bold">SKU</th>
                  <th className="py-3 px-4 font-bold">Change</th>
                  <th className="py-3 px-4 font-bold">Balance After</th>
                  <th className="py-3 px-4 font-bold">Reason</th>
                  <th className="py-3 px-4 font-bold">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500">{new Date(log.created_at).toLocaleString('en-ZA')}</td>
                    <td className="py-2.5 px-4 text-slate-900 font-bold">{log.sku}</td>
                    <td className="py-2.5 px-4 font-bold">
                      <span className={log.change_quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {log.change_quantity > 0 ? `+${log.change_quantity}` : log.change_quantity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-black text-slate-900">{log.balance_after}</td>
                    <td className="py-2.5 px-4 uppercase text-slate-600 font-sans">{log.reason}</td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans">{log.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Discounts & Promos Tab */}
      {activeTab === 'discounts' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
              Active Promotion Codes
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {discounts.map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-black text-sm text-rose-600 tracking-wider block">
                      {d.code}
                    </span>
                    <span className="text-slate-500">
                      Min. Order: {formatZAR(d.min_order_value)} · Status: {d.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {d.discount_percent > 0 ? `${d.discount_percent}% OFF` : `${formatZAR(d.fixed_amount)} OFF`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-2">
              Issue New Promotion Code
            </h3>
            <form onSubmit={handleCreateDiscount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Promo Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER20"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 uppercase font-mono font-bold focus:bg-white focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Discount Percent (%)</label>
                <input
                  type="number"
                  value={newDiscountPercent}
                  onChange={(e) => setNewDiscountPercent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:bg-white focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Minimum Order Value (ZAR)</label>
                <input
                  type="number"
                  value={newMinOrder}
                  onChange={(e) => setNewMinOrder(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono focus:bg-white focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Create Discount Code
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. Webhook Sandbox Inspector Tab */}
      {activeTab === 'webhooks' && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6 text-xs">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Payment Webhook Simulation & Idempotency Runner
            </h3>
            <p className="text-slate-500 mt-1 font-medium">
              Test HMAC-SHA256 signature verification, replay protection, and idempotent database processing.
            </p>
          </div>

          <form onSubmit={handleSimulateWebhook} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="md:col-span-5">
              <label className="block text-slate-700 mb-1 font-bold">Target Order Number</label>
              <input
                type="text"
                required
                placeholder="e.g. AVE-2026-9042"
                value={webhookSimOrderNum}
                onChange={(e) => setWebhookSimOrderNum(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-slate-700 mb-1 font-bold">Webhook Event Type</label>
              <select
                value={webhookSimType}
                onChange={(e) => setWebhookSimType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value="payment_intent.succeeded">payment_intent.succeeded (Mark Paid)</option>
                <option value="charge.refunded">charge.refunded (Refund & Restock)</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Dispatch</span>
              </button>
            </div>
          </form>

          {webhookResult && (
            <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto space-y-2">
              <span className="text-emerald-400 block">// Webhook Processing Result (Idempotent DB Check)</span>
              <pre>{JSON.stringify(webhookResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
