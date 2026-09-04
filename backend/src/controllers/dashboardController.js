const { query } = require('../db/pool');
const marketDataService = require('../services/market/MarketDataService');
const checkpointService = require('../services/checkpointService');
const changeEngine = require('../services/engine/MeaningfulChangeEngine');

/**
 * Primary Dashboard Endpoint
 * GET /api/watchlists/:id/summary
 */
async function getWatchlistSummary(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // 1. Verify watchlist ownership
    const wlResult = await query(
      'SELECT id, name, created_at, updated_at FROM watchlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (wlResult.rows.length === 0) {
      return res.status(404).json({ error: 'Watchlist not found or unauthorized.' });
    }
    const watchlist = wlResult.rows[0];

    // 2. Fetch stocks in watchlist
    const stockRows = await query(
      'SELECT symbol FROM watchlist_stocks WHERE watchlist_id = $1 ORDER BY added_at ASC',
      [id]
    );
    const symbols = stockRows.rows.map(r => r.symbol);

    if (symbols.length === 0) {
      return res.status(200).json({
        watchlist,
        lastCheckedAt: null,
        meaningfulChanges: 0,
        attention: { critical: 0, important: 0, watch: 0, normal: 0 },
        stocks: [],
      });
    }

    // 3. Batch fetch current market quotes
    const quotes = await marketDataService.getQuotes(symbols);

    // 4. Fetch user checkpoints
    const { checkpoints, lastCheckedAt } = await checkpointService.getUserCheckpoints(userId, id);

    // 5. Fetch events for symbols
    const eventsBySymbol = {};
    await Promise.all(
      symbols.map(async (sym) => {
        eventsBySymbol[sym] = await marketDataService.getEvents(sym);
      })
    );

    // 6. Fetch benchmark index performance
    const benchmark = await marketDataService.getBenchmarkPerformance();

    // 7. Change Engine: Rank & Evaluate
    const evaluation = changeEngine.rankWatchlistChanges({
      quotes,
      checkpoints,
      eventsBySymbol,
      benchmark,
    });

    return res.status(200).json({
      watchlist: {
        id: watchlist.id,
        name: watchlist.name,
        createdAt: watchlist.created_at,
        updatedAt: watchlist.updated_at,
      },
      lastCheckedAt,
      meaningfulChanges: evaluation.meaningfulChanges,
      attention: evaluation.attention,
      benchmark,
      scenario: marketDataService.getScenario(),
      stocks: evaluation.stocks,
    });
  } catch (err) {
    console.error('[Watchlist Summary Error]:', err);
    return res.status(500).json({ error: 'Failed to generate watchlist summary.' });
  }
}

/**
 * Acknowledge / Advance Checkpoint
 * POST /api/watchlists/:id/checkpoint
 */
async function updateWatchlistCheckpoint(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const wlResult = await query(
      'SELECT id FROM watchlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (wlResult.rows.length === 0) {
      return res.status(404).json({ error: 'Watchlist not found or unauthorized.' });
    }

    const stockRows = await query(
      'SELECT symbol FROM watchlist_stocks WHERE watchlist_id = $1',
      [id]
    );
    const symbols = stockRows.rows.map(r => r.symbol);

    if (symbols.length === 0) {
      return res.status(200).json({ message: 'No stocks in watchlist to update.' });
    }

    const quotes = await marketDataService.getQuotes(symbols);
    const result = await checkpointService.updateWatchlistCheckpoints(userId, id, quotes);

    return res.status(200).json({
      message: 'Checkpoint successfully updated.',
      ...result,
    });
  } catch (err) {
    console.error('[Update Checkpoint Error]:', err);
    return res.status(500).json({ error: 'Failed to update checkpoint.' });
  }
}

module.exports = {
  getWatchlistSummary,
  updateWatchlistCheckpoint,
};
