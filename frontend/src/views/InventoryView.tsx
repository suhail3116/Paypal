import React, { useState, useEffect } from 'react';
import { Product, InventoryMovement } from '../types';
import {
  Boxes,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  History,
  Plus,
  Minus,
  RefreshCw,
  Search,
  DollarSign
} from 'lucide-react';
import * as api from '../api';

interface InventoryViewProps {
  products: Product[];
  onRefreshData: () => void;
  currency: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onRefreshData,
  currency = 'USD'
}) => {
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'damage'>('add');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getInventory();
      setInventoryData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [products]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;
    setSubmitting(true);
    try {
      await api.adjustInventory({
        product_id: adjustModalProduct.id,
        adjustment_type: adjustmentType,
        quantity,
        notes
      });
      setAdjustModalProduct(null);
      setNotes('');
      setQuantity(1);
      loadInventory();
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Adjustment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const val = inventoryData?.valuation || { cost_value: 0, retail_value: 0, total_units: 0 };
  const expectedProfit = val.retail_value - val.cost_value;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* VALUATION SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Stock On Hand
          </span>
          <div className="text-2xl font-black text-white font-mono">{val.total_units} Units</div>
          <span className="text-xs text-slate-500 mt-1 block">Across {products.length} catalog items</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Cost Valuation
          </span>
          <div className="text-2xl font-black text-slate-300 font-mono">${val.cost_value.toFixed(2)}</div>
          <span className="text-xs text-slate-500 mt-1 block">Asset value based on purchase cost</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Retail Sales Valuation
          </span>
          <div className="text-2xl font-black text-blue-400 font-mono">${val.retail_value.toFixed(2)}</div>
          <span className="text-xs text-slate-500 mt-1 block">Gross market value at selling price</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Projected Profit
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono">${expectedProfit.toFixed(2)}</div>
          <span className="text-xs text-slate-500 mt-1 block">Gross inventory markup potential</span>
        </div>
      </div>

      {/* QUICK STOCK ADJUSTMENT ACTION GRID */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-blue-400" />
              <span>Real-Time Stock Audit & Quick Adjustments</span>
            </h3>
            <p className="text-xs text-slate-400">
              Click any product to record stock receipts, waste/damage write-offs, or cycle counts.
            </p>
          </div>
          <button
            onClick={loadInventory}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {products.map((p) => {
            const isLow = p.stock_quantity <= p.low_stock_threshold;
            return (
              <div
                key={p.id}
                onClick={() => setAdjustModalProduct(p)}
                className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between transition group"
              >
                <div>
                  <div className="font-bold text-xs text-white group-hover:text-blue-400 transition truncate max-w-[180px]">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{p.sku}</div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-base font-black text-white">{p.stock_quantity}</div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      isLow ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {isLow ? 'Low Alert' : 'Healthy'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* INVENTORY MOVEMENT AUDIT TRAIL */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <span>Inventory Movement History (Audit Trail)</span>
          </h3>
          <span className="text-xs text-slate-400">Tracks all POS, Web & manual stock deductions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-sans">Timestamp</th>
                <th className="px-4 py-3 font-sans">Product</th>
                <th className="px-4 py-3 font-sans">Type</th>
                <th className="px-4 py-3 font-sans">Change</th>
                <th className="px-4 py-3 font-sans">Before / After</th>
                <th className="px-4 py-3 font-sans">Reference / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {(inventoryData?.movements || []).map((m: InventoryMovement) => (
                <tr key={m.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-2.5 text-slate-500">{new Date(m.created_at).toLocaleTimeString()}</td>
                  <td className="px-4 py-2.5 font-sans font-semibold text-white">{m.product_name}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        m.movement_type === 'sale'
                          ? 'bg-blue-500/20 text-blue-300'
                          : m.movement_type === 'purchase'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {m.movement_type}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-2.5 font-bold ${
                      m.quantity_change > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">
                    {m.previous_stock} &rarr; <strong className="text-white">{m.new_stock}</strong>
                  </td>
                  <td className="px-4 py-2.5 font-sans text-slate-400 text-xs truncate max-w-xs">
                    {m.reference_id ? `[${m.reference_id}] ` : ''}
                    {m.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUSTMENT MODAL */}
      {adjustModalProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">
              Adjust Stock: {adjustModalProduct.name}
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Current Stock: {adjustModalProduct.stock_quantity} units
            </p>

            <form onSubmit={handleAdjust} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Adjustment Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('add')}
                    className={`py-2 rounded-lg font-bold border transition ${
                      adjustmentType === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    + Stock Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('remove')}
                    className={`py-2 rounded-lg font-bold border transition ${
                      adjustmentType === 'remove'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    - Correction
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('damage')}
                    className={`py-2 rounded-lg font-bold border transition ${
                      adjustmentType === 'damage'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    - Damaged
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Reason / Audit Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Supplier delivery PO-409, broken jar write-off"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  {submitting ? 'Recording...' : 'Save Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
