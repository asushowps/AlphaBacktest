import React, { useState, useMemo, useRef } from 'react';
import { StrategyResult } from '../types/stock.js';
import { TrendingUp, BarChart2, Eye, EyeOff, Maximize2 } from 'lucide-react';

interface CagrChartProps {
  lumpSumResults: StrategyResult[];
  yearlyTopUpResults: StrategyResult[];
  years: number;
}

type ChartMetric = 'cagr' | 'portfolioValueLumpSum' | 'portfolioValueTopUp' | 'annualReturn' | 'drawdown';

const ASSET_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

export const CagrChart: React.FC<CagrChartProps> = ({
  lumpSumResults,
  yearlyTopUpResults,
  years,
}) => {
  const [metric, setMetric] = useState<ChartMetric>('cagr');
  const [hiddenSymbols, setHiddenSymbols] = useState<Set<string>>(new Set());
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Toggle single asset visibility
  const toggleSymbol = (sym: string) => {
    setHiddenSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(sym)) {
        next.delete(sym);
      } else {
        if (next.size < lumpSumResults.length - 1) {
          next.add(sym);
        }
      }
      return next;
    });
  };

  // Find max length of annual breakdown
  const maxYearsCount = useMemo(() => {
    let max = 0;
    for (const r of lumpSumResults) {
      if (r.annualBreakdown.length > max) max = r.annualBreakdown.length;
    }
    return max || years;
  }, [lumpSumResults, years]);

  // Extract years array (1 to maxYearsCount)
  const timelineYears = useMemo(() => {
    return Array.from({ length: maxYearsCount }, (_, i) => i + 1);
  }, [maxYearsCount]);

  // Map each asset to its series points based on selected metric
  const seriesData = useMemo(() => {
    return lumpSumResults.map((stock, idx) => {
      const color = ASSET_COLORS[idx % ASSET_COLORS.length];
      const isVisible = !hiddenSymbols.has(stock.symbol);

      const points = stock.annualBreakdown.map((pt, i) => {
        let val = 0;
        if (metric === 'cagr') {
          val = pt.lumpSumCagr;
        } else if (metric === 'portfolioValueLumpSum') {
          val = pt.lumpSumValue;
        } else if (metric === 'portfolioValueTopUp') {
          val = pt.yearlyPortfolioValue;
        } else if (metric === 'annualReturn') {
          val = pt.annualReturnPercent;
        } else if (metric === 'drawdown') {
          val = pt.annualMaxDrawdown;
        }

        return {
          year: pt.year,
          calendarYear: pt.calendarYear,
          value: isNaN(val) ? 0 : val,
        };
      });

      return {
        symbol: stock.symbol,
        name: stock.name,
        color,
        isVisible,
        points,
      };
    });
  }, [lumpSumResults, metric, hiddenSymbols]);

  // Calculate domain min & max
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    for (const s of seriesData) {
      if (!s.isVisible) continue;
      for (const p of s.points) {
        if (p.value < min) min = p.value;
        if (p.value > max) max = p.value;
      }
    }

    if (!isFinite(min)) min = 0;
    if (!isFinite(max)) max = 100;

    // Buffer padding
    if (metric === 'cagr') {
      min = Math.min(min, -10);
      max = Math.max(max, 30);
    } else if (metric === 'drawdown') {
      min = Math.min(min, -60);
      max = 0;
    } else {
      min = Math.min(min, 0);
      max = max * 1.08;
    }

    return { minVal: min, maxVal: max };
  }, [seriesData, metric]);

  // Chart Dimensions
  const width = 860;
  const height = 400;
  const padding = { top: 25, right: 35, bottom: 45, left: 65 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const scaleX = (yrIdx: number) => {
    if (maxYearsCount <= 1) return padding.left + innerWidth / 2;
    return padding.left + ((yrIdx - 1) / (maxYearsCount - 1)) * innerWidth;
  };

  const scaleY = (val: number) => {
    const range = maxVal - minVal || 1;
    return padding.top + innerHeight - ((val - minVal) / range) * innerHeight;
  };

  // Generate SVG path for a line
  const makeLinePath = (pts: { year: number; value: number }[]) => {
    if (!pts.length) return '';
    return pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.year).toFixed(1)} ${scaleY(p.value).toFixed(1)}`)
      .join(' ');
  };

  // Format value for Y-axis and Tooltip
  const formatVal = (v: number) => {
    if (metric === 'cagr') return `${v.toFixed(1)}%`;
    if (metric === 'drawdown') return `${v.toFixed(1)}%`;
    if (metric === 'annualReturn') return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}k`;
    return `$${v.toFixed(0)}`;
  };

  // Y-axis grid ticks
  const yTicks = useMemo(() => {
    const count = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push(minVal + (i / count) * (maxVal - minVal));
    }
    return ticks;
  }, [minVal, maxVal]);

  // Handle mouse move on chart
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width;

    if (svgX < padding.left || svgX > width - padding.right) {
      setHoverIndex(null);
      return;
    }

    const ratio = (svgX - padding.left) / innerWidth;
    const yearIndex = Math.min(maxYearsCount, Math.max(1, Math.round(ratio * (maxYearsCount - 1)) + 1));
    setHoverIndex(yearIndex);
  };

  // Hovered data for tooltip
  const hoverData = useMemo(() => {
    if (hoverIndex == null) return null;
    const items = seriesData
      .filter((s) => s.isVisible)
      .map((s) => {
        const pt = s.points.find((p) => p.year === hoverIndex);
        return {
          symbol: s.symbol,
          name: s.name,
          color: s.color,
          value: pt ? pt.value : null,
          calendarYear: pt ? pt.calendarYear : null,
        };
      })
      .filter((x) => x.value != null)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const firstValid = items[0];
    return {
      yearIndex: hoverIndex,
      calendarYear: firstValid?.calendarYear || `Year ${hoverIndex}`,
      items,
    };
  }, [hoverIndex, seriesData]);

  return (
    <section id="cagr-chart" className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-colors">
      {/* Chart Title & Mode Toggles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans">
              Compounded Annual Growth Rate (CAGR) &amp; Trajectory
            </h3>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Interactive
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Track how each asset&rsquo;s annualized compounded return evolved year-by-year over the {years}-year horizon.
          </p>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setMetric('cagr')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              metric === 'cagr'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            CAGR (%) Trajectory
          </button>
          <button
            type="button"
            onClick={() => setMetric('portfolioValueLumpSum')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              metric === 'portfolioValueLumpSum'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lump Sum Value ($)
          </button>
          <button
            type="button"
            onClick={() => setMetric('portfolioValueTopUp')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              metric === 'portfolioValueTopUp'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Top-Up Value ($)
          </button>
          <button
            type="button"
            onClick={() => setMetric('drawdown')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              metric === 'drawdown'
                ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Yearly Drawdowns (%)
          </button>
        </div>
      </div>

      {/* Interactive Legend Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Assets:</span>
        {seriesData.map((s) => (
          <button
            key={s.symbol}
            type="button"
            onClick={() => toggleSymbol(s.symbol)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all border ${
              s.isVisible
                ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'border-transparent text-slate-400 dark:text-slate-600 line-through opacity-60'
            }`}
          >
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: s.isVisible ? s.color : '#94a3b8' }}
            />
            <span>{s.symbol}</span>
            {s.isVisible ? (
              <Eye className="h-3 w-3 opacity-50 hover:opacity-100 ml-0.5" />
            ) : (
              <EyeOff className="h-3 w-3 opacity-50 ml-0.5" />
            )}
          </button>
        ))}
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal Grid Lines & Y-Axis Labels */}
          {yTicks.map((tick, i) => {
            const yPos = scaleY(tick);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={width - padding.right}
                  y2={yPos}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="1"
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                />
                <text
                  x={padding.left - 10}
                  y={yPos + 4}
                  textAnchor="end"
                  className="text-[11px] font-mono fill-slate-400 dark:fill-slate-500"
                >
                  {formatVal(tick)}
                </text>
              </g>
            );
          })}

          {/* Zero Line (if present in range) */}
          {minVal < 0 && maxVal > 0 && (
            <line
              x1={padding.left}
              y1={scaleY(0)}
              x2={width - padding.right}
              y2={scaleY(0)}
              stroke="currentColor"
              className="text-slate-400 dark:text-slate-600"
              strokeWidth="1.5"
            />
          )}

          {/* X-Axis Grid & Labels */}
          {timelineYears.map((yr, i) => {
            // Show every 2nd or 5th year label
            const step = maxYearsCount > 20 ? 5 : maxYearsCount > 10 ? 2 : 1;
            const isLabeled = yr === 1 || yr === maxYearsCount || yr % step === 0;
            const xPos = scaleX(yr);

            return (
              <g key={yr}>
                {isLabeled && (
                  <>
                    <line
                      x1={xPos}
                      y1={padding.top}
                      x2={xPos}
                      y2={height - padding.bottom}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-900"
                      strokeWidth="1"
                    />
                    <text
                      x={xPos}
                      y={height - padding.bottom + 18}
                      textAnchor="middle"
                      className="text-[11px] font-mono fill-slate-500 dark:fill-slate-400"
                    >
                      Y{yr}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Asset Trajectory Paths */}
          {seriesData.map((s) => {
            if (!s.isVisible || s.points.length === 0) return null;
            const pathD = makeLinePath(s.points);

            return (
              <g key={s.symbol} className="transition-opacity">
                {/* Line Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Point Dots on End */}
                {s.points.length > 0 && (
                  <circle
                    cx={scaleX(s.points[s.points.length - 1].year)}
                    cy={scaleY(s.points[s.points.length - 1].value)}
                    r="4"
                    fill={s.color}
                    className="stroke-white dark:stroke-slate-900 stroke-2"
                  />
                )}
              </g>
            );
          })}

          {/* Hover Crosshair Line */}
          {hoverIndex != null && (
            <g>
              <line
                x1={scaleX(hoverIndex)}
                y1={padding.top}
                x2={scaleX(hoverIndex)}
                y2={height - padding.bottom}
                stroke="currentColor"
                className="text-emerald-500/70"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* Highlight dots on intersecting curves */}
              {seriesData
                .filter((s) => s.isVisible)
                .map((s) => {
                  const pt = s.points.find((p) => p.year === hoverIndex);
                  if (!pt) return null;
                  return (
                    <circle
                      key={s.symbol}
                      cx={scaleX(hoverIndex)}
                      cy={scaleY(pt.value)}
                      r="5"
                      fill={s.color}
                      className="stroke-white dark:stroke-slate-900 stroke-2"
                    />
                  );
                })}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Box */}
        {hoverData && (
          <div
            className="absolute top-4 right-4 z-20 pointer-events-none rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95 text-xs font-mono min-w-[200px]"
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 font-sans">
              <span className="font-bold text-slate-900 dark:text-white">
                Year {hoverData.yearIndex}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {hoverData.calendarYear}
              </span>
            </div>

            <div className="space-y-1">
              {hoverData.items.map((item) => (
                <div key={item.symbol} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {item.symbol}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                    {formatVal(item.value!)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Info */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>X-Axis: Investment horizon elapsed (Years 1 to {maxYearsCount})</span>
        <span>Hover over chart to inspect precise annual values</span>
      </div>
    </section>
  );
};
