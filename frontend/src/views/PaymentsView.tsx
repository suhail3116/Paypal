import React, { useState } from 'react';
import { Payment } from '../types';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Search
} from 'lucide-react';
import * as api from '../api';

interface PaymentsViewProps {
  payments: Payment[];
  mode: string;
  hasCredentials: boolean;
  onRefreshData: () => void;
  currency: string;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  mode,
  hasCredentials,
  onRefreshData,
  currency = 'USD'
}) => {
  const [testOrderId, setTestOrderId] = useState('ord-1001');
  const [simulating, setSimulating] = useState(false);
  const [createdCheckout, setCreatedCheckout] = useState<any>(null);

  const handleCreateTestCheckout = async () => {
    setSimulating(true);
    try {
      const res = await api.createPayPalOrder({
        order_id: testOrderId,
        amount: 23.50,
        return_url: `${window.location.origin}/payment-success`,
        cancel_url: `${window.location.origin}/payment-cancelled`
      });
      setCreatedCheckout(res);
      onRefreshData();
    } catch (e: any) {
      alert(e.message || 'PayPal order creation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleCapture = async (paypalId: string) => {
    try {
      const res = await api.capturePayPalOrder(paypalId);
      alert(`PayPal Capture: ${res.status === 'COMPLETED' ? 'Payment Verified & Order Paid!' : res.status}`);
      onRefreshData();
    } catch (e: any) {
      alert(e.message || 'Capture failed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Gateway Configuration & Status Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              PayPal Developer Gateway
              <span className="text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                {mode === 'live' ? 'Live Production' : 'Developer Sandbox'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Backend OAuth2 authentication, dynamic order generation, and signature-verified webhook capture.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCreateTestCheckout}
            disabled={simulating}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-md shadow-blue-600/20 transition disabled:opacity-50 flex items-center gap-2"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{simulating ? 'Generating...' : 'Create Test PayPal Order'}</span>
          </button>
        </div>
      </div>

      {/* Generated Checkout Banner */}
      {createdCheckout && (
        <div className="bg-gradient-to-r from-blue-950/50 via-[#0f172a] to-emerald-950/40 border border-blue-500/40 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              PayPal Order Created Successfully!
            </span>
            <span className="text-xs font-mono text-blue-400 font-bold">{createdCheckout.paypal_order_id}</span>
          </div>

          <p className="text-xs text-slate-300">
            {createdCheckout.note || 'Ready for buyer checkout authorization.'}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={createdCheckout.checkout_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow"
            >
              <span>Open PayPal Checkout</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => handleCapture(createdCheckout.paypal_order_id)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              ⚡ Simulate Buyer Capture & Verify Order
            </button>
          </div>
        </div>
      )}

      {/* Payments Ledger */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Payment Ledger</span>
          </h3>
          <span className="text-xs text-slate-400">Total Transactions: {payments.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-sans">Timestamp</th>
                <th className="px-4 py-3 font-sans">Order Ref</th>
                <th className="px-4 py-3 font-sans">Payment Method</th>
                <th className="px-4 py-3 font-sans">PayPal Order ID</th>
                <th className="px-4 py-3 font-sans">Amount</th>
                <th className="px-4 py-3 font-sans">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[11px]">
              {payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-500">{new Date(pay.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold text-white font-sans">{pay.order_number}</td>
                  <td className="px-4 py-3 uppercase font-semibold text-slate-300">{pay.payment_method}</td>
                  <td className="px-4 py-3 text-blue-400 truncate max-w-xs">{pay.paypal_order_id || 'N/A (Direct)'}</td>
                  <td className="px-4 py-3 font-bold text-white">${pay.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        pay.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {pay.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
