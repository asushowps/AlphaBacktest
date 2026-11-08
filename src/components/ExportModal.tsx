import React, { useState } from 'react';
import { X, Download, Copy, Check, FileSpreadsheet } from 'lucide-react';
import { StrategyResult, BacktestParams } from '../types/stock.js';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: BacktestParams;
  lumpSumResults: StrategyResult[];
  yearlyTopUpResults: StrategyResult[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  params,
  lumpSumResults,
  yearlyTopUpResults,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build CSV string
  const generateCSV = () => {
    const lines: string[] = [];

    lines.push(`AlphaBacktest - 30-Year Stock Back-Test Simulator`);
    lines.push(`Parameters: Lump Sum=$${params.lumpSumAmount}, Yearly Top-Up=$${params.yearlyTopUpAmount}, Horizon=${params.years} Years, Generated=${new Date().toISOString()}`);
    lines.push(``);

    // Section 1: Lump Sum
    lines.push(`=== STRATEGY 1: ONE-TIME LUMP SUM INVESTMENT (Sorted by Profit) ===`);
    lines.push(`Rank,Symbol,Name,Start Price,End Price,Total Invested,Grows To,Profit,Total Return (%),Growth/Year (CAGR %),Max Drawdown (%),Avg Yearly Drawdown (%)`);
    lumpSumResults.forEach((r, idx) => {
      lines.push(
        `${idx + 1},${r.symbol},"${r.name}",${r.startPrice.toFixed(2)},${r.endPrice.toFixed(2)},${r.totalInvested.toFixed(2)},${r.growsTo.toFixed(2)},${r.profit.toFixed(2)},${r.totalReturnPercent.toFixed(2)},${r.growthPerYearPercent.toFixed(2)},${r.maximumDrawdownPercent.toFixed(2)},${r.averageYearlyDrawdownPercent.toFixed(2)}`
      );
    });

    lines.push(``);

    // Section 2: Yearly Top-Up
    lines.push(`=== STRATEGY 2: YEARLY TOP-UP (EVERY JANUARY) (Sorted by Profit) ===`);
    lines.push(`Rank,Symbol,Name,Start Price,End Price,Total Invested,Grows To,Profit,Total Return (%),Growth/Year (IRR %),Max Drawdown (%),Avg Yearly Drawdown (%)`);
    yearlyTopUpResults.forEach((r, idx) => {
      lines.push(
        `${idx + 1},${r.symbol},"${r.name}",${r.startPrice.toFixed(2)},${r.endPrice.toFixed(2)},${r.totalInvested.toFixed(2)},${r.growsTo.toFixed(2)},${r.profit.toFixed(2)},${r.totalReturnPercent.toFixed(2)},${r.growthPerYearPercent.toFixed(2)},${r.maximumDrawdownPercent.toFixed(2)},${r.averageYearlyDrawdownPercent.toFixed(2)}`
      );
    });

    lines.push(``);

    // Section 3: Annual breakdown sample
    lines.push(`=== ANNUAL HISTORICAL DATA LEDGER (January 1st Trading Day & End-of-Year) ===`);
    lines.push(`Symbol,Year Index,Calendar Year,Jan Date,Jan Price,Year Top-Up,Cumulative Invested,End Year Price,Top-Up Portfolio Value,Lump Sum Value,Annual Return (%),Annual Max Drawdown (%)`);
    yearlyTopUpResults.forEach((stock) => {
      stock.annualBreakdown.forEach((pt) => {
        lines.push(
          `${stock.symbol},Y${pt.year},${pt.calendarYear},${pt.januaryDate},${pt.januaryPrice.toFixed(2)},${params.yearlyTopUpAmount},${pt.yearlyTopUpInvestedCumulative.toFixed(2)},${pt.yearEndPrice.toFixed(2)},${pt.yearlyPortfolioValue.toFixed(2)},${pt.lumpSumValue.toFixed(2)},${pt.annualReturnPercent.toFixed(2)},${pt.annualMaxDrawdown.toFixed(2)}`
        );
      });
    });

    return lines.join('\n');
  };

  const handleDownload = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AlphaBacktest_${params.years}Y_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const csvContent = generateCSV();
    await navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
                Export Back-Test Dataset
              </h3>
              <p className="text-xs text-slate-500">
                Includes Lump Sum &amp; Yearly Top-Up tables, sorted by profit with full metrics.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="my-5 p-4 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Counters Included:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{params.symbols.join(', ')}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Investment Horizon:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{params.years} Years</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Strategies:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">Lump Sum ($ {params.lumpSumAmount}) &amp; Top-Up ($ {params.yearlyTopUpAmount}/yr)</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy CSV Text'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download .CSV File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
