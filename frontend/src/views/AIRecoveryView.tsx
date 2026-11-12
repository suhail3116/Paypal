import React, { useState, useEffect } from 'react';
import { PaymentReminder, Order } from '../types';
import {
  RefreshCw,
  ShieldCheck,
  Check,
  X,
  Send,
  MessageSquare,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import * as api from '../api';

interface AIRecoveryViewProps {
  unpaidOrders: Order[];
  onRefreshData: () => void;
  currency: string;
}

export const AIRecoveryView: React.FC<AIRecoveryViewProps> = ({
  unpaidOrders,
  onRefreshData,
  currency = 'USD'
}) => {
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingForId, setGeneratingForId] = useState<string | null>(null);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const res = await api.getRecoveryReminders();
      setReminders(res.reminders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, [unpaidOrders]);

  const handleGenerate = async (orderId: string) => {
    setGeneratingForId(orderId);
    try {
      await api.generatePaymentReminder(orderId);
      await loadReminders();
    } catch (e: any) {
      alert(e.message || 'Error generating reminder');
    } finally {
      setGeneratingForId(null);
    }
  };

  const handleApprove = async (reminderId: string) => {
    try {
      await api.approvePaymentReminder(reminderId);
      alert('Payment reminder approved & dispatched via WhatsApp with 1-click PayPal link!');
      await loadReminders();
      onRefreshData();
    } catch (e: any) {
      alert(e.message || 'Approval failed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-[#0f172a] to-blue-950/30 border border-amber-500/30 rounded-xl p-5 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-white">AI Payment Recovery Agent (Human-in-the-Loop)</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Identifies overdue orders and drafts polite, personalized WhatsApp payment reminders with direct PayPal checkout links.
            <strong> Golden Rule:</strong> Reminders are only dispatched after you tap <strong>Approve & Dispatch</strong>.
          </p>
        </div>
      </div>

      {/* Unpaid Orders Action Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Unpaid Accounts Pending Collection ({unpaidOrders.length})</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold">
              <tr>
                <th className="p-3">Order Number</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Outstanding Amount</th>
                <th className="p-3 text-right">AI Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {unpaidOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/30">
                  <td className="p-3 font-mono font-bold text-white">{o.order_number}</td>
                  <td className="p-3 font-medium text-slate-200">{o.customer_name}</td>
                  <td className="p-3 font-mono text-slate-400">{o.customer_phone}</td>
                  <td className="p-3 font-mono font-bold text-amber-400">${o.total_amount.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleGenerate(o.id)}
                      disabled={generatingForId === o.id}
                      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow transition disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{generatingForId === o.id ? 'Drafting...' : 'Generate AI Reminder'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Queue for AI Generated Reminders */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Generated Reminder Approval Queue</span>
          </h4>
          <span className="text-xs text-slate-400">Total: {reminders.length}</span>
        </div>

        <div className="divide-y divide-slate-800">
          {reminders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No reminders generated yet. Click "Generate AI Reminder" on any unpaid order above.
            </div>
          ) : (
            reminders.map((r) => (
              <div key={r.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-800/30 transition">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{r.customer_name}</span>
                    <span className="font-mono text-[11px] text-slate-400">({r.customer_phone})</span>
                    <span className="font-mono text-xs font-bold text-amber-400">${r.amount?.toFixed(2)}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        r.status === 'sent'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>

                  <p className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed">
                    "{r.reminder_message}"
                  </p>
                </div>

                {r.status === 'pending_approval' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Dispatch</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
