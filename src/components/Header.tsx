import React from 'react';
import { TrendingUp, Sun, Moon, Download, RefreshCw } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onExport: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  isRealTime: boolean;
  dataSource?: string;
  lastUpdated?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  onToggleTheme,
  onExport,
  onRefresh,
  isLoading,
  isRealTime,
  dataSource,
  lastUpdated,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <a href="/" className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              AlphaBacktest
            </span>
          </div>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#parameters" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            Parameters
          </a>
          <a href="#summary" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            Comparison
          </a>
          <a href="#lump-sum" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            Lump Sum Strategy
          </a>
          <a href="#yearly-top-up" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            Yearly Top-Up
          </a>
          <a href="#cagr-chart" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">
            CAGR Visualization
          </a>
        </nav>

        {/* Zone 3: Primary Actions & Utilities */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Data freshness indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>{dataSource || (isRealTime ? 'Live Market Data' : 'Historical Archive')}</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Backtest Data"
            className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          <button
            onClick={onToggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
