import React from 'react';
import { X, Calendar, TrendingUp, DollarSign, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { StrategyResult } from '../types/stock.js';

interface YearlyBreakdownModalProps {
  stock: StrategyResult | null;
  onClose: () => void;
  yearlyTopUpAmount: number;
  lumpSumAmount: number;
}

export const YearlyBreakdownModal: React.FC<YearlyBreakdownModalProps> = ({
  stock,
  onClose,
  yearlyTopUpAmount,
  lumpSumAmount,
}) => {
  if (!stock) return null;

  const formatCurrency = (val: number, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: val < 10 ? 2 : 0,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  const formatPercent = (val: number) => {
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}%`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {stock.symbol}
              </span>
              <span className="text-sm font-sans text-slate-500">
                {stock.name}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {stock.effectiveYears} Years Backtest
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Year-by-year cash flow schedule, January 1st trading day entry prices, intra-year drawdowns, and portfolio compounding.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Top Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">Start Price ({stock.startDate})</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {formatCurrency(stock.startPrice)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Current End Price ({stock.endDate})</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {formatCurrency(stock.endPrice)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Max Historical Drawdown</span>
            <span className="font-bold text-rose-500 text-sm">
              {stock.maximumDrawdownPercent.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Average Intra-Year Drawdown</span>
            <span className="font-bold text-rose-400 text-sm">
              {stock.averageYearlyDrawdownPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Scrollable Annual Ledger Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-xs text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 pl-5 pr-2">Year</th>
                <th className="py-2.5 px-3">Jan 1st Trading Day</th>
                <th className="py-2.5 px-3 text-right">Jan Price</th>
                <th className="py-2.5 px-3 text-right">Top-Up ($)</th>
                <th className="py-2.5 px-3 text-right">Shares Bought</th>
                <th className="py-2.5 px-3 text-right">Total Shares</th>
                <th className="py-2.5 px-3 text-right">Year-End Price</th>
                <th className="py-2.5 px-3 text-right">Top-Up Value</th>
                <th className="py-2.5 px-3 text-right">Lump Sum Value</th>
                <th className="py-2.5 px-3 text-right">Annual Return</th>
                <th className="py-2.5 pr-5 pl-3 text-right">Year Drawdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-mono tabular-nums">
              {stock.annualBreakdown.map((row) => (
                <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 pl-5 pr-2 font-sans font-bold text-slate-800 dark:text-slate-200">
                    Y{row.year} <span className="text-slate-400 font-normal">({row.calendarYear})</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    {row.januaryDate}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                    {formatCurrency(row.januaryPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-blue-600 dark:text-blue-400">
                    {formatCurrency(yearlyTopUpAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                    {row.yearlySharesBought.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                    {row.yearlyCumulativeShares.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(row.yearEndPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(row.yearlyPortfolioValue)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(row.lumpSumValue)}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-semibold ${row.annualReturnPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {formatPercent(row.annualReturnPercent)}
                  </td>
                  <td className="py-2.5 pr-5 pl-3 text-right text-rose-500 font-medium">
                    {row.annualMaxDrawdown.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between text-xs text-slate-500">
          <span>First trading day of January reflects actual NYSE/NASDAQ trading calendar.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
