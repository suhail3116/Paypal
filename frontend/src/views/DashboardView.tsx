import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  ShoppingBag,
  ArrowRight,
  Globe,
  Store,
  Sparkles,
  CreditCard
} from 'lucide-react';

interface DashboardViewProps {
  data: any;
  dailyPlan: string | null;
  onNavigateTab: (tab: string) => void;
  currency: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  dailyPlan,
  onNavigateTab,
  currency = 'USD'
}) => {
  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 4 PRIMARY METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ${(kpis.today_sales || 0).toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{kpis.today_orders || 0} orders</span>
            recorded today
          </div>
        </div>

        {/* Total Gross Revenue */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ${(kpis.total_revenue || 0).toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Across {kpis.total_orders || 0} lifetime transactions
          </div>
        </div>

        {/* Unpaid Orders / Outstanding */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Payments</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            ${(kpis.outstanding_payments || 0).toFixed(2)}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>{data?.unpaid_orders?.length || 0} unpaid orders</span>
            <button
              onClick={() => onNavigateTab('recovery')}
              className="text-amber-400 hover:underline font-semibold"
            >
              Recover &rarr;
            </button>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">
            {kpis.low_stock_count || 0} Items
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>Below safety threshold</span>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-rose-400 hover:underline font-semibold"
            >
              Restock &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* AI DAILY SHOP MANAGER BRIEFING BANNER */}
      {dailyPlan && (
        <div className="bg-gradient-to-br from-purple-950/40 via-[#0f172a] to-blue-950/30 border border-purple-500/30 rounded-xl p-6 shadow-xl relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">AI Daily Shop Manager Briefing</h3>
                <p className="text-xs text-slate-400">
                  Real-time business insights compiled by Llama/Groq from live database records
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('recovery')}
              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1.5"
            >
              <span>Manage Collections</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-line leading-relaxed">
            {dailyPlan}
          </div>
        </div>
      )}

      {/* OMNICHANNEL SALES BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 lg:col-span-1 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Omnichannel Channel Distribution</span>
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" /> Online Orders (Web / WhatsApp)
                </span>
                <span className="font-bold text-white font-mono">{kpis.online_sales_count || 0}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, ((kpis.online_sales_count || 0) / Math.max(1, kpis.total_orders || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-emerald-400" /> Offline Orders (POS / Walk-in / Phone)
                </span>
                <span className="font-bold text-white font-mono">{kpis.offline_sales_count || 0}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${Math.min(100, ((kpis.offline_sales_count || 0) / Math.max(1, kpis.total_orders || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Customers</span>
              <span className="text-lg font-bold text-white font-mono">{kpis.total_customers || 0}</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Completed Orders</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{kpis.completed_orders || 0}</span>
            </div>
          </div>
        </div>

        {/* RECENT ORDERS TABLE */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-400" />
                <span>Recent Omnichannel Orders</span>
              </h3>
              <button
                onClick={() => onNavigateTab('orders')}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View All Orders</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Order</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Channel</th>
                    <th className="px-4 py-2.5">Total</th>
                    <th className="px-4 py-2.5">Payment</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(data?.recent_orders || []).slice(0, 5).map((o: any) => (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-300">{o.order_number}</td>
                      <td className="px-4 py-2.5 text-white font-medium">{o.customer_name}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">
                          {o.source}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-200">${o.total_amount.toFixed(2)}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            o.payment_status === 'paid'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 capitalize text-slate-400">{o.order_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
