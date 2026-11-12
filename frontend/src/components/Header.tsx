import React from 'react';
import { Shop } from '../types';
import { RefreshCw, Sparkles, Building2, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  shop: Shop | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onGeneratePlan: () => void;
  isGeneratingPlan: boolean;
  isOffline: boolean;
  onToggleOffline: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  shop,
  onRefresh,
  isRefreshing,
  onGeneratePlan,
  isGeneratingPlan,
  isOffline,
  onToggleOffline
}) => {
  return (
    <header className="h-16 bg-[#0c1222]/90 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            {shop?.name || 'Apex Mart & Grocers'}
            <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              {shop?.currency || 'USD'} ({shop?.tax_percentage || 5}% Tax)
            </span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            {shop?.address || 'Springfield, OR'} • Multi-Tenant ID: {shop?.id?.slice(0, 8)}...
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Offline Mode Toggle for POS demonstration */}
        <button
          onClick={onToggleOffline}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            isOffline
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
          }`}
          title="Toggle POS network connection to demonstrate offline queueing"
        >
          {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
          <span>{isOffline ? 'Offline Mode (Active)' : 'Online Sync'}</span>
        </button>

        {/* AI Morning Briefing button */}
        <button
          onClick={onGeneratePlan}
          disabled={isGeneratingPlan}
          className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isGeneratingPlan ? 'Synthesizing...' : 'AI Morning Plan'}</span>
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition"
          title="Refresh store telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
