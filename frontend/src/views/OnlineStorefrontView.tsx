import React, { useState } from 'react';
import { Product, Category } from '../types';
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  CheckCircle2,
  Package,
  ArrowRight,
  ExternalLink,
  X
} from 'lucide-react';
import * as api from '../api';

interface OnlineStorefrontViewProps {
  products: Product[];
  categories: Category[];
  shopName: string;
  onRefreshData: () => void;
  currency: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const OnlineStorefrontView: React.FC<OnlineStorefrontViewProps> = ({
  products,
  categories,
  shopName,
  onRefreshData,
  currency = 'USD'
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Guest Checkout Form
  const [customerName, setCustomerName] = useState('Sarah Jenkins');
  const [customerPhone, setCustomerPhone] = useState('+15559876543');
  const [deliveryAddress, setDeliveryAddress] = useState('980 University Way, Suite 402');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<any>(null);

  const addToCart = (p: Product) => {
    if (p.stock_quantity <= 0) {
      alert('Product is sold out');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === p.id);
      if (existing) {
        if (existing.quantity >= p.stock_quantity) {
          alert('Cannot exceed stock availability');
          return prev;
        }
        return prev.map((it) =>
          it.product.id === p.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { product: p, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => (it.product.id === id ? { ...it, quantity: it.quantity + delta } : it))
        .filter((it) => it.quantity > 0)
    );
  };

  const cartCount = cart.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = cart.reduce((sum, it) => sum + it.product.selling_price * it.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handleGuestCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart.length) return;
    setIsCheckingOut(true);

    try {
      const itemsPayload = cart.map((it) => ({
        product_id: it.product.id,
        quantity: it.quantity
      }));

      // Step 1: Create Order in Central Database (reduces stock, registers CRM customer)
      const res = await api.createOrder({
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        source: 'website',
        payment_method: 'paypal',
        items: itemsPayload
      });

      // Step 2: Initialize PayPal Sandbox Checkout
      const paypalRes = await api.createPayPalOrder({
        order_id: res.order.id,
        order_number: res.order.order_number,
        amount: res.order.total_amount,
        return_url: `${window.location.origin}/payment-success`,
        cancel_url: `${window.location.origin}/payment-cancel`
      });

      setOrderConfirmation({
        order: res.order,
        paypal: paypalRes
      });
      setCart([]);
      setIsCartOpen(false);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Checkout failed');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSimulatePayment = async (paypalOrderId: string) => {
    try {
      await api.capturePayPalOrder(paypalOrderId);
      alert('PayPal payment captured! Order marked as PAID in database.');
      if (orderConfirmation) {
        setOrderConfirmation({
          ...orderConfirmation,
          order: { ...orderConfirmation.order, payment_status: 'paid' }
        });
      }
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Payment simulation failed');
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === 'all' || p.category_id === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Storefront Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-[#0f172a] to-indigo-900/40 border border-blue-500/30 rounded-2xl p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-500/30">
            Official Online Store
          </span>
          <h2 className="text-2xl font-black text-white mt-2">{shopName}</h2>
          <p className="text-xs text-slate-300 max-w-lg mt-1 leading-relaxed">
            Order premium groceries and essentials online. Direct PayPal Sandbox checkout with automatic inventory synchronization.
          </p>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="relative bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Shopping Cart</span>
          {cartCount > 0 && (
            <span className="bg-white text-blue-950 font-black px-2 py-0.5 rounded-full text-[10px]">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Catalog Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0f172a] border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog for organic products, grains, tea..."
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedCat === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCat === c.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((p) => {
          const inStock = p.stock_quantity > 0;
          return (
            <div
              key={p.id}
              className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div className="h-40 bg-slate-900 relative overflow-hidden">
                <img
                  src={p.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
                {!inStock && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center font-bold text-xs text-rose-400">
                    Out of Stock
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white line-clamp-1">{p.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Price</span>
                    <span className="text-base font-black text-white font-mono">
                      ${p.selling_price.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => addToCart(p)}
                    disabled={!inStock}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow transition disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CART & GUEST CHECKOUT DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-[#0f172a] border-l border-slate-800 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-400" />
                  <span>Your Cart ({cartCount})</span>
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Your shopping cart is currently empty.
                  </div>
                ) : (
                  cart.map((it) => (
                    <div
                      key={it.product.id}
                      className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-white truncate">{it.product.name}</div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          ${it.product.selling_price.toFixed(2)} each
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateQty(it.product.id, -1)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-white w-4 text-center">
                          {it.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(it.product.id, 1)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Guest Checkout Form */}
              {cart.length > 0 && (
                <form id="checkout-form" onSubmit={handleGuestCheckout} className="space-y-3 text-xs pt-4 border-t border-slate-800">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
                    Guest Delivery Details
                  </span>
                  <div>
                    <label className="block text-slate-400 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">WhatsApp / Phone *</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Delivery Address *</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Total & Checkout Button */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (5%):</span>
                    <span className="font-mono text-white">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-slate-800">
                    <span>Total:</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isCheckingOut}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isCheckingOut ? 'Creating Order...' : `Pay with PayPal ($${total.toFixed(2)})`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORDER CONFIRMATION MODAL WITH PAYPAL LINK */}
      {orderConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setOrderConfirmation(null)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-3 border-b border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="font-bold text-base text-white">Online Order Placed!</h3>
              <p className="text-xs text-slate-400 font-mono">
                Order #{orderConfirmation.order.order_number}
              </p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Total:</span>
                <span className="font-bold text-white font-mono">
                  ${orderConfirmation.order.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Status:</span>
                <span
                  className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                    orderConfirmation.order.payment_status === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {orderConfirmation.order.payment_status}
                </span>
              </div>
            </div>

            {/* PayPal Checkout Link */}
            {orderConfirmation.paypal?.checkout_url && (
              <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg space-y-2">
                <span className="text-[11px] font-bold text-blue-300 block">
                  PayPal Sandbox Checkout Generated:
                </span>
                <div className="flex flex-col gap-2">
                  <a
                    href={orderConfirmation.paypal.checkout_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 shadow"
                  >
                    <span>Proceed to PayPal Checkout</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleSimulatePayment(orderConfirmation.paypal.paypal_order_id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 rounded-lg transition"
                  >
                    ⚡ Simulate Buyer Approval & Capture
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
