import React from 'react';
import { ShieldAlert, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const Disclaimer: React.FC = () => {
  return (
    <section
      id="disclaimer"
      aria-label="Investment Disclaimer and Regulatory Disclosures"
      className="mt-8 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-900/50 p-5 sm:p-6 text-slate-600 dark:text-slate-400 text-xs transition-colors"
    >
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
        <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-sans">
          Important Investment &amp; Regulatory Disclaimer
        </h3>
      </div>

      <div className="mt-4 space-y-3 leading-relaxed">
        <p className="font-medium text-slate-700 dark:text-slate-300">
          <strong>Educational Demonstration Only · Not Investment Advice:</strong> This back-test simulation model is built strictly for educational, illustrative, and academic evaluation purposes. Nothing contained herein constitutes financial, investment, legal, accounting, or tax advice, nor an endorsement, recommendation, or solicitation to buy, sell, or hold any security, portfolio, or financial instrument.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {/* Point 1: Past Performance & Future Results */}
          <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/70 space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-200 block">
              1. Past Performance
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Past performance does not guarantee, predict, or reflect future returns. Market cycles, geopolitical conditions, macroeconomic factors, interest rates, and individual company fundamentals fluctuate dynamically over time.
            </p>
          </div>

          {/* Point 2: Prices, Dividends & Frictional Fees */}
          <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/70 space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-200 block">
              2. Frictional Fees &amp; Expenses
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Results use historical closing prices exactly as supplied, with no deductions for brokerage commissions, transaction fees, platform charges, bid-ask spread slippage, management expense ratios (MER), or margin financing costs.
            </p>
          </div>

          {/* Point 3: Taxation & Net Returns */}
          <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/70 space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-200 block">
              3. Taxes &amp; Dividends
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Calculations do not account for local capital gains tax, dividend withholding tax, or personal income taxation. Realized investor returns in taxable accounts would be reduced by applicable sovereign and local taxes.
            </p>
          </div>

          {/* Point 4: No Currency Conversion */}
          <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/70 space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-200 block">
              4. Currency Measurement
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              No foreign currency conversion is applied. Each stock counter is calculated and reported strictly in its own native pricing currency (e.g. USD). Exchange rate fluctuations and currency risks are not modeled.
            </p>
          </div>

          {/* Point 5: Execution Assumptions */}
          <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/70 space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-200 block">
              5. Theoretical Execution
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Assumes frictionless execution on the first official trading day of each January with fractional share capability, zero cash drag, and instantaneous order fulfillment without market impact.
            </p>
          </div>

          {/* Point 6: Independent Advisory & Due Diligence */}
          <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/70 space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-200 block">
              6. Capital Risk &amp; Due Diligence
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Equities investments involve risk of substantial loss, including the complete loss of invested principal. Always consult an independent licensed financial planner before making actual capital allocation decisions.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          By utilizing this tool, you acknowledge that all figures are hypothetical estimates and that you assume full responsibility for any financial decisions or assessments you undertake.
        </p>
      </div>
    </section>
  );
};
