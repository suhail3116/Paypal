import React, { useState } from 'react';
import { Invoice } from '../types';
import {
  FileText,
  Printer,
  Download,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  X
} from 'lucide-react';

interface InvoicesViewProps {
  invoices: Invoice[];
  shopName: string;
  taxRegNumber: string;
  currency: string;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  shopName,
  taxRegNumber,
  currency = 'USD'
}) => {
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.order_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Search Bar */}
      <div className="flex items-center justify-between bg-[#0f172a] border border-slate-800 rounded-xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices by invoice number, order, or customer..."
            className="w-full bg-[#070b14] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>
        <span className="text-xs text-slate-400">Total Invoices: {invoices.length}</span>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Invoice Number</th>
                <th className="px-4 py-3">Order Number</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Subtotal</th>
                <th className="px-4 py-3">Tax</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-mono font-bold text-white">{inv.invoice_number}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{inv.order_number}</td>
                  <td className="px-4 py-3 font-medium text-white">{inv.customer_name}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">${inv.subtotal.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">${inv.tax_amount.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-200">${inv.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.payment_status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {inv.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white px-2.5 py-1 rounded text-xs font-semibold border border-blue-500/30 transition"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View & Print</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINTABLE INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-xl p-8 shadow-2xl relative font-sans">
            <button
              onClick={() => setSelectedInvoice(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-500 hover:text-black rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Invoice Document */}
            <div id="printable-invoice">
              <div className="flex justify-between items-start border-b border-slate-200 pb-5 mb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{shopName}</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Tax Reg: {taxRegNumber}</p>
                  <p className="text-xs text-slate-500">Official Retail Sales Invoice</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase text-blue-600 tracking-wider block">INVOICE</span>
                  <div className="text-lg font-black font-mono">{selectedInvoice.invoice_number}</div>
                  <span className="text-[11px] text-slate-500">
                    Date: {new Date(selectedInvoice.issued_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-6 p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="font-bold text-slate-700 block mb-0.5">Billed To:</span>
                  <div className="font-semibold text-slate-900">{selectedInvoice.customer_name}</div>
                  <div className="text-slate-600 font-mono">{selectedInvoice.customer_phone}</div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-700 block mb-0.5">Order Reference:</span>
                  <div className="font-mono text-slate-900 font-semibold">{selectedInvoice.order_number}</div>
                  <div className="text-slate-600">
                    Status:{' '}
                    <strong className={selectedInvoice.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}>
                      {selectedInvoice.payment_status?.toUpperCase()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Applicable GST / Sales Tax:</span>
                  <span className="font-mono font-medium">${selectedInvoice.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
                  <span>Grand Total Due:</span>
                  <span className="font-mono text-blue-700">${selectedInvoice.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                Thank you for your business! Powered by ShopPilot AI & PayPal Payments.
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-lg flex items-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                Print / Save as PDF
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs px-4 py-2 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
