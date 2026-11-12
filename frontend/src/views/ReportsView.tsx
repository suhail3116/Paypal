import React, { useState } from 'react';
import { Order, Product, Customer } from '../types';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Globe,
  Store,
  Filter
} from 'lucide-react';

interface ReportsViewProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  currency: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  products,
  customers,
  currency = 'USD'
}) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const paidOrders = orders.filter((o) => o.payment_status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const onlineSales = paidOrders.filter((o) => o.source === 'website' || o.source === 'whatsapp');
  const offlineSales = paidOrders.filter((o) => o.source === 'pos' || o.source === 'phone');

  const exportReportCSV = () => {
    const headers = 'OrderNumber,Customer,Channel,Subtotal,Tax,Total,PaymentStatus,Date\n';
    const rows = orders
      .map(
        (o) =>
          `"${o.order_number}","${o.customer_name}","${o.source}",${o.subtotal},${o.tax_amount},${o.total_amount},"${o.payment_status}","${o.created_at}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shoppilot_sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0f172a] border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Business Intelligence & Financial Reports</h3>
            <p className="text-xs text-slate-400">
              Omnichannel breakdown, gross revenue totals, and downloadable CSV audits
            </p>
          </div>
        </div>

        <button
          onClick={exportReportCSV}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Full Sales CSV</span>
        </button>
      </div>

      {/* KPI Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Total Paid Revenue
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono">${totalRevenue.toFixed(2)}</div>
          <span className="text-xs text-slate-500 mt-1 block">Verified completed payments</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Online Revenue (Web + WhatsApp)
          </span>
          <div className="text-2xl font-black text-blue-400 font-mono">
            ${onlineSales.reduce((a, b) => a + b.total_amount, 0).toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">{onlineSales.length} paid digital orders</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">
            Offline Revenue (In-Store POS + Phone)
          </span>
          <div className="text-2xl font-black text-purple-400 font-mono">
            ${offlineSales.reduce((a, b) => a + b.total_amount, 0).toFixed(2)}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">{offlineSales.length} physical store sales</span>
        </div>
      </div>

      {/* Channel Comparison Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h4 className="font-bold text-sm text-white">Sales Channel Performance</h4>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">Channel Source</th>
              <th className="p-3">Order Volume</th>
              <th className="p-3">Total Gross Sales</th>
              <th className="p-3">Avg. Order Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {['website', 'whatsapp', 'pos', 'phone'].map((ch) => {
              const chOrders = orders.filter((o) => o.source === ch);
              const chSales = chOrders.reduce((sum, o) => sum + o.total_amount, 0);
              const aov = chOrders.length ? chSales / chOrders.length : 0;
              return (
                <tr key={ch} className="hover:bg-slate-800/30">
                  <td className="p-3 font-sans font-bold capitalize text-white flex items-center gap-2">
                    {ch === 'website' && <Globe className="w-3.5 h-3.5 text-blue-400" />}
                    {ch === 'whatsapp' && <Store className="w-3.5 h-3.5 text-emerald-400" />}
                    {ch === 'pos' && <Store className="w-3.5 h-3.5 text-purple-400" />}
                    {ch}
                  </td>
                  <td className="p-3 text-slate-300">{chOrders.length}</td>
                  <td className="p-3 font-bold text-slate-100">${chSales.toFixed(2)}</td>
                  <td className="p-3 text-emerald-400">${aov.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
