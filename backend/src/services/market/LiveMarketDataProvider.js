const MarketDataProvider = require('./MarketDataProvider');

class LiveMarketDataProvider extends MarketDataProvider {
  constructor() {
    super('LiveMarketDataProvider');
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  async getQuote(symbol) {
    const cleanSym = symbol.toUpperCase().trim();
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSym)}?interval=1d&range=5d`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (!res.ok) {
        throw new Error(`Live quote request failed with status ${res.status}`);
      }

      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) {
        throw new Error(`No chart data returned for ${cleanSym}`);
      }

      const meta = result.meta;
      const currentPrice = Number((meta.regularMarketPrice || meta.chartPreviousClose || 0).toFixed(2));
      const previousClose = Number((meta.chartPreviousClose || currentPrice).toFixed(2));
      const currentVolume = Number(meta.regularMarketVolume || 0);

      // Daily change %
      let changePercent = 0;
      if (previousClose > 0) {
        changePercent = Number((((currentPrice - previousClose) / previousClose) * 100).toFixed(2));
      }

      // Calculate recent average volume from available candles
      const volumes = result.indicators?.quote?.[0]?.volume?.filter(v => v != null && v > 0) || [];
      const averageVolume = volumes.length > 0
        ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length)
        : currentVolume || 10000000;

      const volumeRatio = Number((currentVolume / (averageVolume || 1)).toFixed(2));

      return {
        symbol: cleanSym,
        name: meta.longName || meta.shortName || `${cleanSym} Inc.`,
        sector: meta.instrumentType === 'ETF' ? 'ETF / Benchmark' : 'Equities',
        price: currentPrice,
        changePercent,
        volume: currentVolume,
        averageVolume,
        volumeRatio,
        marketCap: meta.marketCap || currentPrice * 100000000,
        timestamp: new Date().toISOString(),
        source: 'YAHOO_LIVE',
        dataStatus: 'LIVE',
        checkpointPrice: previousClose,
        checkpointVolume: averageVolume,
      };
    } catch (err) {
      console.warn(`[LiveMarketDataProvider] Failed to fetch live quote for ${cleanSym}:`, err.message);
      throw err;
    }
  }

  async getQuotes(symbols) {
    const cleanSymbols = [...new Set(symbols.map(s => s.toUpperCase().trim()))];
    const quotes = await Promise.all(cleanSymbols.map(s => this.getQuote(s)));
    return quotes;
  }

  async getHistoricalData(symbol, range = '1D') {
    const cleanSym = symbol.toUpperCase().trim();
    let interval = '5m';
    let apiRange = '1d';

    if (range === '1W') {
      interval = '15m';
      apiRange = '5d';
    } else if (range === '1M') {
      interval = '1d';
      apiRange = '1mo';
    } else if (range === '1Y') {
      interval = '1wk';
      apiRange = '1y';
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSym)}?interval=${interval}&range=${apiRange}`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);
      const data = await res.json();
      const result = data?.chart?.result?.[0];

      if (!result) throw new Error('No historical data points');

      const timestamps = result.timestamp || [];
      const quoteData = result.indicators?.quote?.[0] || {};
      const closePrices = quoteData.close || [];
      const volumes = quoteData.volume || [];

      const points = [];
      for (let i = 0; i < timestamps.length; i++) {
        const p = closePrices[i];
        if (p == null || isNaN(p)) continue;

        const ts = new Date(timestamps[i] * 1000);
        points.push({
          timestamp: ts.toISOString(),
          timeLabel: range === '1D'
            ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ts.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          price: Number(p.toFixed(2)),
          volume: volumes[i] || 0,
        });
      }

      return {
        symbol: cleanSym,
        range,
        points,
      };
    } catch (err) {
      console.warn(`[LiveMarketDataProvider] Historical fallback for ${cleanSym}:`, err.message);
      throw err;
    }
  }

  async getEvents(symbol) {
    const cleanSym = symbol.toUpperCase().trim();
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanSym)}`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (!res.ok) return [];
      const data = await res.json();
      const newsItems = data?.news || [];

      return newsItems.slice(0, 5).map((item, idx) => {
        // Assess importance heuristically based on keywords
        const lowerTitle = (item.title || '').toLowerCase();
        let importance = 'LOW';
        let eventType = 'OTHER';

        if (lowerTitle.includes('earnings') || lowerTitle.includes('revenue') || lowerTitle.includes('profit')) {
          importance = 'HIGH';
          eventType = 'EARNINGS';
        } else if (lowerTitle.includes('guidance') || lowerTitle.includes('outlook') || lowerTitle.includes('forecast')) {
          importance = 'HIGH';
          eventType = 'GUIDANCE';
        } else if (lowerTitle.includes('antitrust') || lowerTitle.includes('investigation') || lowerTitle.includes('lawsuit') || lowerTitle.includes('sec')) {
          importance = 'CRITICAL';
          eventType = 'REGULATORY';
        } else if (lowerTitle.includes('upgrade') || lowerTitle.includes('downgrade') || lowerTitle.includes('analyst') || lowerTitle.includes('target')) {
          importance = 'MEDIUM';
          eventType = 'ANALYST';
        } else if (lowerTitle.includes('launches') || lowerTitle.includes('ai') || lowerTitle.includes('chip') || lowerTitle.includes('product')) {
          importance = 'MEDIUM';
          eventType = 'PRODUCT';
        }

        return {
          id: item.uuid || `live-news-${idx}`,
          symbol: cleanSym,
          eventType,
          title: item.title,
          description: `Reported by ${item.publisher || 'Financial Media'}.`,
          source: item.publisher || 'Financial News',
          url: item.link || '',
          timestamp: item.providerPublishTime
            ? new Date(item.providerPublishTime * 1000).toISOString()
            : new Date().toISOString(),
          importance,
        };
      });
    } catch (err) {
      console.warn(`[LiveMarketDataProvider] Events lookup failed for ${cleanSym}:`, err.message);
      return [];
    }
  }

  async searchSymbols(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim();
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
      });

      if (!res.ok) return [];
      const data = await res.json();
      const quotes = data?.quotes || [];

      // Filter for valid equities, ETFs, and indices
      return quotes
        .filter(item => item.symbol && (item.quoteType === 'EQUITY' || item.quoteType === 'ETF'))
        .map(item => ({
          symbol: item.symbol,
          name: item.longname || item.shortname || item.symbol,
          sector: item.sector || item.industry || (item.quoteType === 'ETF' ? 'ETF / Index' : 'Equities'),
          exchange: item.exchange || 'US',
          price: 0, // Quote fetched when added
          changePercent: 0,
        }));
    } catch (err) {
      console.warn(`[LiveMarketDataProvider] Live search error for "${q}":`, err.message);
      return [];
    }
  }

  async getBenchmarkPerformance() {
    try {
      const spyQuote = await this.getQuote('SPY');
      return {
        symbol: 'SPY',
        name: 'S&P 500 Index ETF',
        changePercent: spyQuote.changePercent,
        price: spyQuote.price,
      };
    } catch (err) {
      return {
        symbol: 'SPY',
        name: 'S&P 500 Index ETF',
        changePercent: -0.45,
        price: 552.30,
      };
    }
  }
}

module.exports = new LiveMarketDataProvider();
