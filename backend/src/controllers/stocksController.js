const marketDataService = require('../services/market/MarketDataService');
const checkpointService = require('../services/checkpointService');
const changeEngine = require('../services/engine/MeaningfulChangeEngine');

/**
 * GET /api/stocks/:symbol
 * Detailed stock quote with checkpoint comparison & change intelligence
 */
async function getStockDetail(req, res) {
  try {
    const { symbol } = req.params;
    const cleanSym = symbol.toUpperCase().trim();
    const userId = req.user ? req.user.id : null;

    const quote = await marketDataService.getQuote(cleanSym);
    const events = await marketDataService.getEvents(cleanSym);
    const benchmark = await marketDataService.getBenchmarkPerformance();

    let checkpoint = null;
    if (userId) {
      checkpoint = await checkpointService.getStockCheckpoint(userId, cleanSym);
    }

    const evaluated = changeEngine.evaluate({
      quote,
      checkpoint,
      events,
      benchmark,
    });

    return res.status(200).json({
      stock: evaluated,
      events,
      benchmark,
    });
  } catch (err) {
    console.error('[Get Stock Detail Error]:', err);
    return res.status(500).json({ error: `Failed to fetch details for ${req.params.symbol}.` });
  }
}

/**
 * GET /api/stocks/:symbol/changes
 * In-depth signals and why-it-matters explanation
 */
async function getStockChanges(req, res) {
  try {
    const { symbol } = req.params;
    const cleanSym = symbol.toUpperCase().trim();
    const userId = req.user ? req.user.id : null;

    const quote = await marketDataService.getQuote(cleanSym);
    const events = await marketDataService.getEvents(cleanSym);
    const benchmark = await marketDataService.getBenchmarkPerformance();

    let checkpoint = null;
    if (userId) {
      checkpoint = await checkpointService.getStockCheckpoint(userId, cleanSym);
    }

    const evaluated = changeEngine.evaluate({
      quote,
      checkpoint,
      events,
      benchmark,
    });

    return res.status(200).json({
      symbol: cleanSym,
      attentionScore: evaluated.attentionScore,
      severity: evaluated.severity,
      scoreBreakdown: evaluated.scoreBreakdown,
      signals: evaluated.signals,
      reasons: evaluated.reasons,
      checkpoint: checkpoint || null,
      currentQuote: quote,
    });
  } catch (err) {
    console.error('[Get Stock Changes Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch change analysis.' });
  }
}

/**
 * GET /api/stocks/:symbol/history?range=1D|1W|1M|1Y
 */
async function getStockHistory(req, res) {
  try {
    const { symbol } = req.params;
    const { range = '1D' } = req.query;

    const history = await marketDataService.getHistoricalData(symbol, range);
    return res.status(200).json(history);
  } catch (err) {
    console.error('[Get Stock History Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch stock history.' });
  }
}

/**
 * GET /api/stocks/search?q=...
 * Searches across live API and 150+ stock catalog
 */
async function searchStocks(req, res) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(200).json({ results: [] });
    }

    const results = await marketDataService.searchSymbols(q);
    return res.status(200).json({ results });
  } catch (err) {
    console.error('[Search Stocks Error]:', err);
    return res.status(500).json({ error: 'Failed to search stocks.' });
  }
}

const { query } = require('../db/pool');

/**
 * POST /api/market/scenario
 * Toggle between demo, quiet, and volatile scenarios
 */
async function setScenario(req, res) {
  try {
    const { scenario } = req.body;
    if (!['demo', 'quiet', 'volatile'].includes(scenario)) {
      return res.status(400).json({ error: "Invalid scenario. Choose from 'demo', 'quiet', or 'volatile'." });
    }

    marketDataService.setScenario(scenario);

    // Reset user checkpoints in database to match the scenario's calibrated baseline
    const catalog = marketDataService.mockProvider.getMockCatalog();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    for (const [sym, stock] of Object.entries(catalog)) {
      const scData = stock.scenarios[scenario] || stock.scenarios.demo;
      if (scData.checkpointPrice) {
        await query(
          `UPDATE user_checkpoints
           SET price = $1, volume = $2, timestamp = $3
           WHERE symbol = $4`,
          [scData.checkpointPrice, scData.checkpointVolume || 30000000, twoHoursAgo, sym]
        );
      }
    }

    return res.status(200).json({
      message: `Scenario switched to '${scenario}'. Checkpoints synchronized.`,
      scenario,
    });
  } catch (err) {
    console.error('[Set Scenario Error]:', err);
    return res.status(500).json({ error: 'Failed to set scenario.' });
  }
}

/**
 * GET /api/market/scenario
 */
async function getScenario(req, res) {
  return res.status(200).json(marketDataService.getProviderMode());
}

/**
 * POST /api/market/provider
 * Switch between 'live' (Real-time Yahoo Finance) and 'mock' (Deterministic Demo)
 */
async function setProviderMode(req, res) {
  try {
    const { mode } = req.body;
    if (!['live', 'mock'].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode. Choose 'live' or 'mock'." });
    }

    marketDataService.setProviderMode(mode);
    return res.status(200).json({
      message: `Market data provider mode switched to '${mode}'.`,
      ...marketDataService.getProviderMode(),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to set provider mode.' });
  }
}

/**
 * POST /api/market/status
 * Toggle data status between LIVE, DELAYED, STALE, UNAVAILABLE
 */
async function setDataStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['LIVE', 'DELAYED', 'STALE', 'UNAVAILABLE'].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Choose from 'LIVE', 'DELAYED', 'STALE', 'UNAVAILABLE'." });
    }

    marketDataService.setDataStatus(status);
    return res.status(200).json({
      message: `Market data status set to '${status}'.`,
      status,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to set data status.' });
  }
}

module.exports = {
  getStockDetail,
  getStockChanges,
  getStockHistory,
  searchStocks,
  setScenario,
  getScenario,
  setProviderMode,
  setDataStatus,
};
