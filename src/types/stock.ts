export interface RawDailyPrice {
  date: string;
  timestamp: number;
  price: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  exchange: string;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketCap?: number;
}

export interface AnnualDataPoint {
  year: number;
  calendarYear: number;
  januaryDate: string;
  januaryPrice: number;
  yearEndPrice: number;
  annualReturnPercent: number;
  annualMaxDrawdown: number;
  // Strategy 1 specific (Lump Sum)
  lumpSumValue: number;
  lumpSumCagr: number;
  // Strategy 2 specific (Yearly Top-Up)
  yearlyTopUpInvestedCumulative: number;
  yearlySharesBought: number;
  yearlyCumulativeShares: number;
  yearlyPortfolioValue: number;
  yearlyIrr: number;
}

export interface CagrPoint {
  year: number;
  calendarYear: number;
  date: string;
  cagr: number;
  portfolioValueLumpSum: number;
  portfolioValueYearlyTopUp: number;
  price: number;
}

export interface StrategyResult {
  symbol: string;
  name: string;
  startPrice: number;
  endPrice: number;
  totalInvested: number;
  growsTo: number;
  profit: number;
  totalReturnPercent: number;
  growthPerYearPercent: number; // CAGR (or IRR for DCA)
  maximumDrawdownPercent: number;
  averageYearlyDrawdownPercent: number;
  effectiveYears: number;
  startDate: string;
  endDate: string;
  annualBreakdown: AnnualDataPoint[];
  cagrOverTime: CagrPoint[];
}

export interface BacktestParams {
  lumpSumAmount: number;
  yearlyTopUpAmount: number;
  years: number;
  symbols: string[];
}

export interface BacktestResponse {
  params: BacktestParams;
  timestamp: string;
  isRealTime: boolean;
  lumpSumResults: StrategyResult[];
  yearlyTopUpResults: StrategyResult[];
  errors?: Record<string, string>;
}
