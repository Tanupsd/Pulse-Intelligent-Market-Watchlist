const MarketDataProvider = require('./MarketDataProvider');

class MockMarketDataProvider extends MarketDataProvider {
  constructor() {
    super('MockMarketDataProvider');
    this.currentScenario = 'demo'; // 'demo' | 'quiet' | 'volatile'
    this.statusOverride = 'LIVE';   // 'LIVE' | 'DELAYED' | 'STALE' | 'UNAVAILABLE'
    this.lastUpdated = new Date();
  }

  setScenario(scenario) {
    if (['demo', 'quiet', 'volatile'].includes(scenario)) {
      this.currentScenario = scenario;
      this.lastUpdated = new Date();
    }
  }

  getScenario() {
    return this.currentScenario;
  }

  setDataStatus(status) {
    if (['LIVE', 'DELAYED', 'STALE', 'UNAVAILABLE'].includes(status)) {
      this.statusOverride = status;
    }
  }

  getDataStatus() {
    return this.statusOverride;
  }

  getBenchmarkPerformance() {
    switch (this.currentScenario) {
      case 'volatile':
        return { symbol: 'SPY', name: 'S&P 500 Index ETF', changePercent: -2.40, price: 542.10 };
      case 'quiet':
        return { symbol: 'SPY', name: 'S&P 500 Index ETF', changePercent: 0.15, price: 558.90 };
      case 'demo':
      default:
        return { symbol: 'SPY', name: 'S&P 500 Index ETF', changePercent: -1.00, price: 555.20 };
    }
  }

  getMockCatalog() {
    return {
      NVDA: {
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        sector: 'Semiconductors',
        marketCap: 4520000000000,
        averageVolume: 40000000,
        scenarios: {
          demo:     { price: 184.32, changePercent: -4.80, volume: 84000000, checkpointPrice: 193.61, checkpointVolume: 40000000 },
          quiet:    { price: 193.80, changePercent: 0.35,  volume: 38000000, checkpointPrice: 193.10, checkpointVolume: 39000000 },
          volatile: { price: 179.50, changePercent: -7.20, volume: 136000000, checkpointPrice: 193.61, checkpointVolume: 40000000 },
        }
      },
      AMD: {
        symbol: 'AMD',
        name: 'Advanced Micro Devices Inc.',
        sector: 'Semiconductors',
        marketCap: 263000000000,
        averageVolume: 26000000,
        scenarios: {
          demo:     { price: 162.41, changePercent: 2.30,  volume: 65000000, checkpointPrice: 158.75, checkpointVolume: 26000000 },
          quiet:    { price: 159.10, changePercent: 0.20,  volume: 25500000, checkpointPrice: 158.75, checkpointVolume: 26000000 },
          volatile: { price: 168.45, changePercent: 6.10,  volume: 81000000, checkpointPrice: 158.75, checkpointVolume: 26000000 },
        }
      },
      AAPL: {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Consumer Electronics',
        marketCap: 3680000000000,
        averageVolume: 48000000,
        scenarios: {
          demo:     { price: 241.20, changePercent: 0.40,  volume: 43200000, checkpointPrice: 240.24, checkpointVolume: 48000000 },
          quiet:    { price: 240.80, changePercent: 0.15,  volume: 46000000, checkpointPrice: 240.24, checkpointVolume: 48000000 },
          volatile: { price: 233.50, changePercent: -2.80, volume: 92000000, checkpointPrice: 240.24, checkpointVolume: 48000000 },
        }
      },
      MSFT: {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        sector: 'Software & Cloud',
        marketCap: 3330000000000,
        averageVolume: 22000000,
        scenarios: {
          demo:     { price: 448.18, changePercent: 0.60,  volume: 21800000, checkpointPrice: 445.50, checkpointVolume: 22000000 },
          quiet:    { price: 446.10, changePercent: 0.10,  volume: 21000000, checkpointPrice: 445.50, checkpointVolume: 22000000 },
          volatile: { price: 432.00, changePercent: -3.00, volume: 44000000, checkpointPrice: 445.50, checkpointVolume: 22000000 },
        }
      },
      TSLA: {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        sector: 'Automotive & Clean Energy',
        marketCap: 704000000000,
        averageVolume: 55000000,
        scenarios: {
          demo:     { price: 220.80, changePercent: -3.20, volume: 72000000, checkpointPrice: 228.10, checkpointVolume: 55000000 },
          quiet:    { price: 227.50, changePercent: -0.25, volume: 52000000, checkpointPrice: 228.10, checkpointVolume: 55000000 },
          volatile: { price: 212.00, changePercent: -7.00, volume: 154000000, checkpointPrice: 228.10, checkpointVolume: 55000000 },
        }
      },
      AMZN: {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        sector: 'E-Commerce & Cloud',
        marketCap: 1960000000000,
        averageVolume: 35000000,
        scenarios: {
          demo:     { price: 188.90, changePercent: 1.10,  volume: 38000000, checkpointPrice: 186.85, checkpointVolume: 35000000 },
          quiet:    { price: 187.20, changePercent: 0.18,  volume: 34000000, checkpointPrice: 186.85, checkpointVolume: 35000000 },
          volatile: { price: 198.50, changePercent: 6.20,  volume: 89000000, checkpointPrice: 186.85, checkpointVolume: 35000000 },
        }
      },
      GOOGL: {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        sector: 'Internet & AI',
        marketCap: 2050000000000,
        averageVolume: 24000000,
        scenarios: {
          demo:     { price: 165.40, changePercent: -0.80, volume: 25000000, checkpointPrice: 166.70, checkpointVolume: 24000000 },
          quiet:    { price: 166.50, changePercent: -0.10, volume: 23000000, checkpointPrice: 166.70, checkpointVolume: 24000000 },
          volatile: { price: 157.00, changePercent: -5.80, volume: 62000000, checkpointPrice: 166.70, checkpointVolume: 24000000 },
        }
      },
      META: {
        symbol: 'META',
        name: 'Meta Platforms Inc.',
        sector: 'Social Media & AI',
        marketCap: 1300000000000,
        averageVolume: 16000000,
        scenarios: {
          demo:     { price: 512.30, changePercent: 1.80,  volume: 18000000, checkpointPrice: 503.20, checkpointVolume: 16000000 },
          quiet:    { price: 504.50, changePercent: 0.25,  volume: 15500000, checkpointPrice: 503.20, checkpointVolume: 16000000 },
          volatile: { price: 535.00, changePercent: 6.30,  volume: 48000000, checkpointPrice: 503.20, checkpointVolume: 16000000 },
        }
      }
    };
  }

  async getQuote(symbol) {
    const cleanSym = symbol.toUpperCase().trim();
    const catalog = this.getMockCatalog();
    const item = catalog[cleanSym];

    if (!item) {
      // Deterministic fallback for ad-hoc symbols
      return this._generateGenericQuote(cleanSym);
    }

    const scenarioData = item.scenarios[this.currentScenario] || item.scenarios.demo;
    return {
      symbol: item.symbol,
      name: item.name,
      sector: item.sector,
      price: scenarioData.price,
      changePercent: scenarioData.changePercent,
      volume: scenarioData.volume,
      averageVolume: item.averageVolume,
      volumeRatio: Number((scenarioData.volume / item.averageVolume).toFixed(2)),
      marketCap: item.marketCap,
      timestamp: new Date().toISOString(),
      source: 'MOCK_PRIMARY',
      dataStatus: this.statusOverride,
      checkpointPrice: scenarioData.checkpointPrice,
      checkpointVolume: scenarioData.checkpointVolume,
    };
  }

  async getQuotes(symbols) {
    const quotes = await Promise.all(symbols.map(s => this.getQuote(s)));
    return quotes;
  }

  async getEvents(symbol) {
    const cleanSym = symbol.toUpperCase().trim();
    const catalogEvents = {
      NVDA: [
        {
          id: 'ev-nvda-1',
          symbol: 'NVDA',
          eventType: 'REGULATORY',
          title: 'Department of Justice expands semiconductor antitrust inquiry into AI accelerator supply agreements',
          description: 'Regulators seek internal documents regarding bundled software licensing terms and hyperscaler supply allocations.',
          source: 'Bloomberg / FT',
          url: 'https://example.com/news/nvda-antitrust',
          timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
          importance: this.currentScenario === 'quiet' ? 'LOW' : 'HIGH'
        },
        {
          id: 'ev-nvda-2',
          symbol: 'NVDA',
          eventType: 'PRODUCT',
          title: 'Blackwell architecture volume ramp on track for Q4 delivery schedule',
          description: 'CFO reiterates packaging yield improvements during global technology conference.',
          source: 'Reuters',
          url: 'https://example.com/news/nvda-blackwell',
          timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
          importance: 'MEDIUM'
        }
      ],
      TSLA: [
        {
          id: 'ev-tsla-1',
          symbol: 'TSLA',
          eventType: 'GUIDANCE',
          title: 'Q3 Delivery outlook adjusted due to assembly line upgrades at Austin Gigafactory',
          description: 'Tooling transition for next-gen powertrain components temporarily impacts output by 4%.',
          source: 'Reuters',
          url: 'https://example.com/news/tsla-guidance',
          timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
          importance: this.currentScenario === 'quiet' ? 'LOW' : 'HIGH'
        }
      ],
      AMD: [
        {
          id: 'ev-amd-1',
          symbol: 'AMD',
          eventType: 'PRODUCT',
          title: 'Enterprise cloud provider selects Instinct MI325X for tier-1 inference deployment',
          description: 'Major cloud provider signs multi-million dollar volume supply agreement for next-generation generative AI clusters.',
          source: 'PR Newswire',
          url: 'https://example.com/news/amd-datacenter',
          timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          importance: 'MEDIUM'
        }
      ],
      AAPL: [
        {
          id: 'ev-aapl-1',
          symbol: 'AAPL',
          eventType: 'ANALYST',
          title: 'Analyst note reiterates Neutral rating citing steady iPhone upgrade cycle',
          description: 'Channel checks indicate supply chain builds remain consistent with seasonal historical averages.',
          source: 'Morgan Stanley',
          url: 'https://example.com/news/aapl-note',
          timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
          importance: 'LOW'
        }
      ]
    };

    return catalogEvents[cleanSym] || [];
  }

  async getHistoricalData(symbol, range = '1D') {
    const quote = await this.getQuote(symbol);
    const basePrice = quote.price;

    let pointsCount = 24;
    let stepMillis = 60 * 60 * 1000; // hourly
    let volatility = 0.008;

    if (range === '1W') {
      pointsCount = 7;
      stepMillis = 24 * 60 * 60 * 1000;
      volatility = 0.015;
    } else if (range === '1M') {
      pointsCount = 30;
      stepMillis = 24 * 60 * 60 * 1000;
      volatility = 0.02;
    } else if (range === '1Y') {
      pointsCount = 52;
      stepMillis = 7 * 24 * 60 * 60 * 1000;
      volatility = 0.035;
    }

    const points = [];
    const now = Date.now();
    let runningPrice = basePrice * (1 - (quote.changePercent / 100)); // approximate start price

    for (let i = pointsCount; i >= 0; i--) {
      const time = new Date(now - i * stepMillis);
      // Deterministic pseudo-random variation based on symbol + index
      const seed = (symbol.charCodeAt(0) * 17 + i * 31) % 100;
      const variation = ((seed / 50) - 1) * volatility;
      runningPrice = runningPrice * (1 + variation);

      // Force the final point to match current quote
      const finalPrice = i === 0 ? basePrice : Number(runningPrice.toFixed(2));
      const estVolume = Math.round(quote.averageVolume / pointsCount * (0.8 + (seed % 40) / 100));

      points.push({
        timestamp: time.toISOString(),
        timeLabel: range === '1D' 
          ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : time.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        price: finalPrice,
        volume: estVolume,
      });
    }

    return {
      symbol: quote.symbol,
      range,
      points,
    };
  }

  async searchSymbols(query) {
    if (!query || !query.trim()) return [];
    const q = query.toUpperCase().trim();
    const catalog = this.getMockCatalog();

    const matches = Object.values(catalog).filter(stock => 
      stock.symbol.includes(q) || stock.name.toUpperCase().includes(q)
    );

    return matches.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      price: stock.scenarios[this.currentScenario].price,
      changePercent: stock.scenarios[this.currentScenario].changePercent,
    }));
  }

  _generateGenericQuote(symbol) {
    // Generate deterministic values from symbol characters
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = (hash << 5) - hash + symbol.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const price = Number((50 + (absHash % 400) + ((absHash % 100) / 100)).toFixed(2));
    const changePercent = Number((((absHash % 100) / 10) - 5).toFixed(2));
    const avgVol = 15000000 + (absHash % 30000000);
    const vol = Math.round(avgVol * (0.8 + ((absHash % 150) / 100)));

    return {
      symbol,
      name: `${symbol} Inc.`,
      sector: 'Technology',
      price,
      changePercent,
      volume: vol,
      averageVolume: avgVol,
      volumeRatio: Number((vol / avgVol).toFixed(2)),
      marketCap: price * 100000000,
      timestamp: new Date().toISOString(),
      source: 'MOCK_GENERIC',
      dataStatus: this.statusOverride,
      checkpointPrice: Number((price * (1 - (changePercent / 100))).toFixed(2)),
      checkpointVolume: avgVol,
    };
  }
}

// Export singleton instance
module.exports = new MockMarketDataProvider();
