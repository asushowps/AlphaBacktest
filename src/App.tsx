import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { ParameterControls } from './components/ParameterControls.js';
import { SummaryCards } from './components/SummaryCards.js';
import { StrategyTable } from './components/StrategyTable.js';
import { CagrChart } from './components/CagrChart.js';
import { YearlyBreakdownModal } from './components/YearlyBreakdownModal.js';
import { ExportModal } from './components/ExportModal.js';
import { BacktestParams, BacktestResponse, StrategyResult } from './types/stock.js';
import { runClientBacktest } from './services/clientBacktest.js';
import { AlertCircle, RefreshCw, Layers, TrendingUp, DollarSign } from 'lucide-react';

export default function App() {
  // Theme state: dark mode default for financial terminal look
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return true; // default dark
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Parameters state
  const [params, setParams] = useState<BacktestParams>({
    lumpSumAmount: 10000,
    yearlyTopUpAmount: 2400,
    years: 30,
    symbols: ['SPY', 'QQQ', 'AAPL', 'MSFT', 'NVDA'],
  });

  const [data, setData] = useState<BacktestResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('Live Market Feed');

  // Modals & View States
  const [selectedStockForModal, setSelectedStockForModal] = useState<StrategyResult | null>(null);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [strategyView, setStrategyView] = useState<'both' | 'lump-sum' | 'yearly-top-up'>('both');

  // Fetch backtest data with automatic browser fallback for Vercel / serverless deployments
  const fetchBacktestData = useCallback(async (currentParams: BacktestParams) => {
    setIsLoading(true);
    setError(null);

    // 1. Attempt serverless / API endpoint
    try {
      const query = new URLSearchParams({
        symbols: currentParams.symbols.join(','),
        lumpSum: currentParams.lumpSumAmount.toString(),
        yearlyTopUp: currentParams.yearlyTopUpAmount.toString(),
        years: currentParams.years.toString(),
      });

      const res = await fetch(`/api/stock-data?${query.toString()}`);
      const contentType = res.headers.get('content-type') || '';

      if (res.ok && contentType.includes('application/json')) {
        const json: BacktestResponse = await res.json();
        if (json.lumpSumResults && json.lumpSumResults.length > 0) {
          setData(json);
          setDataSource(json.isRealTime ? 'Live Market Feed' : 'Verified Archive');
          setIsLoading(false);
          return;
        }
      }
      throw new Error(`API returned HTTP ${res.status} or non-JSON response`);
    } catch (serverErr) {
      console.warn('[AlphaBacktest] Server API unreachable or returned error on Vercel. Activating browser computation engine:', serverErr);

      // 2. Resilient Browser Execution (Vercel-proof)
      try {
        const clientJson = await runClientBacktest(currentParams);
        if (clientJson.lumpSumResults && clientJson.lumpSumResults.length > 0) {
          setData(clientJson);
          setDataSource(clientJson.isRealTime ? 'Live Market (Browser)' : 'Historical Archive (Vercel Safe)');
        } else {
          setError('Unable to compute backtest for selected symbols. Please check symbols and try again.');
        }
      } catch (clientErr: any) {
        console.error('Client backtest error:', clientErr);
        setError(clientErr.message || 'Backtest computation failed');
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBacktestData(params);
  }, []); // run once on mount

  const handleRunBacktest = () => {
    fetchBacktestData(params);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors font-sans flex flex-col">
      {/* 3-Zone Header Contract */}
      <Header
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onExport={() => setIsExportOpen(true)}
        onRefresh={handleRunBacktest}
        isLoading={isLoading}
        isRealTime={data?.isRealTime ?? true}
        dataSource={dataSource}
        lastUpdated={data?.timestamp}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Introduction & Context */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
              30-Year Stock Back-Test Simulator
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Compare <strong className="text-slate-900 dark:text-slate-100">One-Time Lump Sum</strong> versus <strong className="text-slate-900 dark:text-slate-100">Yearly Top-Up (Every January)</strong> with actual historical prices, split adjustments, CAGR curves, and peak drawdowns.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>Horizon:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{params.years} Years</span>
            <span>·</span>
            <span>{params.symbols.length} Counters</span>
          </div>
        </div>

        {/* 4 Core Parameter Controls */}
        <ParameterControls
          params={params}
          onChange={(newParams) => setParams(newParams)}
          onRun={handleRunBacktest}
          isLoading={isLoading}
        />

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRunBacktest}
              className="px-3 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-500 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !data && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-slate-200 dark:bg-slate-900" />
              ))}
            </div>
            <div className="h-80 rounded-xl bg-slate-200 dark:bg-slate-900" />
          </div>
        )}

        {/* Populated State */}
        {data && (
          <>
            {/* Executive Comparison Summary Cards */}
            <SummaryCards
              lumpSumResults={data.lumpSumResults}
              yearlyTopUpResults={data.yearlyTopUpResults}
              years={params.years}
            />

            {/* Visualizer: Compounded Annual Growth Rate (CAGR) Over Time */}
            <CagrChart
              lumpSumResults={data.lumpSumResults}
              yearlyTopUpResults={data.yearlyTopUpResults}
              years={params.years}
            />

            {/* Strategy View Filter Segmented Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setStrategyView('both')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    strategyView === 'both'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Both Strategies
                </button>
                <button
                  type="button"
                  onClick={() => setStrategyView('lump-sum')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    strategyView === 'lump-sum'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  1. One-Time Lump Sum
                </button>
                <button
                  type="button"
                  onClick={() => setStrategyView('yearly-top-up')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    strategyView === 'yearly-top-up'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  2. Yearly Top-Up (Every Jan)
                </button>
              </div>

              <div className="text-xs text-slate-500 hidden sm:block">
                Showing all 8 requested metrics sorted by profit descending
              </div>
            </div>

            {/* Breakdown 1: One-Time Lump Sum Investment */}
            {(strategyView === 'both' || strategyView === 'lump-sum') && (
              <StrategyTable
                id="lump-sum"
                title="1. One-Time Lump Sum Investment Breakdown"
                subtitle={`Initial allocation of $${params.lumpSumAmount.toLocaleString()} per counter invested at the beginning of the period.`}
                badgeText="Strategy 1"
                results={data.lumpSumResults}
                onSelectStock={(stk) => setSelectedStockForModal(stk)}
                growthPerYearLabel="Growth per year (CAGR %)"
              />
            )}

            {/* Breakdown 2: Yearly Top-Up (Every January) */}
            {(strategyView === 'both' || strategyView === 'yearly-top-up') && (
              <StrategyTable
                id="yearly-top-up"
                title="2. Yearly Top-Up Investment Breakdown (Fixed Amount Every January)"
                subtitle={`Fixed contribution of $${params.yearlyTopUpAmount.toLocaleString()} invested on the first trading day of each January for ${params.years} years.`}
                badgeText="Strategy 2"
                results={data.yearlyTopUpResults}
                onSelectStock={(stk) => setSelectedStockForModal(stk)}
                growthPerYearLabel="Growth per year (IRR %)"
              />
            )}
          </>
        )}
      </main>

      {/* Annual Timeline & Cash Flow Detail Modal */}
      <YearlyBreakdownModal
        stock={selectedStockForModal}
        onClose={() => setSelectedStockForModal(null)}
        yearlyTopUpAmount={params.yearlyTopUpAmount}
        lumpSumAmount={params.lumpSumAmount}
      />

      {/* CSV Export Modal */}
      {data && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          params={params}
          lumpSumResults={data.lumpSumResults}
          yearlyTopUpResults={data.yearlyTopUpResults}
        />
      )}

      {/* Clean Human Editorial Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-6 text-xs text-slate-500 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">AlphaBacktest</span>
            <span>·</span>
            <span>30-Year Compounding Simulator</span>
          </div>
          <div className="text-center sm:text-right text-[11px] text-slate-400">
            Split-adjusted historical market data. For educational and back-testing simulation purposes.
          </div>
        </div>
      </footer>
    </div>
  );
}
