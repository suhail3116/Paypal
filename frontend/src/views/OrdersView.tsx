import React, { useState } from 'react';
import { Order } from '../types';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  CreditCard,
  Truck,
  Phone,
  MessageSquare,
  Globe,
  Store,
  ChevronRight
} from 'lucide-react';
import * as api from '../api';

interface OrdersViewProps {
  orders: Order[];
  onRefreshData: () => void;
  currency: string;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onRefreshData,
  currency = 'USD'
}) => {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, { order_status: nextStatus });
      onRefreshData();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, order_status: nextStatus as any });
      }
    } catch (e: any) {
      alert(e.message || 'Status update failed');
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone.includes(search);
    const matchesSource = sourceFilter === 'all' || o.source === sourceFilter;
    const matchesStatus = statusFilter === 'all' || o.order_status === statusFilter;
    return matchesSearch && matchesSource && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0f172a] border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders by number (ORD-...), customer, or phone..."
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="website">Website</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="pos">In-Store POS</option>
            <option value="phone">Phone Orders</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Table */}
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((o) => {
                  const isSelected = selectedOrder?.id === o.id;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedOrder(o)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-blue-950/40 text-white' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-300">{o.order_number}</td>
                      <td className="px-4 py-3 font-semibold text-white">{o.customer_name}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">
                          {o.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-200">${o.total_amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            o.payment_status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-300">{o.order_status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Order Details Drawer */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 h-fit sticky top-6 space-y-4">
          {selectedOrder ? (
            <>
              <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider block">
                    Order Details
                  </span>
                  <h3 className="text-base font-black text-white font-mono">{selectedOrder.order_number}</h3>
                  <span className="text-xs text-slate-400">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </span>
                </div>
                <span className="text-xs font-bold uppercase bg-slate-800 px-2.5 py-1 rounded text-slate-300">
                  {selectedOrder.source}
                </span>
              </div>

              {/* Status Progression Stepper */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block">Fulfillment Stepper:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {['confirmed', 'processing', 'delivered'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                      className={`py-1.5 rounded text-[10px] uppercase font-bold border transition ${
                        selectedOrder.order_status === st
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer details */}
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                <div className="font-bold text-white">{selectedOrder.customer_name}</div>
                <div className="text-slate-400 font-mono text-[11px]">{selectedOrder.customer_phone}</div>
                {selectedOrder.delivery_address && (
                  <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                    {selectedOrder.delivery_address}
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block">Line Items:</span>
                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg overflow-hidden bg-slate-900/40 text-xs">
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between">
                      <div>
                        <div className="text-slate-200 font-medium">{it.product_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ${it.unit_price.toFixed(2)} x {it.quantity}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-white">${it.line_total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Financials */}
              <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-white">${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-mono text-white">${selectedOrder.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-800">
                  <span>Total Amount:</span>
                  <span className="text-emerald-400 font-mono">${selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Select an order from the table to view line items, delivery address, and status actions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
