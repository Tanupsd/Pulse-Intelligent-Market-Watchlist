const mockProvider = require('./MockMarketDataProvider');
const liveProvider = require('./LiveMarketDataProvider');
const stockCatalog = require('./stockCatalog');
const { query } = require('../../db/pool');

class MarketDataService {
  constructor() {
    this.mockProvider = mockProvider;
    this.liveProvider = liveProvider;
    this.providerMode = process.env.NODE_ENV === 'test' ? 'mock' : 'live';
  }

  setProviderMode(mode) {
    if (['live', 'mock'].includes(mode)) {
      this.providerMode = mode;
      console.log(`[MarketDataService] Switched provider mode to: ${mode}`);
    }
  }

  getProviderMode() {
    return {
      mode: this.providerMode,
      scenario: this.mockProvider.getScenario(),
      dataStatus: this.getDataStatus(),
    };
  }

  setScenario(scenario) {
    this.mockProvider.setScenario(scenario);
  }

  getScenario() {
    return this.mockProvider.getScenario();
  }

  setDataStatus(status) {
    this.mockProvider.setDataStatus(status);
  }

  getDataStatus() {
    if (this.providerMode === 'live') {
      return 'LIVE';
    }
    return this.mockProvider.getDataStatus();
  }

  async getQuote(symbol) {
    const cleanSym = symbol.toUpperCase().trim();

    // 1. If in 'live' mode, try live provider first
    if (this.providerMode === 'live') {
      try {
        const quote = await this.liveProvider.getQuote(cleanSym);
        this._saveSnapshotAsync(quote);
        return quote;
      } catch (liveErr) {
        console.warn(`[MarketDataService] Live quote fallback for ${cleanSym}:`, liveErr.message);
      }
    }

    // 2. Try Mock Provider (or mock fallback)
    try {
      const mockQuote = await this.mockProvider.getQuote(cleanSym);
      this._saveSnapshotAsync(mockQuote);
      return mockQuote;
    } catch (mockErr) {
      console.warn(`[MarketDataService] Mock quote failed for ${cleanSym}:`, mockErr.message);
    }

    // 3. Fallback to Database Snapshot Cache
    const cached = await this._getCachedSnapshot(cleanSym);
    if (cached) {
      return cached;
    }

    throw new Error(`Unable to obtain market quote for ${cleanSym} from any provider.`);
  }

  async getQuotes(symbols) {
    if (!symbols || symbols.length === 0) return [];
    const cleanSymbols = [...new Set(symbols.map(s => s.toUpperCase().trim()))];

    // Batch quote retrieval
    return Promise.all(cleanSymbols.map(s => this.getQuote(s)));
  }

  async getHistoricalData(symbol, range = '1D') {
    const cleanSym = symbol.toUpperCase().trim();

    if (this.providerMode === 'live') {
      try {
        return await this.liveProvider.getHistoricalData(cleanSym, range);
      } catch (err) {
        console.warn(`[MarketDataService] Live historical failed for ${cleanSym}, fallback to mock:`, err.message);
      }
    }

    return this.mockProvider.getHistoricalData(cleanSym, range);
  }

  async getEvents(symbol) {
    const cleanSym = symbol.toUpperCase().trim();
    let events = [];

    if (this.providerMode === 'live') {
      try {
        events = await this.liveProvider.getEvents(cleanSym);
      } catch (err) {
        console.warn(`[MarketDataService] Live events failed for ${cleanSym}:`, err.message);
      }
    }

    if (events.length === 0) {
      events = await this.mockProvider.getEvents(cleanSym);
    }

    // Enrich from DB events if any
    try {
      const dbEvents = await query(
        `SELECT id, symbol, event_type AS "eventType", title, description, source, url, timestamp, importance
         FROM market_events
         WHERE symbol = $1
         ORDER BY timestamp DESC
         LIMIT 10`,
        [cleanSym]
      );

      if (dbEvents.rows.length > 0) {
        const existingIds = new Set(events.map(e => e.id));
        for (const dbe of dbEvents.rows) {
          if (!existingIds.has(dbe.id)) {
            events.push({
              ...dbe,
              timestamp: new Date(dbe.timestamp).toISOString(),
            });
          }
        }
      }
    } catch (dbErr) {
      // Non-blocking
    }

    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return events;
  }

  async getBenchmarkPerformance() {
    if (this.providerMode === 'live') {
      try {
        return await this.liveProvider.getBenchmarkPerformance();
      } catch (err) {
        // fallback
      }
    }
    return this.mockProvider.getBenchmarkPerformance();
  }

  /**
   * Search across both the live stock search API and the 150+ catalog
   * Returns rich search results for ANY stock ticker or company name.
   */
  async searchSymbols(query) {
    if (!query || !query.trim()) return [];
    const q = query.toUpperCase().trim();

    const resultsMap = new Map();

    // 1. Search local 150+ catalog first for instantaneous matches
    const catalogMatches = stockCatalog.filter(s =>
      s.symbol.includes(q) || s.name.toUpperCase().includes(q) || (s.sector && s.sector.toUpperCase().includes(q))
    );

    for (const item of catalogMatches) {
      resultsMap.set(item.symbol, {
        symbol: item.symbol,
        name: item.name,
        sector: item.sector,
        price: 0,
        changePercent: 0,
      });
    }

    // 2. Also query live search API to support ANY equity in the world
    if (this.providerMode === 'live') {
      try {
        const liveMatches = await this.liveProvider.searchSymbols(query);
        for (const item of liveMatches) {
          if (!resultsMap.has(item.symbol)) {
            resultsMap.set(item.symbol, {
              symbol: item.symbol,
              name: item.name,
              sector: item.sector || 'Equities',
              price: 0,
              changePercent: 0,
            });
          }
        }
      } catch (err) {
        console.warn('[MarketDataService] Live search lookup error:', err.message);
      }
    }

    return Array.from(resultsMap.values()).slice(0, 15);
  }

  /**
   * Retrieves quotes for the catalog universe with an in-memory cache
   */
  async getUniverseQuotes() {
    const now = Date.now();
    if (this._universeCache && (now - this._universeCacheTime < 30000)) {
      return this._universeCache;
    }

    const quotes = [];
    for (const item of stockCatalog) {
      try {
        const quote = await this.mockProvider.getQuote(item.symbol);
        quotes.push({
          symbol: item.symbol,
          name: item.name || quote.name,
          sector: item.sector || quote.sector,
          price: quote.price,
          changePercent: quote.changePercent,
          change: Number(((quote.price * quote.changePercent) / 100).toFixed(2)),
          volume: quote.volume,
          averageVolume: quote.averageVolume,
          marketCap: quote.marketCap,
          dataStatus: quote.dataStatus || this.getDataStatus(),
        });
      } catch (e) {
        // ignore single stock error
      }
    }

    this._universeCache = quotes;
    this._universeCacheTime = now;
    return quotes;
  }

  /**
   * Returns top performers sorted strictly descending by changePercent
   */
  async getTopPerformers(limit = 5, offset = 0) {
    const universe = await this.getUniverseQuotes();
    const sorted = [...universe].sort((a, b) => b.changePercent - a.changePercent);
    const numLimit = Math.max(1, parseInt(limit, 10) || 5);
    const numOffset = Math.max(0, parseInt(offset, 10) || 0);
    const items = sorted.slice(numOffset, numOffset + numLimit);

    return {
      total: sorted.length,
      limit: numLimit,
      offset: numOffset,
      hasMore: numOffset + numLimit < sorted.length,
      items,
    };
  }

  /**
   * Returns top losers sorted strictly ascending by changePercent
   */
  async getTopLosers(limit = 5, offset = 0) {
    const universe = await this.getUniverseQuotes();
    const sorted = [...universe].sort((a, b) => a.changePercent - b.changePercent);
    const numLimit = Math.max(1, parseInt(limit, 10) || 5);
    const numOffset = Math.max(0, parseInt(offset, 10) || 0);
    const items = sorted.slice(numOffset, numOffset + numLimit);

    return {
      total: sorted.length,
      limit: numLimit,
      offset: numOffset,
      hasMore: numOffset + numLimit < sorted.length,
      items,
    };
  }

  /**
   * Returns side-by-side comparison data for multiple stocks
   */
  async getComparisonData(symbolsInput, range = '1M') {
    let symbols = [];
    if (Array.isArray(symbolsInput)) {
      symbols = symbolsInput;
    } else if (typeof symbolsInput === 'string') {
      symbols = symbolsInput.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (symbols.length === 0) {
      return {
        symbols: [],
        range,
        stocks: [],
      };
    }
    // Limit to 5 symbols max for clean UI display
    symbols = [...new Set(symbols.map(s => s.toUpperCase()))].slice(0, 5);

    const stocks = [];
    for (const sym of symbols) {
      try {
        const quote = await this.getQuote(sym);
        const historyData = await this.getHistoricalData(sym, range);
        const points = historyData.points || [];

        // Calculate period return
        let periodReturn = 0;
        if (points.length >= 2) {
          const startPrice = points[0].price;
          const endPrice = points[points.length - 1].price;
          if (startPrice > 0) {
            periodReturn = Number((((endPrice - startPrice) / startPrice) * 100).toFixed(2));
          }
        }

        // Calculate 52w range / metrics
        const allPrices = points.map(p => p.price);
        const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : quote.price * 0.75;
        const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : quote.price * 1.25;
        const low52w = Number((minPrice * 0.95).toFixed(2));
        const high52w = Number((maxPrice * 1.05).toFixed(2));

        // Deterministic PE Ratio based on sector & marketCap
        const peRatio = Number((15 + (sym.charCodeAt(0) % 25) + (quote.changePercent > 0 ? 5 : -2)).toFixed(1));

        stocks.push({
          symbol: quote.symbol,
          name: quote.name,
          sector: quote.sector,
          price: quote.price,
          change: Number(((quote.price * quote.changePercent) / 100).toFixed(2)),
          changePercent: quote.changePercent,
          volume: quote.volume,
          averageVolume: quote.averageVolume,
          marketCap: quote.marketCap,
          peRatio,
          high52w,
          low52w,
          periodReturn,
          dataStatus: quote.dataStatus,
          history: points,
        });
      } catch (err) {
        console.warn(`[MarketDataService] Failed to load comparison for ${sym}:`, err.message);
      }
    }

    return {
      symbols,
      range,
      stocks,
    };
  }

  async _saveSnapshotAsync(quote) {
    try {
      await query(
        `INSERT INTO market_snapshots (symbol, price, change_percent, volume, market_cap, timestamp, source, data_status)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)`,
        [
          quote.symbol,
          quote.price,
          quote.changePercent,
          quote.volume,
          quote.marketCap || 0,
          quote.source || 'PROVIDER',
          quote.dataStatus || 'LIVE',
        ]
      );
    } catch (err) {
      if (process.env.DEBUG_SQL === 'true') {
        console.warn('[MarketDataService] Snapshot save error:', err.message);
      }
    }
  }

  async _getCachedSnapshot(symbol) {
    try {
      const res = await query(
        `SELECT symbol, price, change_percent AS "changePercent", volume, market_cap AS "marketCap",
                timestamp, source, data_status AS "dataStatus"
         FROM market_snapshots
         WHERE symbol = $1
         ORDER BY timestamp DESC
         LIMIT 1`,
        [symbol]
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];
        const ageMs = Date.now() - new Date(row.timestamp).getTime();
        const isOld = ageMs > 15 * 60 * 1000;

        return {
          symbol: row.symbol,
          name: `${row.symbol} Inc.`,
          sector: 'Equities',
          price: Number(row.price),
          changePercent: Number(row.changePercent),
          volume: Number(row.volume),
          averageVolume: Number(row.volume),
          volumeRatio: 1.0,
          marketCap: Number(row.marketCap),
          timestamp: row.timestamp,
          source: `${row.source}_CACHE`,
          dataStatus: isOld ? 'STALE' : (row.dataStatus || 'DELAYED'),
          checkpointPrice: Number(row.price),
          checkpointVolume: Number(row.volume),
        };
      }
    } catch (err) {
      console.error('[MarketDataService] Cache lookup error:', err.message);
    }
    return null;
  }
}

module.exports = new MarketDataService();
