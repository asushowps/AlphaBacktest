import { runBacktest } from '../src/server/stockService.js';
import { BacktestParams } from '../src/types/stock.js';

export default async function handler(req: any, res: any) {
  // Set CORS headers so it can be queried freely
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const query = req.query || {};
    const symbolsRaw = (query.symbols as string) || 'SPY,QQQ,AAPL,MSFT,NVDA';
    const symbols = symbolsRaw
      .split(',')
      .map((s: string) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 7);

    const lumpSumAmount = Math.max(0, parseFloat((query.lumpSum as string) || '10000'));
    const yearlyTopUpAmount = Math.max(0, parseFloat((query.yearlyTopUp as string) || '2400'));
    const years = Math.min(30, Math.max(1, parseInt((query.years as string) || '30', 10)));

    const params: BacktestParams = {
      lumpSumAmount,
      yearlyTopUpAmount,
      years,
      symbols,
    };

    const result = await runBacktest(params);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('[Vercel Serverless Error]:', err);
    return res.status(500).json({
      error: err.message || 'Internal serverless error during backtest calculation',
    });
  }
}
