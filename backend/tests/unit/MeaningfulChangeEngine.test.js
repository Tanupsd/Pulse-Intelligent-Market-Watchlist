const engine = require('../../src/services/engine/MeaningfulChangeEngine');

describe('MeaningfulChangeEngine Unit Tests', () => {
  const baseQuote = {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    price: 240.00,
    changePercent: 0.0,
    volume: 50000000,
    averageVolume: 50000000,
    marketCap: 3500000000000,
    dataStatus: 'LIVE',
  };

  test('Test 1: Small price movement (+0.4%) should not be meaningful (NORMAL)', () => {
    const quote = { ...baseQuote, price: 240.96, changePercent: 0.40 };
    const checkpoint = { price: 240.00, volume: 50000000, timestamp: new Date().toISOString() };

    const result = engine.evaluate({ quote, checkpoint });

    expect(result.attentionScore).toBeLessThan(25);
    expect(result.severity).toBe('NORMAL');
    expect(result.isMeaningful).toBe(false);
    expect(result.reasons[0].type).toBe('CALM');
  });

  test('Test 2: Large price movement (-5.0%) should produce high score (Major movement)', () => {
    const quote = { ...baseQuote, price: 228.00, changePercent: -5.00 };
    const checkpoint = { price: 240.00, volume: 50000000, timestamp: new Date().toISOString() };

    const result = engine.evaluate({ quote, checkpoint });

    expect(result.scoreBreakdown.priceMovement).toBe(40);
    expect(result.attentionScore).toBeGreaterThanOrEqual(40);
    expect(result.sinceLastCheck).toBe(-5.0);
    expect(result.isMeaningful).toBe(true);
    expect(result.reasons.some(r => r.type === 'PRICE')).toBe(true);
  });

  test('Test 3: Unusual volume (2.5x average) should increase attention score', () => {
    const quote = {
      ...baseQuote,
      price: 241.00,
      changePercent: 0.4,
      volume: 125000000,
      averageVolume: 50000000, // 2.5x
    };
    const checkpoint = { price: 240.00, volume: 50000000, timestamp: new Date().toISOString() };

    const result = engine.evaluate({ quote, checkpoint });

    expect(result.scoreBreakdown.volumeAnomaly).toBe(18);
    expect(result.signals.volumeRatio).toBe(2.5);
    expect(result.reasons.some(r => r.type === 'VOLUME')).toBe(true);
  });

  test('Test 4: Important event (HIGH) should increase attention score', () => {
    const events = [
      {
        id: 'ev-1',
        title: 'DOJ Regulatory Inquiry',
        importance: 'HIGH',
        eventType: 'REGULATORY',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30m ago
      },
    ];

    const result = engine.evaluate({ quote: baseQuote, checkpoint: { price: 240.00 }, events });

    expect(result.scoreBreakdown.marketEvent).toBeGreaterThanOrEqual(20);
    expect(result.reasons.some(r => r.type === 'EVENT')).toBe(true);
  });

  test('Test 5: Combined signals (-5.0% price, 2.5x volume, HIGH event) should produce CRITICAL severity', () => {
    const quote = {
      ...baseQuote,
      symbol: 'NVDA',
      price: 184.32,
      changePercent: -4.8,
      volume: 84000000,
      averageVolume: 40000000, // 2.1x
    };
    const checkpoint = {
      price: 193.61, // -4.8% drop
      volume: 40000000,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    };
    const events = [
      {
        id: 'ev-crit',
        title: 'Antitrust investigation expanded',
        importance: 'HIGH',
        eventType: 'REGULATORY',
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      },
    ];
    const benchmark = { changePercent: -1.0 }; // Stock dropped -4.8%, lagging benchmark by -3.8%

    const result = engine.evaluate({ quote, checkpoint, events, benchmark });

    expect(result.attentionScore).toBeGreaterThanOrEqual(75);
    expect(result.severity).toBe('CRITICAL');
    expect(result.isMeaningful).toBe(true);
    expect(result.reasons.length).toBeGreaterThanOrEqual(3);
  });

  test('Test 6: Previous checkpoint missing should be handled gracefully (First visit)', () => {
    const quote = { ...baseQuote, price: 240.00, changePercent: 0.5 };

    const result = engine.evaluate({ quote, checkpoint: null });

    expect(result.hasCheckpoint).toBe(false);
    expect(result.checkpointPrice).toBe(null);
    expect(result.sinceLastCheck).toBe(0.5); // Fallback to daily change
    expect(result.severity).toBe('NORMAL');
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  test('Test 7: Stale market data should be correctly identified in response', () => {
    const quote = { ...baseQuote, dataStatus: 'STALE' };

    const result = engine.evaluate({ quote });

    expect(result.dataStatus).toBe('STALE');
  });

  test('Test 8: Rank watchlist sorts stocks by attention score DESC', () => {
    const quotes = [
      { ...baseQuote, symbol: 'AAPL', price: 240.50, changePercent: 0.2 },
      { ...baseQuote, symbol: 'NVDA', price: 184.32, changePercent: -4.8, volume: 84000000, averageVolume: 40000000 },
      { ...baseQuote, symbol: 'AMD', price: 162.41, changePercent: 2.3, volume: 65000000, averageVolume: 26000000 },
    ];
    const checkpoints = {
      AAPL: { price: 240.00 },
      NVDA: { price: 193.61 }, // large drop
      AMD: { price: 158.75 },
    };
    const events = {
      NVDA: [{ title: 'DOJ Inquiry', importance: 'HIGH', timestamp: new Date().toISOString() }],
    };

    const ranked = engine.rankWatchlistChanges({
      quotes,
      checkpoints,
      eventsBySymbol: events,
      benchmark: { changePercent: -1.0 },
    });

    expect(ranked.stocks[0].symbol).toBe('NVDA');
    expect(ranked.stocks[0].severity).toBe('CRITICAL');
    expect(ranked.meaningfulChanges).toBeGreaterThanOrEqual(2);
  });
});
