import React, { useState } from 'react';
import { Product, Category } from '../types';
import {
  Package,
  Plus,
  Search,
  Barcode,
  Edit2,
  Trash2,
  Filter,
  AlertTriangle,
  Check,
  X,
  Download
} from 'lucide-react';
import * as api from '../api';

interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  onRefreshData: () => void;
  currency: string;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  onRefreshData,
  currency = 'USD'
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    sku: '',
    barcode: '',
    description: '',
    purchase_cost: 0,
    selling_price: 0,
    stock_quantity: 0,
    low_stock_threshold: 5,
    tax_percentage: 5.0
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      barcode: `890${Date.now().toString().slice(-10)}`,
      description: '',
      purchase_cost: 5.0,
      selling_price: 10.0,
      stock_quantity: 20,
      low_stock_threshold: 5,
      tax_percentage: 5.0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category_id: p.category_id,
      sku: p.sku,
      barcode: p.barcode,
      description: p.description,
      purchase_cost: p.purchase_cost,
      selling_price: p.selling_price,
      stock_quantity: p.stock_quantity,
      low_stock_threshold: p.low_stock_threshold,
      tax_percentage: p.tax_percentage
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        await api.createProduct(formData);
      }
      setIsModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.deleteProduct(id);
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error deleting product');
    }
  };

  const exportCSV = () => {
    const headers = 'ID,Name,SKU,Barcode,Category,Cost,SellingPrice,Stock,Threshold\n';
    const rows = products.map(p => `"${p.id}","${p.name}","${p.sku}","${p.barcode}","${p.category_id}",${p.purchase_cost},${p.selling_price},${p.stock_quantity},${p.low_stock_threshold}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shoppilot_products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0f172a] border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by title, SKU, or barcode..."
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-md shadow-blue-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">SKU & Barcode</th>
                <th className="px-4 py-3">Cost Price</th>
                <th className="px-4 py-3">Selling Price</th>
                <th className="px-4 py-3">Profit Margin</th>
                <th className="px-4 py-3">Stock Level</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((p) => {
                const margin = ((p.selling_price - p.purchase_cost) / p.selling_price) * 100;
                const isLow = p.stock_quantity <= p.low_stock_threshold;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{p.description}</div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="text-slate-300 font-bold block">{p.sku}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Barcode className="w-3 h-3" /> {p.barcode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">${p.purchase_cost.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-200">${p.selling_price.toFixed(2)}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">+{margin.toFixed(0)}%</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">{p.stock_quantity}</span>
                        {isLow ? (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Low
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                            OK
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-base text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Purchase Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_cost}
                    onChange={(e) => setFormData({ ...formData, purchase_cost: Number(e.target.value) })}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Low-Stock Alert Level</label>
                  <input
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg p-2 text-white"
                />
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
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
