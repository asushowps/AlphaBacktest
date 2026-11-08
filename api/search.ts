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

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = ((req.query?.q as string) || '').trim().toUpperCase();
  if (!query) {
    return res.status(200).json(POPULAR_TICKERS.slice(0, 10));
  }

  const filtered = POPULAR_TICKERS.filter(
    (t) => t.symbol.toUpperCase().includes(query) || t.name.toUpperCase().includes(query)
  );

  return res.status(200).json(filtered.slice(0, 10));
}
