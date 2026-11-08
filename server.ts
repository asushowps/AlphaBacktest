import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchStockHistoricalData, runBacktest } from './src/server/stockService.js';
import { BacktestParams } from './src/types/stock.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Popular stock directory for search
const POPULAR_TICKERS = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', category: 'Broad Market ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq-100)', category: 'Tech Index ETF' },
  { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', category: 'Large Cap ETF' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', category: 'Small Cap ETF' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', category: 'Total Market ETF' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', category: 'Broad Market ETF' },
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'Consumer Tech' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'Software & Cloud' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'Semiconductors & AI' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'E-Commerce & Cloud' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'Internet & Search' },
  { symbol: 'META', name: 'Meta Platforms Inc.', category: 'Social Media & VR' },
  { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Electric Vehicles' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc.', category: 'Financial Conglomerate' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', category: 'Banking' },
  { symbol: 'V', name: 'Visa Inc.', category: 'Payments & Fintech' },
  { symbol: 'WMT', name: 'Walmart Inc.', category: 'Retail' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', category: 'Healthcare' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', category: 'Consumer Staples' },
  { symbol: 'HD', name: 'The Home Depot Inc.', category: 'Retail' },
  { symbol: 'COST', name: 'Costco Wholesale Corp.', category: 'Consumer Staples' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', category: 'Semiconductors' },
  { symbol: 'INTC', name: 'Intel Corporation', category: 'Semiconductors' },
  { symbol: 'NFLX', name: 'Netflix Inc.', category: 'Streaming & Media' },
  { symbol: 'DIS', name: 'The Walt Disney Company', category: 'Entertainment' },
  { symbol: 'KO', name: 'The Coca-Cola Company', category: 'Consumer Staples' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', category: 'Consumer Staples' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', category: 'Pharmaceuticals' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', category: 'Semiconductors' },
  { symbol: 'CRM', name: 'Salesforce Inc.', category: 'Enterprise Cloud' },
];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Search tickers endpoint
app.get('/api/search', (req, res) => {
  const query = ((req.query.q as string) || '').trim().toUpperCase();
  if (!query) {
    return res.json(POPULAR_TICKERS.slice(0, 10));
  }
  const filtered = POPULAR_TICKERS.filter(
    (t) => t.symbol.toUpperCase().includes(query) || t.name.toUpperCase().includes(query)
  );
  return res.json(filtered.slice(0, 10));
});

// Real-time stock quote endpoint
app.get('/api/quote', async (req, res) => {
  const symbol = ((req.query.symbol as string) || '').trim().toUpperCase();
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter required' });
  }

  try {
    const { meta } = await fetchStockHistoricalData(symbol);
    return res.json({
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
});

// Run backtest simulator endpoint
app.get('/api/stock-data', async (req, res) => {
  try {
    const symbolsRaw = (req.query.symbols as string) || 'SPY,QQQ,AAPL,MSFT,NVDA';
    const symbols = symbolsRaw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 7);

    const lumpSumAmount = Math.max(0, parseFloat((req.query.lumpSum as string) || '10000'));
    const yearlyTopUpAmount = Math.max(0, parseFloat((req.query.yearlyTopUp as string) || '2400'));
    const years = Math.min(30, Math.max(1, parseInt((req.query.years as string) || '30', 10)));

    const params: BacktestParams = {
      lumpSumAmount,
      yearlyTopUpAmount,
      years,
      symbols,
    };

    const result = await runBacktest(params);
    res.json(result);
  } catch (err: any) {
    console.error('Backtest error:', err);
    res.status(500).json({ error: err.message || 'Internal server error while running backtest' });
  }
});

// Mount Vite or serve static dist
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[AlphaBacktest] Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
