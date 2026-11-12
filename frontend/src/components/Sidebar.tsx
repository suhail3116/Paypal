import React from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Users,
  ShoppingBag,
  Calculator,
  FileText,
  CreditCard,
  MessageSquare,
  Bot,
  RefreshCw,
  BarChart3,
  Settings,
  Store
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isStorefrontOpen: boolean;
  onToggleStorefront: () => void;
  pendingRemindersCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isStorefrontOpen,
  onToggleStorefront,
  pendingRemindersCount
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'customers', label: 'Customers (CRM)', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'pos', label: 'POS Billing', icon: Calculator, badge: 'Offline' },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments (PayPal)', icon: CreditCard },
    { id: 'whatsapp', label: 'WhatsApp API', icon: MessageSquare, badge: 'AI' },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    { id: 'recovery', label: 'AI Debt Recovery', icon: RefreshCw, count: pendingRemindersCount },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-lg">
              SP
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                ShopPilot <span className="text-blue-400">AI</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Omnichannel Commerce
              </span>
            </div>
          </div>
        </div>

        {/* Storefront Mode Switcher */}
        <div className="p-3">
          <button
            onClick={onToggleStorefront}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              isStorefrontOpen
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>Customer Storefront</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
              Online
            </span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-230px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = !isStorefrontOpen && currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isStorefrontOpen) onToggleStorefront();
                  onSelectTab(item.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Connectivity */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] space-y-1.5">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Node API
          </span>
          <span className="text-emerald-400 font-mono">Ready</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            Cloud & Ollama AI
          </span>
          <span className="text-purple-400 font-mono">Hybrid</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            PayPal Sandbox
          </span>
          <span className="text-blue-400 font-mono">Verified</span>
        </div>
      </div>
    </aside>
  );
};
