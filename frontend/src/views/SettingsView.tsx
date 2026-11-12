import React, { useState } from 'react';
import { Shop } from '../types';
import {
  Settings,
  Building2,
  Percent,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Save,
  Check
} from 'lucide-react';
import * as api from '../api';

interface SettingsViewProps {
  shop: Shop | null;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  shop,
  onRefreshData
}) => {
  const [formData, setFormData] = useState({
    name: shop?.name || 'Apex Mart & Grocers',
    business_phone: shop?.business_phone || '+1 (555) 234-5678',
    address: shop?.address || '742 Evergreen Terrace, Springfield, OR',
    currency: shop?.currency || 'USD',
    tax_percentage: shop?.tax_percentage || 5.0,
    tax_registration_number: shop?.tax_registration_number || 'GSTIN-98765432-A1',
    invoice_prefix: shop?.invoice_prefix || 'INV-2026',
    paypal_mode: shop?.paypal_mode || 'sandbox',
    paypal_client_id: shop?.paypal_client_id || '',
    paypal_secret: shop?.paypal_secret || ''
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateShopSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onRefreshData();
    } catch (e: any) {
      alert(e.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Shop Profile & Gateway Credentials</h3>
            <p className="text-xs text-slate-400">
              Configure multi-tenant business information, tax rates, and PayPal Developer Sandbox keys.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Details */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-4 text-xs">
          <h4 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Store Identity & Invoicing</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Business Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Business Phone</label>
              <input
                type="text"
                value={formData.business_phone}
                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Store Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="INR">INR (₹)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Tax Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.tax_percentage}
                onChange={(e) => setFormData({ ...formData, tax_percentage: Number(e.target.value) })}
                className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Invoice Number Prefix</label>
              <input
                type="text"
                value={formData.invoice_prefix}
                onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* PayPal Credentials */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-4 text-xs">
          <h4 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <CreditCard className="w-4 h-4 text-blue-400" />
            <span>PayPal Developer Integration</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Gateway Environment</label>
              <select
                value={formData.paypal_mode}
                onChange={(e) => setFormData({ ...formData, paypal_mode: e.target.value as any })}
                className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white font-semibold"
              >
                <option value="sandbox">Developer Sandbox (Recommended for Demo)</option>
                <option value="live">Live Production</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1 font-semibold">PayPal Client ID</label>
              <input
                type="text"
                value={formData.paypal_client_id}
                onChange={(e) => setFormData({ ...formData, paypal_client_id: e.target.value })}
                placeholder="From developer.paypal.com/dashboard/applications/sandbox"
                className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          {saved && (
            <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Settings updated successfully!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow-md transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
