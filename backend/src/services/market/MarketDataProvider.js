/**
 * MarketDataProvider interface / base class.
 * All market data sources (Mock, Finnhub, Polygon, AlphaVantage) must implement this contract.
 */
class MarketDataProvider {
  constructor(name = 'BaseProvider') {
    this.name = name;
  }

  async getQuote(symbol) {
    throw new Error('getQuote(symbol) not implemented');
  }

  async getQuotes(symbols) {
    throw new Error('getQuotes(symbols) not implemented');
  }

  async getHistoricalData(symbol, range = '1M') {
    throw new Error('getHistoricalData(symbol, range) not implemented');
  }

  async getEvents(symbol) {
    throw new Error('getEvents(symbol) not implemented');
  }

  async searchSymbols(query) {
    throw new Error('searchSymbols(query) not implemented');
  }

  async getBenchmarkPerformance() {
    throw new Error('getBenchmarkPerformance() not implemented');
  }
}

module.exports = MarketDataProvider;
