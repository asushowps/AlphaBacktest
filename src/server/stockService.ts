import { AnnualDataPoint, BacktestParams, BacktestResponse, CagrPoint, StrategyResult } from '../types/stock.js';
import { FALLBACK_STOCKS } from '../data/fallbackStockData.js';

interface RawDailyPrice {
  date: string;
  timestamp: number;
  price: number; // split-adjusted close
}

// In-memory cache for historical stock data
const cache = new Map<string, { timestamp: number; data: RawDailyPrice[]; meta: any }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Calculates Internal Rate of Return (IRR) for cash flows
 * cashFlows: array of { yearFraction: number, amount: number }
 * Outflows are negative, inflows (final portfolio value) are positive
 */
export function calculateXIRR(cashFlows: { years: number; amount: number }[]): number {
  if (cashFlows.length < 2) return 0;
  
  // Objective function: Net Present Value at discount rate r
  const npv = (r: number) => {
    return cashFlows.reduce((acc, cf) => {
      const discount = Math.pow(1 + r, cf.years);
      return acc + (discount !== 0 ? cf.amount / discount : 0);
    }, 0);
  };

  // Derivative of NPV with respect to r
  const dnpv = (r: number) => {
    return cashFlows.reduce((acc, cf) => {
      const discount = Math.pow(1 + r, cf.years + 1);
      return acc - (discount !== 0 ? (cf.years * cf.amount) / discount : 0);
    }, 0);
  };

  // Initial guess
  let rate = 0.10;
  const maxIterations = 50;
  const tolerance = 1e-6;

  // Newton-Raphson
  for (let i = 0; i < maxIterations; i++) {
    const value = npv(rate);
    if (Math.abs(value) < tolerance) {
      return rate;
    }
    const derivative = dnpv(rate);
    if (Math.abs(derivative) < 1e-9) break;
    const newRate = rate - value / derivative;
    if (newRate <= -0.99) {
      rate = -0.99;
      break;
    }
    rate = newRate;
  }

  // Fallback to bisection if Newton-Raphson diverged
  let low = -0.95;
  let high = 5.0;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const midVal = npv(mid);
    if (Math.abs(midVal) < tolerance) return mid;
    const lowVal = npv(low);
    if ((midVal > 0 && lowVal > 0) || (midVal < 0 && lowVal < 0)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return rate;
}

/**
 * Fetch historical daily data from Yahoo Finance
 */
export async function fetchStockHistoricalData(symbol: string): Promise<{ data: RawDailyPrice[]; meta: any }> {
  const cleanSymbol = symbol.trim().toUpperCase().replace('.', '-');
  const cached = cache.get(cleanSymbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { data: cached.data, meta: cached.meta };
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSymbol)}?range=35y&interval=1d&events=div%2Csplit`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance returned status ${res.status}`);
    }

    const json: any = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result || !result.timestamp || !result.timestamp.length) {
      throw new Error(`No chart data returned for ${cleanSymbol}`);
    }

    const timestamps: number[] = result.timestamp;
    const adjCloses: number[] = result.indicators?.adjclose?.[0]?.adjclose || result.indicators?.quote?.[0]?.close || [];
    const closes: number[] = result.indicators?.quote?.[0]?.close || [];
    const meta = result.meta || {};

    const dailyData: RawDailyPrice[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const price = adjCloses[i] != null && !isNaN(adjCloses[i]) ? adjCloses[i] : closes[i];
      if (price != null && !isNaN(price) && price > 0) {
        const d = new Date(timestamps[i] * 1000);
        dailyData.push({
          date: d.toISOString().split('T')[0],
          timestamp: timestamps[i],
          price: price,
        });
      }
    }

    if (dailyData.length < 5) {
      throw new Error(`Insufficient daily prices for ${cleanSymbol}`);
    }

    cache.set(cleanSymbol, { timestamp: Date.now(), data: dailyData, meta });
    return { data: dailyData, meta };
  } catch (err: any) {
    console.warn(`[StockService] Live fetch failed for ${cleanSymbol}: ${err.message}. Checking fallback...`);
    
    // Check fallback database
    const fallbackKey = cleanSymbol.replace('-', '_');
    const fallback = FALLBACK_STOCKS[cleanSymbol] || FALLBACK_STOCKS[fallbackKey];
    if (fallback) {
      const syntheticDaily: RawDailyPrice[] = [];
      const years = Object.keys(fallback.yearlyPrices).map(Number).sort((a, b) => a - b);
      
      for (const yr of years) {
        const yp = fallback.yearlyPrices[yr];
        // Jan 3 approx
        syntheticDaily.push({
          date: `${yr}-01-03`,
          timestamp: Math.floor(new Date(`${yr}-01-03T14:30:00Z`).getTime() / 1000),
          price: yp.janPrice,
        });
        // Dec 30 approx
        syntheticDaily.push({
          date: `${yr}-12-30`,
          timestamp: Math.floor(new Date(`${yr}-12-30T14:30:00Z`).getTime() / 1000),
          price: yp.yearEndPrice,
        });
      }

      return {
        data: syntheticDaily,
        meta: {
          symbol: fallback.symbol,
          shortName: fallback.name,
          regularMarketPrice: fallback.currentPrice,
          currency: 'USD',
          isFallback: true,
        },
      };
    }

    throw err;
  }
}

/**
 * Run backtest calculations for a single symbol
 */
export function calculateBacktestForStock(
  symbol: string,
  meta: any,
  dailyPrices: RawDailyPrice[],
  params: BacktestParams
): { lumpSum: StrategyResult; yearlyTopUp: StrategyResult } {
  const { lumpSumAmount, yearlyTopUpAmount, years } = params;
  
  if (!dailyPrices.length) {
    throw new Error(`No price data for ${symbol}`);
  }

  // Group daily prices by calendar year
  const pricesByYear = new Map<number, RawDailyPrice[]>();
  for (const p of dailyPrices) {
    const yr = parseInt(p.date.substring(0, 4), 10);
    if (!pricesByYear.has(yr)) {
      pricesByYear.set(yr, []);
    }
    pricesByYear.get(yr)!.push(p);
  }

  const allCalendarYears = Array.from(pricesByYear.keys()).sort((a, b) => a - b);
  // Pick last N years or all available if fewer
  const targetYears = allCalendarYears.slice(-Math.min(years, allCalendarYears.length));
  const effectiveYears = targetYears.length;

  if (effectiveYears === 0) {
    throw new Error(`Unable to determine trading years for ${symbol}`);
  }

  // Collect first trading day in January and year-end prices for each target year
  const annualData: {
    yearIndex: number;
    calendarYear: number;
    janDate: string;
    janPrice: number;
    yearEndDate: string;
    yearEndPrice: number;
    intraYearMinDrawdown: number;
  }[] = [];

  // Also collect all relevant daily prices across the target window for peak-to-trough max drawdown
  const windowDailyPrices: RawDailyPrice[] = [];

  for (let i = 0; i < targetYears.length; i++) {
    const yr = targetYears[i];
    const daysInYear = pricesByYear.get(yr)!;
    // Sort ascending by date
    daysInYear.sort((a, b) => a.timestamp - b.timestamp);

    const firstTradingDay = daysInYear[0];
    const lastTradingDay = daysInYear[daysInYear.length - 1];

    // Compute intra-year max drawdown
    let yrPeak = daysInYear[0].price;
    let yrMaxDrawdown = 0;
    for (const d of daysInYear) {
      if (d.price > yrPeak) {
        yrPeak = d.price;
      }
      const dd = (d.price - yrPeak) / yrPeak;
      if (dd < yrMaxDrawdown) {
        yrMaxDrawdown = dd;
      }
      windowDailyPrices.push(d);
    }

    annualData.push({
      yearIndex: i + 1,
      calendarYear: yr,
      janDate: firstTradingDay.date,
      janPrice: firstTradingDay.price,
      yearEndDate: lastTradingDay.date,
      yearEndPrice: lastTradingDay.price,
      intraYearMinDrawdown: yrMaxDrawdown * 100, // percentage e.g. -25.4%
    });
  }

  // Global peak-to-trough max drawdown across the full window
  let globalPeak = windowDailyPrices[0].price;
  let globalMaxDrawdown = 0;
  for (const d of windowDailyPrices) {
    if (d.price > globalPeak) {
      globalPeak = d.price;
    }
    const dd = (d.price - globalPeak) / globalPeak;
    if (dd < globalMaxDrawdown) {
      globalMaxDrawdown = dd;
    }
  }

  const startPrice = annualData[0].janPrice;
  const latestPrice = meta?.regularMarketPrice || windowDailyPrices[windowDailyPrices.length - 1].price;
  const startDate = annualData[0].janDate;
  const endDate = windowDailyPrices[windowDailyPrices.length - 1].date;

  // Average Yearly Drawdown: mean of annual max drawdowns
  const totalYearlyDrawdownSum = annualData.reduce((acc, curr) => acc + curr.intraYearMinDrawdown, 0);
  const averageYearlyDrawdown = effectiveYears > 0 ? totalYearlyDrawdownSum / effectiveYears : 0;

  // ==========================================
  // STRATEGY 1: ONE-TIME LUMP SUM INVESTMENT
  // ==========================================
  const lumpSumShares = lumpSumAmount / startPrice;
  const lumpSumGrowsTo = lumpSumShares * latestPrice;
  const lumpSumProfit = lumpSumGrowsTo - lumpSumAmount;
  const lumpSumTotalReturn = ((lumpSumGrowsTo - lumpSumAmount) / lumpSumAmount) * 100;
  // CAGR: (GrowsTo / Invested)^(1 / years) - 1
  const lumpSumCagr = effectiveYears > 0 ? (Math.pow(lumpSumGrowsTo / lumpSumAmount, 1 / effectiveYears) - 1) * 100 : 0;

  // Build CAGR progression over time and annual breakdown
  const annualBreakdown: AnnualDataPoint[] = [];
  const cagrOverTimeLumpSum: CagrPoint[] = [];
  const cagrOverTimeYearlyTopUp: CagrPoint[] = [];

  // ==========================================
  // STRATEGY 2: YEARLY TOP-UP (EVERY JANUARY)
  // ==========================================
  let yearlyCumulativeShares = 0;
  let yearlyTotalInvested = 0;
  const dcaCashFlows: { years: number; amount: number }[] = [];

  for (let i = 0; i < annualData.length; i++) {
    const item = annualData[i];
    const sharesBoughtThisYear = yearlyTopUpAmount / item.janPrice;
    yearlyCumulativeShares += sharesBoughtThisYear;
    yearlyTotalInvested += yearlyTopUpAmount;

    // Cash outflow for IRR: invested at start of year i
    dcaCashFlows.push({
      years: i,
      amount: -yearlyTopUpAmount,
    });

    // End-of-year portfolio valuations
    const lumpSumEoyValue = lumpSumShares * item.yearEndPrice;
    const lumpSumEoyCagr = (Math.pow(lumpSumEoyValue / lumpSumAmount, 1 / (i + 1)) - 1) * 100;

    const yearlyEoyValue = yearlyCumulativeShares * item.yearEndPrice;
    // Calculate running IRR up to year (i + 1)
    const runningCashFlows = [...dcaCashFlows, { years: i + 1, amount: yearlyEoyValue }];
    const runningIrr = calculateXIRR(runningCashFlows) * 100;

    const annualPt: AnnualDataPoint = {
      year: item.yearIndex,
      calendarYear: item.calendarYear,
      januaryDate: item.janDate,
      januaryPrice: item.janPrice,
      yearEndPrice: item.yearEndPrice,
      annualReturnPercent: ((item.yearEndPrice - item.janPrice) / item.janPrice) * 100,
      annualMaxDrawdown: item.intraYearMinDrawdown,
      lumpSumValue: lumpSumEoyValue,
      lumpSumCagr: isNaN(lumpSumEoyCagr) ? 0 : lumpSumEoyCagr,
      yearlyTopUpInvestedCumulative: yearlyTotalInvested,
      yearlySharesBought: sharesBoughtThisYear,
      yearlyCumulativeShares: yearlyCumulativeShares,
      yearlyPortfolioValue: yearlyEoyValue,
      yearlyIrr: isNaN(runningIrr) ? 0 : runningIrr,
    };
    annualBreakdown.push(annualPt);

    cagrOverTimeLumpSum.push({
      year: item.yearIndex,
      calendarYear: item.calendarYear,
      date: item.janDate,
      cagr: isNaN(lumpSumEoyCagr) ? 0 : lumpSumEoyCagr,
      portfolioValueLumpSum: lumpSumEoyValue,
      portfolioValueYearlyTopUp: yearlyEoyValue,
      price: item.yearEndPrice,
    });
  }

  // Final values for Yearly Top-Up
  const yearlyTopUpGrowsTo = yearlyCumulativeShares * latestPrice;
  const yearlyTopUpProfit = yearlyTopUpGrowsTo - yearlyTotalInvested;
  const yearlyTopUpTotalReturn = yearlyTotalInvested > 0 ? ((yearlyTopUpGrowsTo - yearlyTotalInvested) / yearlyTotalInvested) * 100 : 0;

  // Final IRR for Yearly Top-Up
  const finalCashFlows = [...dcaCashFlows, { years: effectiveYears, amount: yearlyTopUpGrowsTo }];
  const yearlyTopUpIrr = calculateXIRR(finalCashFlows) * 100;

  const stockName = meta?.shortName || meta?.longName || symbol;

  const lumpSumResult: StrategyResult = {
    symbol,
    name: stockName,
    startPrice,
    endPrice: latestPrice,
    totalInvested: lumpSumAmount,
    growsTo: lumpSumGrowsTo,
    profit: lumpSumProfit,
    totalReturnPercent: lumpSumTotalReturn,
    growthPerYearPercent: lumpSumCagr,
    maximumDrawdownPercent: globalMaxDrawdown * 100,
    averageYearlyDrawdownPercent: averageYearlyDrawdown,
    effectiveYears,
    startDate,
    endDate,
    annualBreakdown,
    cagrOverTime: cagrOverTimeLumpSum,
  };

  const yearlyTopUpResult: StrategyResult = {
    symbol,
    name: stockName,
    startPrice,
    endPrice: latestPrice,
    totalInvested: yearlyTotalInvested,
    growsTo: yearlyTopUpGrowsTo,
    profit: yearlyTopUpProfit,
    totalReturnPercent: yearlyTopUpTotalReturn,
    growthPerYearPercent: isNaN(yearlyTopUpIrr) ? 0 : yearlyTopUpIrr,
    maximumDrawdownPercent: globalMaxDrawdown * 100,
    averageYearlyDrawdownPercent: averageYearlyDrawdown,
    effectiveYears,
    startDate,
    endDate,
    annualBreakdown,
    cagrOverTime: cagrOverTimeLumpSum,
  };

  return { lumpSum: lumpSumResult, yearlyTopUp: yearlyTopUpResult };
}

/**
 * Run multi-asset backtest
 */
export async function runBacktest(params: BacktestParams): Promise<BacktestResponse> {
  const lumpSumResults: StrategyResult[] = [];
  const yearlyTopUpResults: StrategyResult[] = [];
  const errors: Record<string, string> = {};

  const cleanSymbols = (params.symbols || ['SPY', 'QQQ', 'AAPL', 'MSFT'])
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 7);

  await Promise.all(
    cleanSymbols.map(async (sym) => {
      try {
        const { data, meta } = await fetchStockHistoricalData(sym);
        const { lumpSum, yearlyTopUp } = calculateBacktestForStock(sym, meta, data, params);
        lumpSumResults.push(lumpSum);
        yearlyTopUpResults.push(yearlyTopUp);
      } catch (err: any) {
        console.error(`Error backtesting ${sym}:`, err.message);
        errors[sym] = err.message || 'Failed to fetch or compute backtest';
      }
    })
  );

  // Sort both by profit descending by default per user requirements: "sorted by profit"
  lumpSumResults.sort((a, b) => b.profit - a.profit);
  yearlyTopUpResults.sort((a, b) => b.profit - a.profit);

  return {
    params: {
      ...params,
      symbols: cleanSymbols,
    },
    timestamp: new Date().toISOString(),
    isRealTime: true,
    lumpSumResults,
    yearlyTopUpResults,
    errors: Object.keys(errors).length ? errors : undefined,
  };
}
