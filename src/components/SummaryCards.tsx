import React from 'react';
import { ArrowUpRight, TrendingUp, DollarSign, ShieldAlert, Award } from 'lucide-react';
import { StrategyResult } from '../types/stock.js';

interface SummaryCardsProps {
  lumpSumResults: StrategyResult[];
  yearlyTopUpResults: StrategyResult[];
  years: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  lumpSumResults,
  yearlyTopUpResults,
  years,
}) => {
  if (!lumpSumResults.length || !yearlyTopUpResults.length) return null;

  // Basket totals for Strategy 1 (Lump Sum)
  const lumpSumTotalInvested = lumpSumResults.reduce((acc, r) => acc + r.totalInvested, 0);
  const lumpSumTotalGrowsTo = lumpSumResults.reduce((acc, r) => acc + r.growsTo, 0);
  const lumpSumTotalProfit = lumpSumTotalGrowsTo - lumpSumTotalInvested;
  const lumpSumBasketReturn = lumpSumTotalInvested > 0 ? (lumpSumTotalProfit / lumpSumTotalInvested) * 100 : 0;
  const lumpSumAvgCagr =
    lumpSumResults.reduce((acc, r) => acc + r.growthPerYearPercent, 0) / lumpSumResults.length;

  // Basket totals for Strategy 2 (Yearly Top-Up)
  const topUpTotalInvested = yearlyTopUpResults.reduce((acc, r) => acc + r.totalInvested, 0);
  const topUpTotalGrowsTo = yearlyTopUpResults.reduce((acc, r) => acc + r.growsTo, 0);
  const topUpTotalProfit = topUpTotalGrowsTo - topUpTotalInvested;
  const topUpBasketReturn = topUpTotalInvested > 0 ? (topUpTotalProfit / topUpTotalInvested) * 100 : 0;
  const topUpAvgIrr =
    yearlyTopUpResults.reduce((acc, r) => acc + r.growthPerYearPercent, 0) / yearlyTopUpResults.length;

  // Best performer in basket
  const bestLumpSum = [...lumpSumResults].sort((a, b) => b.profit - a.profit)[0];
  const bestTopUp = [...yearlyTopUpResults].sort((a, b) => b.profit - a.profit)[0];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section id="summary" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Strategy 1 Lump Sum Basket Total */}
      <div className="flex flex-col justify-between p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Strategy 1: One-Time Lump Sum
          </span>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
            Invested: {formatCurrency(lumpSumTotalInvested)}
          </span>
        </div>

        <div className="my-3">
          <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatCurrency(lumpSumTotalGrowsTo)}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              +{lumpSumBasketReturn.toLocaleString('en-US', { maximumFractionDigits: 1 })}% Return
            </span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">
              +{formatCurrency(lumpSumTotalProfit)} Profit
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Basket Avg CAGR</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {lumpSumAvgCagr.toFixed(2)}% / yr
          </span>
        </div>
      </div>

      {/* Card 2: Strategy 2 Yearly Top-Up Basket Total */}
      <div className="flex flex-col justify-between p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Strategy 2: Yearly Top-Up
          </span>
          <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
            Invested: {formatCurrency(topUpTotalInvested)}
          </span>
        </div>

        <div className="my-3">
          <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatCurrency(topUpTotalGrowsTo)}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
              +{topUpBasketReturn.toLocaleString('en-US', { maximumFractionDigits: 1 })}% Return
            </span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">
              +{formatCurrency(topUpTotalProfit)} Profit
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Basket Avg IRR</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {topUpAvgIrr.toFixed(2)}% / yr
          </span>
        </div>
      </div>

      {/* Card 3: Top Performer */}
      <div className="flex flex-col justify-between p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Highest Alpha Asset
          </span>
          <Award className="h-4 w-4 text-amber-500" />
        </div>

        <div className="my-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
              {bestLumpSum.symbol}
            </span>
            <span className="text-xs text-slate-500 truncate max-w-[150px]">
              {bestLumpSum.name}
            </span>
          </div>
          <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            Grows to {formatCurrency(bestLumpSum.growsTo)} ({bestLumpSum.growthPerYearPercent.toFixed(1)}% CAGR)
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Max Drawdown</span>
          <span className="font-mono font-semibold text-rose-500">
            {bestLumpSum.maximumDrawdownPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Card 4: Strategy Difference & Horizon */}
      <div className="flex flex-col justify-between p-5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Strategy Outcome Ratio
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {years} Year Horizon
          </span>
        </div>

        <div className="my-3">
          <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900 dark:text-white">
            {lumpSumTotalGrowsTo >= topUpTotalGrowsTo
              ? `${(lumpSumTotalGrowsTo / Math.max(1, topUpTotalGrowsTo)).toFixed(2)}x`
              : `${(topUpTotalGrowsTo / Math.max(1, lumpSumTotalGrowsTo)).toFixed(2)}x`}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
            {lumpSumTotalGrowsTo >= topUpTotalGrowsTo
              ? 'Lump sum generated greater absolute wealth due to early compound duration.'
              : 'Yearly DCA top-up accumulated higher final wealth through ongoing capital injection.'}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Drawdown Tolerance</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            Avg intra-year: {(lumpSumResults.reduce((a, b) => a + b.averageYearlyDrawdownPercent, 0) / lumpSumResults.length).toFixed(1)}%
          </span>
        </div>
      </div>
    </section>
  );
};
