import React, { useState, useEffect } from 'react';
import { Product, Customer } from '../types';
import {
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  WifiOff,
  RefreshCw,
  ShoppingBag,
  User,
  X
} from 'lucide-react';
import * as api from '../api';

interface POSBillingViewProps {
  products: Product[];
  customers: Customer[];
  isOffline: boolean;
  onRefreshData: () => void;
  currency: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const POSBillingView: React.FC<POSBillingViewProps> = ({
  products,
  customers,
  isOffline,
  onRefreshData,
  currency = 'USD'
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('Walk-in Shopper');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'paypal' | 'credit'>('cash');
  const [processing, setProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Offline queue in LocalStorage
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('shoppilot_pos_offline_queue');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('shoppilot_pos_offline_queue', JSON.stringify(offlineQueue));
    } catch (e) {
      console.error(e);
    }
  }, [offlineQueue]);

  // Add item to POS cart
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      alert(`Cannot add ${product.name}: Out of stock!`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          alert(`Cannot add more than available stock (${product.stock_quantity})`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.stock_quantity) {
              alert(`Cannot exceed available stock of ${item.product.stock_quantity}`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, it) => acc + it.product.selling_price * it.quantity, 0);
  const tax = ((subtotal - discountAmount) * 0.05); // 5% default
  const total = Math.max(0, subtotal - discountAmount + tax);

  // Barcode quick enter simulator
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = products.find(
      (p) => p.barcode === searchQuery.trim() || p.sku.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    if (match) {
      addToCart(match);
      setSearchQuery('');
    } else {
      alert(`No product matching barcode/SKU "${searchQuery}"`);
    }
  };

  // Checkout (Online or Offline Queue)
  const handleCheckout = async () => {
    if (!cart.length) return;
    setProcessing(true);

    const itemsPayload = cart.map((it) => ({
      product_id: it.product.id,
      product_name: it.product.name,
      quantity: it.quantity,
      unit_price: it.product.selling_price,
      line_total: it.product.selling_price * it.quantity
    }));

    if (isOffline) {
      // Offline POS Queueing
      const offlineOrder = {
        offline_sync_id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        customer_name: selectedCustomer,
        customer_phone: customerPhone || '0000000000',
        payment_method: paymentMethod,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: tax,
        total_amount: total,
        items: itemsPayload,
        timestamp: new Date().toISOString()
      };

      setOfflineQueue((prev) => [...prev, offlineOrder]);
      setCompletedOrder({
        ...offlineOrder,
        order_number: `POS-OFF-${Date.now().toString().slice(-4)}`,
        is_offline_receipt: true
      });
      setCart([]);
      setDiscountAmount(0);
      setProcessing(false);
      return;
    }

    try {
      const res = await api.posCheckout({
        customer_name: selectedCustomer,
        customer_phone: customerPhone,
        payment_method: paymentMethod,
        discount_amount: discountAmount,
        items: itemsPayload
      });
      setCompletedOrder(res.order);
      setCart([]);
      setDiscountAmount(0);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  // Sync Offline Orders when internet reconnects
  const handleSyncOfflineOrders = async () => {
    if (!offlineQueue.length) return;
    setProcessing(true);
    try {
      const res = await api.syncOfflinePOS(offlineQueue);
      alert(`Synchronized ${res.synced.length} offline transactions to central database!`);
      setOfflineQueue([]);
      onRefreshData();
    } catch (err: any) {
      alert('Offline sync error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)
  );

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-5 max-w-7xl mx-auto">
      {/* LEFT: PRODUCT CATALOG & BARCODE SCANNER */}
      <div className="flex-1 bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between overflow-hidden">
        <div>
          {/* Barcode & Search Bar */}
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan barcode (e.g. 8901234567890) or type product name..."
                className="w-full bg-[#070b14] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 rounded-lg flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              Scan / Find
            </button>
          </form>

          {/* Offline Queue Alert Banner */}
          {offlineQueue.length > 0 && (
            <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>{offlineQueue.length} transactions</strong> queued in offline terminal memory.
                </span>
              </div>
              <button
                onClick={handleSyncOfflineOrders}
                disabled={isOffline || processing}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1 rounded text-[11px] flex items-center gap-1 transition disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                Sync with Central DB
              </button>
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
            {filteredProducts.map((p) => {
              const inStock = p.stock_quantity > 0;
              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    inStock
                      ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50'
                      : 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="font-bold text-xs text-white truncate">{p.name}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>{p.sku}</span>
                    <span className="font-bold text-slate-200">${p.selling_price.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span
                      className={`px-1.5 py-0.5 rounded font-semibold ${
                        p.stock_quantity <= p.low_stock_threshold
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {p.stock_quantity} in stock
                    </span>
                    <span className="text-slate-500 font-mono text-[9px]">{p.barcode.slice(-6)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: POS CART & BILLING PANEL */}
      <div className="w-full lg:w-96 bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Customer Selection */}
          <div className="mb-4 space-y-2 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" /> Customer
              </span>
              <button
                onClick={() => {
                  setSelectedCustomer('Walk-in Shopper');
                  setCustomerPhone('');
                }}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                Reset to Walk-in
              </button>
            </div>
            <select
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                const match = customers.find((c) => c.name === e.target.value);
                if (match) setCustomerPhone(match.phone);
              }}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none"
            >
              <option value="Walk-in Shopper">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="overflow-y-auto max-h-56 space-y-2 mb-4 pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Cart is empty. Scan barcodes or click items.
              </div>
            ) : (
              cart.map((it) => (
                <div
                  key={it.product.id}
                  className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <div className="font-semibold text-white truncate">{it.product.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      ${it.product.selling_price.toFixed(2)} x {it.quantity} = $
                      {(it.product.selling_price * it.quantity).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(it.product.id, -1)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-bold w-5 text-center text-white">{it.quantity}</span>
                    <button
                      onClick={() => updateQuantity(it.product.id, 1)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(it.product.id)}
                      className="p-1 rounded text-rose-400 hover:bg-rose-500/20 ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Totals & Payment Execution */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (5%):</span>
              <span className="font-mono text-white">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-slate-800">
              <span>Grand Total:</span>
              <span className="text-lg font-black text-emerald-400 font-mono">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-2 rounded-lg text-center text-[10px] font-bold border transition ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Banknote className="w-3.5 h-3.5 mx-auto mb-1" />
              Cash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`p-2 rounded-lg text-center text-[10px] font-bold border transition ${
                paymentMethod === 'upi'
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 mx-auto mb-1" />
              UPI
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('paypal')}
              className={`p-2 rounded-lg text-center text-[10px] font-bold border transition ${
                paymentMethod === 'paypal'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 mx-auto mb-1" />
              PayPal
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('credit')}
              className={`p-2 rounded-lg text-center text-[10px] font-bold border transition ${
                paymentMethod === 'credit'
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 mx-auto mb-1" />
              Credit
            </button>
          </div>

          {/* Complete Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={processing || cart.length === 0}
            className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 ${
              isOffline
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            } disabled:opacity-50`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {processing
                ? 'Processing...'
                : isOffline
                ? `Queue Offline Sale ($${total.toFixed(2)})`
                : `Complete Sale ($${total.toFixed(2)})`}
            </span>
          </button>
        </div>
      </div>

      {/* COMPLETED RECEIPT MODAL */}
      {completedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <button
              onClick={() => setCompletedOrder(null)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="font-bold text-base text-white">Sale Recorded!</h3>
              <p className="text-xs text-slate-400 font-mono">
                {completedOrder.order_number} • {completedOrder.payment_method?.toUpperCase()}
              </p>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Customer:</span>
                <span className="text-white font-medium">{completedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Items Count:</span>
                <span className="text-white font-mono">{completedOrder.items?.length || 0}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-slate-800">
                <span>Total Paid:</span>
                <span className="text-emerald-400 font-mono">${completedOrder.total_amount?.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                onClick={() => setCompletedOrder(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
