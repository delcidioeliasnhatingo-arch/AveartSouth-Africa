import React, { useState, useEffect } from 'react';
import { User, Package, MapPin, Plus, LogOut, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Order, formatZAR } from '../types/index.ts';

interface CustomerAccountViewProps {
  onTrackOrder: (orderNumber: string) => void;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({ onTrackOrder }) => {
  const { user, token, login, register, logout, addresses, refreshProfile } = useAuth();

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Add address state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    recipientName: '',
    street: '',
    apartment: '',
    city: 'Cape Town',
    state: 'Western Cape',
    postalCode: '8001',
    country: 'South Africa',
  });

  // Fetch customer orders when logged in
  useEffect(() => {
    if (user) {
      setOrdersLoading(true);
      const token = localStorage.getItem('aveart_auth_token');
      fetch('/api/orders/my-orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load orders.');
          return res.json();
        })
        .then((data) => {
          setOrders(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error(err))
        .finally(() => setOrdersLoading(false));
    }
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, phone);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('aveart_auth_token');
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newAddr),
      });

      if (res.ok) {
        setIsAddingAddress(false);
        refreshProfile();
      }
    } catch (err) {
      console.error('Failed to save address:', err);
    }
  };

  // Demo user quick login
  const quickLoginAs = async (role: 'admin' | 'store_manager' | 'customer') => {
    const creds = {
      admin: { email: 'admin@aveart.design', pass: 'Admin1234!' },
      store_manager: { email: 'curator@aveart.design', pass: 'Curator1234!' },
      customer: { email: 'collector@aveart.design', pass: 'Collector1234!' },
    }[role];

    try {
      await login(creds.email, creds.pass);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // If not logged in, render Login / Register screen with Demo Persona Quick-Switch
  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-wider text-[#65775D] font-extrabold flex items-center justify-center gap-1.5">
            <span>Customer Portal</span>
          </span>
          <h1 className="text-3xl font-black text-slate-900">
            {authMode === 'login' ? 'Customer Sign In' : 'Create Free Account'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Access your orders, real-time express tracking, and saved delivery addresses in South Africa.
          </p>
        </div>

        {/* Demo Persona Quick-Switch Strip */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
          <span className="text-xs uppercase tracking-wider font-extrabold text-slate-700 block">
            Instant Demo Account Switcher:
          </span>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => quickLoginAs('admin')}
              className="p-3 text-left bg-slate-50 border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
            >
              <div>
                <strong className="text-slate-900 block font-bold text-xs">Admin Console</strong>
                <span className="text-[11px] text-slate-500">admin@aveart.design · Full metrics & order controls</span>
              </div>
              <span className="text-xs text-[#65775D] font-bold">Sign in →</span>
            </button>

            <button
              type="button"
              onClick={() => quickLoginAs('store_manager')}
              className="p-3 text-left bg-slate-50 border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
            >
              <div>
                <strong className="text-slate-900 block font-bold text-xs">Store Manager</strong>
                <span className="text-[11px] text-slate-500">curator@aveart.design · Inventory & fulfillment</span>
              </div>
              <span className="text-xs text-[#65775D] font-bold">Sign in →</span>
            </button>

            <button
              type="button"
              onClick={() => quickLoginAs('customer')}
              className="p-3 text-left bg-slate-50 border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
            >
              <div>
                <strong className="text-slate-900 block font-bold text-xs">Customer Account</strong>
                <span className="text-[11px] text-slate-500">collector@aveart.design · Orders & saved addresses</span>
              </div>
              <span className="text-xs text-[#65775D] font-bold">Sign in →</span>
            </button>
          </div>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setAuthError(null);
            }}
            className={`flex-1 py-3 transition-colors cursor-pointer ${
              authMode === 'login'
                ? 'border-b-2 border-[#87977D] text-[#65775D] font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setAuthError(null);
            }}
            className={`flex-1 py-3 transition-colors cursor-pointer ${
              authMode === 'register'
                ? 'border-b-2 border-[#87977D] text-[#65775D] font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
          {authMode === 'register' && (
            <>
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Julian Ross"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#87977D]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+27 (0) 82 555 0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#87977D]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Email Address</label>
            <input
              type="email"
              required
              placeholder="customer@domain.co.za"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#87977D]"
            />
          </div>

          <div>
            <label className="block text-slate-700 mb-1 font-bold">Password</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#87977D]"
            />
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#87977D] text-white py-3.5 font-bold uppercase tracking-wider rounded-xl hover:bg-[#65775D] disabled:opacity-50 transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            {isSubmitting ? 'Verifying...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

      </div>
    );
  }

  // If logged in: Display Customer Dashboard
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      
      {/* Account Overview Header */}
      <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-50 text-[#65775D] rounded-2xl flex items-center justify-center border border-rose-100 shadow-xs">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">
                {user.name}
              </h1>
              <span className="text-[11px] uppercase tracking-wider font-mono font-bold px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-full">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {user.email} {user.phone && `· ${user.phone}`}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 hover:border-[#87977D] hover:text-[#65775D] rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors self-start md:self-auto cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Orders History */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Order History
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Recent orders and express delivery status
              </span>
            </div>
            <span className="font-mono tabular-nums text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </span>
          </div>

          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white border border-slate-200 rounded-2xl h-32 animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3 shadow-sm">
              <Package className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-base font-bold text-slate-900">No Orders Yet</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Orders placed under this account will appear here along with track & trace coordinates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <span className="font-mono tabular-nums font-bold text-sm text-slate-900 block">
                        {ord.order_number}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(ord.created_at).toLocaleDateString('en-ZA', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full ${
                        ord.status === 'delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : ord.status === 'paid'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {ord.status.replace('_', ' ')}
                      </span>

                      <button
                        onClick={() => onTrackOrder(ord.order_number)}
                        className="text-xs text-[#65775D] hover:text-rose-700 hover:underline font-bold cursor-pointer"
                      >
                        Track Status →
                      </button>
                    </div>
                  </div>

                  {/* Line Items Preview */}
                  <div className="divide-y divide-slate-100">
                    {(ord.items || []).map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image_url || '/src/assets/images/fashion_women_linen_blazer_1792263530901.jpg'}
                            alt={item.product_title}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {item.product_title}
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              {item.variant_name} · Qty: {item.quantity}
                            </span>
                          </div>
                        </div>

                        <span className="font-mono tabular-nums font-bold text-slate-900">
                          {formatZAR(item.line_total)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Total & Waybill */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Waybill: {ord.tracking_number || 'Awaiting Dispatch Scan'}
                    </span>
                    <span className="font-mono tabular-nums font-black text-[#65775D] text-sm">
                      Total: {formatZAR(ord.total_amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Saved Addresses */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Address Book
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Saved delivery locations
              </span>
            </div>
            {!isAddingAddress && (
              <button
                onClick={() => setIsAddingAddress(true)}
                className="flex items-center gap-1 text-xs text-[#65775D] hover:text-rose-700 hover:underline font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            )}
          </div>

          {/* New Address Form */}
          {isAddingAddress && (
            <form onSubmit={handleSaveAddress} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3 text-xs">
              <span className="font-bold text-slate-900 block pb-1 border-b border-slate-100">
                Add New Delivery Address
              </span>
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={newAddr.recipientName}
                  onChange={(e) => setNewAddr({ ...newAddr, recipientName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#87977D]"
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Street</label>
                <input
                  type="text"
                  required
                  value={newAddr.street}
                  onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#87977D]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">City</label>
                  <input
                    type="text"
                    required
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#87977D]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Province</label>
                  <input
                    type="text"
                    required
                    value={newAddr.state}
                    onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#87977D]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={newAddr.postalCode}
                    onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#87977D]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Country</label>
                  <input
                    type="text"
                    required
                    value={newAddr.country}
                    onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#87977D]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#87977D] text-white py-2.5 font-bold uppercase tracking-wider rounded-xl hover:bg-[#65775D] transition-colors cursor-pointer"
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Saved Addresses List */}
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-white border rounded-2xl p-4 text-xs space-y-1 relative shadow-sm ${
                  addr.is_default ? 'border-[#87977D] ring-1 ring-[#87977D] bg-[#F7F8F5]' : 'border-slate-200'
                }`}
              >
                {addr.is_default === 1 && (
                  <span className="text-[10px] uppercase font-bold text-[#65775D] tracking-wider block">
                    Default Delivery Address
                  </span>
                )}
                <p className="font-bold text-slate-900">{addr.recipient_name}</p>
                <p className="text-slate-600">{addr.street}</p>
                {addr.apartment && <p className="text-slate-600">{addr.apartment}</p>}
                <p className="text-slate-600">
                  {addr.city}, {addr.state} {addr.postal_code}
                </p>
                <p className="text-slate-600">{addr.country}</p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
