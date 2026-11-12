import React, { useState } from 'react';
import { Customer } from '../types';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  ShoppingBag,
  ExternalLink,
  MessageSquare,
  X
} from 'lucide-react';
import * as api from '../api';

interface CustomersViewProps {
  customers: Customer[];
  onRefreshData: () => void;
  currency: string;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onRefreshData,
  currency = 'USD'
}) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    customer_source: 'manual' as any
  });

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCustomer(formData);
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '', notes: '', customer_source: 'manual' });
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error adding customer');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0f172a] border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search CRM by customer name, phone (+1...), or email..."
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Customers List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer Cards List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((c) => {
            const isSelected = selectedCustomer?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-950/30 border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      {c.name}
                      <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">
                        {c.customer_source}
                      </span>
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" /> {c.phone}
                      </span>
                      {c.email && (
                        <span className="flex items-center gap-1 font-sans">
                          <Mail className="w-3 h-3 text-slate-500" /> {c.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total Purchases</span>
                    <span className="text-sm font-black text-white font-mono">${c.total_purchases.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>{c.total_orders} lifetime orders</span>
                  {c.outstanding_balance > 0 ? (
                    <span className="text-amber-400 font-semibold font-mono">
                      Pending balance: ${c.outstanding_balance.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">No outstanding balance</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Customer Profile Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 h-fit sticky top-6 space-y-4">
          {selectedCustomer ? (
            <>
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider block mb-1">
                  Customer Profile
                </span>
                <h3 className="text-lg font-black text-white">{selectedCustomer.name}</h3>
                <span className="text-xs text-slate-400 font-mono">{selectedCustomer.phone}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Address:</span>
                  <span className="text-white font-medium">{selectedCustomer.address || 'No address saved'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Customer Source:</span>
                  <span className="capitalize text-slate-200">{selectedCustomer.customer_source}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Merchant Notes:</span>
                  <p className="bg-slate-900/80 p-2 rounded text-slate-300 italic text-[11px]">
                    {selectedCustomer.notes || 'No custom notes recorded'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Orders:</span>
                  <span className="font-mono text-white font-bold">{selectedCustomer.total_orders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Spent:</span>
                  <span className="font-mono text-white font-bold">${selectedCustomer.total_purchases.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-slate-800">
                  <span className="text-slate-300">Balance Due:</span>
                  <span className="font-mono text-amber-400">${selectedCustomer.outstanding_balance.toFixed(2)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Select a customer to view their full profile & omnichannel order history.
            </div>
          )}
        </div>
      </div>

      {/* ADD CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-base text-white">Add Customer to CRM</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210 (auto-normalized to E.164)"
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, Zip"
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Channel Source</label>
                <select
                  value={formData.customer_source}
                  onChange={(e) => setFormData({ ...formData, customer_source: e.target.value as any })}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="walk-in">Walk-in POS</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="website">Online Website</option>
                  <option value="phone">Phone Call</option>
                  <option value="manual">Manual Entry</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
