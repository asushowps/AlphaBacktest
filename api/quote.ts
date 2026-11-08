import { fetchStockHistoricalData } from '../src/server/stockService.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const symbol = ((req.query?.symbol as string) || '').trim().toUpperCase();
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter required' });
  }

  try {
    const { meta } = await fetchStockHistoricalData(symbol);
    return res.status(200).json({
      symbol,
      name: meta?.shortName || meta?.longName || symbol,
      price: meta?.regularMarketPrice || 0,
      change: meta?.regularMarketChange || 0,
      changePercent: meta?.regularMarketChangePercent || 0,
      currency: meta?.currency || 'USD',
      fiftyTwoWeekHigh: meta?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta?.fiftyTwoWeekLow,
      marketCap: meta?.marketCap,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch quote' });
  }
}
