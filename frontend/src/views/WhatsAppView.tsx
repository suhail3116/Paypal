import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Send,
  RefreshCw,
  Copy,
  ExternalLink,
  Bot
} from 'lucide-react';
import * as api from '../api';

interface WhatsAppViewProps {
  onRefreshData: () => void;
  currency: string;
}

export const WhatsAppView: React.FC<WhatsAppViewProps> = ({
  onRefreshData,
  currency = 'USD'
}) => {
  const [testMessage, setTestMessage] = useState(
    'Hi, this is Ravi 9876543210. Please send 2 Basmati Rice Royal 5kg and 1 Organic Sunflower Oil 1L to 124 Maple St by tomorrow.'
  );
  const [extracting, setExtracting] = useState(false);
  const [extractedOrder, setExtractedOrder] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleParse = async (msg = testMessage) => {
    if (!msg.trim()) return;
    setExtracting(true);
    setExtractedOrder(null);
    try {
      const res = await api.parseWhatsAppOrder(msg);
      setExtractedOrder(res);
    } catch (e: any) {
      alert(e.message || 'Error extracting order');
    } finally {
      setExtracting(false);
    }
  };

  const handleConfirmDraftOrder = async () => {
    if (!extractedOrder || !extractedOrder.items?.length) return;
    setConfirming(true);
    try {
      await api.createOrder({
        customer_name: extractedOrder.customer_name,
        customer_phone: extractedOrder.phone,
        delivery_address: extractedOrder.delivery_address,
        source: 'whatsapp',
        items: extractedOrder.items.map((it: any) => ({
          product_id: it.product_id,
          quantity: it.qty
        }))
      });
      alert('Draft order confirmed and converted to official WhatsApp order with stock deduction!');
      setExtractedOrder(null);
      onRefreshData();
    } catch (e: any) {
      alert(e.message || 'Confirmation failed');
    } finally {
      setConfirming(false);
    }
  };

  const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* WhatsApp Cloud API Integration Settings Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">WhatsApp Business Cloud API Gateway</h3>
              <p className="text-xs text-slate-400">
                Official Meta Cloud API webhook integration with real-time payload verification
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30 font-mono">
            Webhook Active
          </span>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Your Verified Callback URL (Meta Developers):</span>
            <span className="font-mono text-emerald-400 select-all font-semibold">{webhookUrl}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(webhookUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-semibold border border-slate-700 transition shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copied URL!' : 'Copy Webhook URL'}
          </button>
        </div>
      </div>

      {/* AI Conversational Order Extraction Demo Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Chat Simulator */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Chat Simulator
              </span>
              <span className="text-[11px] text-slate-500">Unstructured Chat Input</span>
            </div>

            <div className="mb-4 space-y-1.5">
              <span className="text-[11px] text-slate-400 font-semibold">One-Click Quick Samples:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const msg = 'Hi, this is Ravi 9876543210. Please send 2 Basmati Rice Royal 5kg and 1 Organic Sunflower Oil 1L to 124 Maple St by tomorrow.';
                    setTestMessage(msg);
                    handleParse(msg);
                  }}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 transition"
                >
                  Ravi: Rice + Oil
                </button>
                <button
                  onClick={() => {
                    const msg = 'Priya here (+19123456780). Please prepare 1 Whole Wheat Atta 10kg and 2 Assam Orthodox Black Tea 500g.';
                    setTestMessage(msg);
                    handleParse(msg);
                  }}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 transition"
                >
                  Priya: Atta + Tea
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Paste customer WhatsApp message here..."
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed resize-none"
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => handleParse()}
              disabled={extracting}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-md transition disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {extracting ? 'AI Model Parsing...' : 'Parse WhatsApp Order with AI'}
            </button>
          </div>
        </div>

        {/* Right: Structured Draft Proposal & Stock Validation */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> AI Order Proposal & Stock Check
              </span>
              {extractedOrder && (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Verified with Catalog
                </span>
              )}
            </div>

            {!extractedOrder && !extracting && (
              <div className="h-60 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-lg p-6 text-center text-xs">
                <Bot className="w-8 h-8 mb-2 opacity-50" />
                Click "Parse WhatsApp Order with AI" to test real-time conversational order extraction.
              </div>
            )}

            {extracting && (
              <div className="h-60 flex flex-col items-center justify-center text-slate-400 space-y-3 text-xs">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <span className="font-mono">Extracting items & validating live stock thresholds...</span>
              </div>
            )}

            {extractedOrder && (
              <div className="space-y-4">
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{extractedOrder.customer_name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{extractedOrder.phone}</div>
                  </div>
                  {extractedOrder.delivery_address && (
                    <span className="text-slate-400 text-[11px] max-w-[180px] text-right truncate">
                      {extractedOrder.delivery_address}
                    </span>
                  )}
                </div>

                {/* Items */}
                <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Qty</th>
                        <th className="p-2.5">Stock</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                      {extractedOrder.items?.map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-white">{it.product_name}</td>
                          <td className="p-2.5 font-mono text-slate-300">{it.qty}</td>
                          <td className="p-2.5">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                it.sufficient_stock
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {it.in_stock} left
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-white">
                            ${it.line_total?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-400">Estimated Total:</span>
                  <span className="text-lg font-black text-white font-mono">
                    ${extractedOrder.estimated_total?.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {extractedOrder && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleConfirmDraftOrder}
                disabled={confirming}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-md transition disabled:opacity-50"
              >
                {confirming ? 'Recording Order...' : 'Confirm & Save WhatsApp Order'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
