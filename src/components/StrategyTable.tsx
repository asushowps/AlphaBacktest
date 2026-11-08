import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, Info, Calendar } from 'lucide-react';
import { StrategyResult } from '../types/stock.js';

interface StrategyTableProps {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  results: StrategyResult[];
  onSelectStock: (stock: StrategyResult) => void;
  growthPerYearLabel?: string; // e.g. "Growth per year (CAGR)" or "Growth per year (IRR)"
}

type SortField =
  | 'profit'
  | 'totalReturnPercent'
  | 'growthPerYearPercent'
  | 'growsTo'
  | 'startPrice'
  | 'endPrice'
  | 'maximumDrawdownPercent'
  | 'averageYearlyDrawdownPercent'
  | 'symbol';

export const StrategyTable: React.FC<StrategyTableProps> = ({
  id,
  title,
  subtitle,
  badgeText,
  results,
  onSelectStock,
  growthPerYearLabel = 'Growth per year',
}) => {
  // Default sorted by profit descending as requested by user prompt
  const [sortField, setSortField] = useState<SortField>('profit');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // For drawdowns, ascending is usually more negative, but let's default to desc
      setSortDirection('desc');
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') {
      return sortDirection === 'asc'
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }

    return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const formatCurrency = (val: number, maxDecimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: val < 10 ? 2 : 0,
      maximumFractionDigits: maxDecimals,
    }).format(val);
  };

  const formatPercent = (val: number) => {
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%`;
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-emerald-500 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 text-emerald-500 ml-1" />
    );
  };

  return (
    <section id={id} className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors overflow-hidden">
      {/* Table Header Section */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans">
                {title}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {badgeText}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Sorted by <span className="font-semibold text-slate-800 dark:text-slate-200">{sortField} ({sortDirection})</span>
          </div>
        </div>
      </div>

      {/* Desktop & Tablet High-Density Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider select-none">
              <th className="py-3 pl-5 pr-3 w-12 text-center">#</th>
              <th
                onClick={() => handleSort('symbol')}
                className="py-3 px-3 cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center">
                  <span>Stock Counter</span>
                  {renderSortIcon('symbol')}
                </div>
              </th>
              <th
                onClick={() => handleSort('startPrice')}
                className="py-3 px-3 text-right cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end">
                  <span>Start Price</span>
                  {renderSortIcon('startPrice')}
                </div>
              </th>
              <th
                onClick={() => handleSort('endPrice')}
                className="py-3 px-3 text-right cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end">
                  <span>End Price</span>
                  {renderSortIcon('endPrice')}
                </div>
              </th>
              <th
                onClick={() => handleSort('growsTo')}
                className="py-3 px-3 text-right cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end">
                  <span>Grows To</span>
                  {renderSortIcon('growsTo')}
                </div>
              </th>
              <th
                onClick={() => handleSort('profit')}
                className="py-3 px-3 text-right cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end text-emerald-600 dark:text-emerald-400">
                  <span>Profit</span>
                  {renderSortIcon('profit')}
                </div>
              </th>
              <th
                onClick={() => handleSort('totalReturnPercent')}
                className="py-3 px-3 text-right cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end">
                  <span>Total Return</span>
                  {renderSortIcon('totalReturnPercent')}
                </div>
              </th>
              <th
                onClick={() => handleSort('growthPerYearPercent')}
                className="py-3 px-3 text-right cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end">
                  <span>{growthPerYearLabel}</span>
                  {renderSortIcon('growthPerYearPercent')}
                </div>
              </th>
              <th
                onClick={() => handleSort('maximumDrawdownPercent')}
                className="py-3 px-3 text-right cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end text-rose-500">
                  <span>Max Drawdown</span>
                  {renderSortIcon('maximumDrawdownPercent')}
                </div>
              </th>
              <th
                onClick={() => handleSort('averageYearlyDrawdownPercent')}
                className="py-3 px-3 text-right cursor-pointer group hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end text-rose-400">
                  <span>Avg Yearly Drawdown</span>
                  {renderSortIcon('averageYearlyDrawdownPercent')}
                </div>
              </th>
              <th className="py-3 pr-5 pl-3 text-center">Breakdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-mono tabular-nums">
            {sortedResults.map((item, index) => {
              const isTopProfit = index === 0 && sortField === 'profit' && sortDirection === 'desc';

              return (
                <tr
                  key={item.symbol}
                  onClick={() => onSelectStock(item)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    isTopProfit ? 'bg-emerald-500/5 dark:bg-emerald-500/5' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 pl-5 pr-3 text-center font-sans font-medium text-slate-400 text-[11px]">
                    {index + 1}
                  </td>

                  {/* Stock Symbol & Name */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                          {item.symbol}
                        </span>
                        {item.effectiveYears < 30 && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-sans">
                            {item.effectiveYears}Y data
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-sans text-slate-500 truncate max-w-[130px]">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  {/* Start Price */}
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">
                    {formatCurrency(item.startPrice)}
                  </td>

                  {/* End Price */}
                  <td className="py-3 px-3 text-right font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(item.endPrice)}
                  </td>

                  {/* Grows To */}
                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.growsTo)}
                  </td>

                  {/* Profit */}
                  <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(item.profit)}
                  </td>

                  {/* Total Return */}
                  <td className="py-3 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatPercent(item.totalReturnPercent)}
                  </td>

                  {/* Growth per year */}
                  <td className="py-3 px-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                    {item.growthPerYearPercent.toFixed(2)}%
                  </td>

                  {/* Maximum Drawdown */}
                  <td className="py-3 px-3 text-right font-medium text-rose-500">
                    {item.maximumDrawdownPercent.toFixed(1)}%
                  </td>

                  {/* Average Yearly Drawdown */}
                  <td className="py-3 px-3 text-right font-medium text-rose-400 dark:text-rose-400">
                    {item.averageYearlyDrawdownPercent.toFixed(1)}%
                  </td>

                  {/* Action */}
                  <td className="py-3 pr-5 pl-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStock(item);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Calendar className="h-3 w-3" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Responsive Footnote */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <span>Click any column header to toggle sorting. Click any row or &ldquo;Details&rdquo; to view annual top-up schedule.</span>
        <span>Start prices are split- and dividend-adjusted.</span>
      </div>
    </section>
  );
};
