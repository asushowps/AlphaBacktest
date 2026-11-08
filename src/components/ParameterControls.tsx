import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, Calendar, TrendingUp, Plus, X, Sparkles, Check, AlertCircle } from 'lucide-react';
import { BacktestParams } from '../types/stock.js';

interface ParameterControlsProps {
  params: BacktestParams;
  onChange: (newParams: BacktestParams) => void;
  onRun: () => void;
  isLoading: boolean;
}

const PRESET_BASKETS: { name: string; description: string; symbols: string[] }[] = [
  {
    name: 'Tech Titans',
    description: 'Mega-cap tech leaders',
    symbols: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META'],
  },
  {
    name: 'Index & Growth Core',
    description: 'S&P 500, Nasdaq, and top leaders',
    symbols: ['SPY', 'QQQ', 'AAPL', 'MSFT', 'BRK-B'],
  },
  {
    name: 'Magnificent 7',
    description: 'High-growth market drivers',
    symbols: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA'],
  },
  {
    name: 'Dividend & Defensive',
    description: 'Cash generators & stability',
    symbols: ['SPY', 'JNJ', 'PG', 'KO', 'WMT', 'JPM'],
  },
];

const SUGGESTED_TICKERS = [
  { symbol: 'SPY', name: 'S&P 500 ETF' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF' },
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
  { symbol: 'V', name: 'Visa' },
  { symbol: 'WMT', name: 'Walmart' },
  { symbol: 'COST', name: 'Costco' },
  { symbol: 'AMD', name: 'AMD' },
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'DIS', name: 'Disney' },
  { symbol: 'KO', name: 'Coca-Cola' },
  { symbol: 'PEP', name: 'PepsiCo' },
];

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  params,
  onChange,
  onRun,
  isLoading,
}) => {
  const [tickerInput, setTickerInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTicker = (symbolToAdd: string) => {
    const clean = symbolToAdd.trim().toUpperCase();
    if (!clean) return;

    if (params.symbols.includes(clean)) {
      setErrorMessage(`${clean} is already added`);
      setTimeout(() => setErrorMessage(null), 2500);
      return;
    }

    if (params.symbols.length >= 7) {
      setErrorMessage('Maximum 7 stock symbols allowed');
      setTimeout(() => setErrorMessage(null), 2500);
      return;
    }

    const updated = [...params.symbols, clean];
    onChange({ ...params, symbols: updated });
    setTickerInput('');
    setShowSuggestions(false);
  };

  const handleRemoveTicker = (symbolToRemove: string) => {
    if (params.symbols.length <= 1) {
      setErrorMessage('At least 1 stock symbol required');
      setTimeout(() => setErrorMessage(null), 2500);
      return;
    }
    const updated = params.symbols.filter((s) => s !== symbolToRemove);
    onChange({ ...params, symbols: updated });
  };

  const handleSelectBasket = (symbols: string[]) => {
    onChange({ ...params, symbols: symbols.slice(0, 7) });
  };

  const filteredSuggestions = SUGGESTED_TICKERS.filter(
    (t) =>
      !params.symbols.includes(t.symbol) &&
      (t.symbol.toLowerCase().includes(tickerInput.toLowerCase()) ||
        t.name.toLowerCase().includes(tickerInput.toLowerCase()))
  );

  return (
    <section id="parameters" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
      <div className="flex flex-col gap-1 mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans">
            Back-test Configuration
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            4 Core Parameters
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Set your capital allocation, yearly contribution schedule, duration, and up to 7 counters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Parameter 1: One-Time Lump Sum */}
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              1. One-Time Lump Sum
            </label>
            <span className="text-[11px] text-slate-500 font-mono">per counter</span>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 font-mono text-sm">$</span>
            <input
              type="number"
              min={100}
              step={500}
              value={params.lumpSumAmount}
              onChange={(e) =>
                onChange({ ...params, lumpSumAmount: Math.max(0, parseFloat(e.target.value) || 0) })
              }
              className="w-full pl-8 pr-3 py-2 text-sm font-mono font-medium rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[1000, 5000, 10000, 25000, 50000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => onChange({ ...params, lumpSumAmount: amt })}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
                  params.lumpSumAmount === amt
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                ${amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>
        </div>

        {/* Parameter 2: Yearly Top-Up */}
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              2. Yearly Top-Up
            </label>
            <span className="text-[11px] text-slate-500 font-mono">1st trading day Jan</span>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 font-mono text-sm">$</span>
            <input
              type="number"
              min={0}
              step={200}
              value={params.yearlyTopUpAmount}
              onChange={(e) =>
                onChange({ ...params, yearlyTopUpAmount: Math.max(0, parseFloat(e.target.value) || 0) })
              }
              className="w-full pl-8 pr-3 py-2 text-sm font-mono font-medium rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[1200, 2400, 5000, 10000, 20000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => onChange({ ...params, yearlyTopUpAmount: amt })}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
                  params.yearlyTopUpAmount === amt
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                ${amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>
        </div>

        {/* Parameter 3: Number of Years */}
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              3. Investment Horizon
            </label>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {params.years} Years
            </span>
          </div>

          <div className="flex items-center gap-3 py-1">
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={params.years}
              onChange={(e) => onChange({ ...params, years: parseInt(e.target.value, 10) || 1 })}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <input
              type="number"
              min={1}
              max={30}
              value={params.years}
              onChange={(e) =>
                onChange({
                  ...params,
                  years: Math.min(30, Math.max(1, parseInt(e.target.value, 10) || 1)),
                })
              }
              className="w-14 px-2 py-1 text-center text-xs font-mono font-semibold rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[5, 10, 15, 20, 25, 30].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => onChange({ ...params, years: yr })}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
                  params.years === yr
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {yr}Y
              </button>
            ))}
          </div>
        </div>

        {/* Parameter 4: Stock Symbols Input */}
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 relative" ref={suggestionRef}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              4. Stock Symbols
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              {params.symbols.length}/7 Selected
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddTicker(tickerInput);
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              placeholder="Add symbol (e.g. SPY, NVDA)..."
              value={tickerInput}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setTickerInput(e.target.value);
                setShowSuggestions(true);
              }}
              disabled={params.symbols.length >= 7}
              className="w-full pl-3 pr-8 py-2 text-xs font-mono uppercase font-semibold rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={params.symbols.length >= 7 || !tickerInput.trim()}
              className="absolute right-1.5 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
              {filteredSuggestions.slice(0, 6).map((item) => (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => handleAddTicker(item.symbol)}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {item.symbol}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-1.5 text-[11px] text-rose-500 font-medium">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick preset baskets */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>Presets:</span>
            <div className="flex flex-wrap gap-1">
              {PRESET_BASKETS.map((b) => (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => handleSelectBasket(b.symbols)}
                  title={b.description}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Selected Ticker Chips */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Active Counters:
          </span>
          {params.symbols.map((sym, index) => {
            const colors = [
              'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
              'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10',
              'border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/10',
              'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
              'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10',
              'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
              'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10',
            ];
            const badgeColor = colors[index % colors.length];

            return (
              <div
                key={sym}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-semibold transition-all ${badgeColor}`}
              >
                <span>{sym}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTicker(sym)}
                  title={`Remove ${sym}`}
                  className="rounded hover:bg-black/10 dark:hover:bg-white/10 p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onRun}
          disabled={isLoading || params.symbols.length === 0}
          className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? (
            <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <TrendingUp className="h-4 w-4" />
          )}
          <span>{isLoading ? 'Computing 30Y Simulation...' : 'Calculate Back-test'}</span>
        </button>
      </div>
    </section>
  );
};
