const { query } = require('../db/pool');

async function getWatchlists(req, res) {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT w.id, w.name, w.created_at, w.updated_at,
              COUNT(ws.id)::int AS stock_count
       FROM watchlists w
       LEFT JOIN watchlist_stocks ws ON w.id = ws.watchlist_id
       WHERE w.user_id = $1
       GROUP BY w.id
       ORDER BY w.created_at ASC`,
      [userId]
    );

    return res.status(200).json({
      watchlists: result.rows,
    });
  } catch (err) {
    console.error('[Get Watchlists Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve watchlists.' });
  }
}

async function createWatchlist(req, res) {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Watchlist name is required.' });
    }

    const trimmedName = name.trim();
    const result = await query(
      `INSERT INTO watchlists (user_id, name)
       VALUES ($1, $2)
       RETURNING id, name, created_at, updated_at`,
      [userId, trimmedName]
    );

    return res.status(201).json({
      watchlist: result.rows[0],
    });
  } catch (err) {
    console.error('[Create Watchlist Error]:', err);
    return res.status(500).json({ error: 'Failed to create watchlist.' });
  }
}

async function getWatchlistById(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const wlResult = await query(
      `SELECT id, name, created_at, updated_at
       FROM watchlists
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (wlResult.rows.length === 0) {
      return res.status(404).json({ error: 'Watchlist not found or unauthorized.' });
    }

    const stocksResult = await query(
      `SELECT id, symbol, added_at
       FROM watchlist_stocks
       WHERE watchlist_id = $1
       ORDER BY added_at ASC`,
      [id]
    );

    return res.status(200).json({
      watchlist: {
        ...wlResult.rows[0],
        stocks: stocksResult.rows,
      },
    });
  } catch (err) {
    console.error('[Get Watchlist By Id Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve watchlist details.' });
  }
}

async function updateWatchlist(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Watchlist name is required.' });
    }

    const result = await query(
      `UPDATE watchlists
       SET name = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, name, created_at, updated_at`,
      [name.trim(), id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Watchlist not found or unauthorized.' });
    }

    return res.status(200).json({
      watchlist: result.rows[0],
    });
  } catch (err) {
    console.error('[Update Watchlist Error]:', err);
    return res.status(500).json({ error: 'Failed to update watchlist.' });
  }
}

async function deleteWatchlist(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      `DELETE FROM watchlists
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Watchlist not found or unauthorized.' });
    }

    return res.status(200).json({
      message: 'Watchlist deleted successfully.',
    });
  } catch (err) {
    console.error('[Delete Watchlist Error]:', err);
    return res.status(500).json({ error: 'Failed to delete watchlist.' });
  }
}

async function addStock(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { symbol } = req.body;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Valid stock symbol is required.' });
    }

    const cleanSymbol = symbol.toUpperCase().trim();
    if (!/^[A-Z]{1,8}$/.test(cleanSymbol)) {
      return res.status(400).json({ error: 'Stock symbol must be 1-8 letters (e.g. NVDA).' });
    }

    // Verify watchlist ownership
    const wl = await query(
      'SELECT id FROM watchlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (wl.rows.length === 0) {
      return res.status(404).json({ error: 'Watchlist not found or unauthorized.' });
    }

    // Check duplicate
    const existing = await query(
      'SELECT id FROM watchlist_stocks WHERE watchlist_id = $1 AND symbol = $2',
      [id, cleanSymbol]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: `Symbol ${cleanSymbol} is already in this watchlist.` });
    }

    const result = await query(
      `INSERT INTO watchlist_stocks (watchlist_id, symbol)
       VALUES ($1, $2)
       RETURNING id, watchlist_id, symbol, added_at`,
      [id, cleanSymbol]
    );

    return res.status(201).json({
      stock: result.rows[0],
    });
  } catch (err) {
    console.error('[Add Stock Error]:', err);
    return res.status(500).json({ error: 'Failed to add stock to watchlist.' });
  }
}

async function removeStock(req, res) {
  try {
    const userId = req.user.id;
    const { id, symbol } = req.params;

    const cleanSymbol = symbol.toUpperCase().trim();

    // Verify watchlist ownership
    const wl = await query(
      'SELECT id FROM watchlists WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (wl.rows.length === 0) {
      return res.status(404).json({ error: 'Watchlist not found or unauthorized.' });
    }

    const result = await query(
      `DELETE FROM watchlist_stocks
       WHERE watchlist_id = $1 AND symbol = $2
       RETURNING id, symbol`,
      [id, cleanSymbol]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Symbol ${cleanSymbol} not found in this watchlist.` });
    }

    return res.status(200).json({
      message: `Symbol ${cleanSymbol} removed from watchlist.`,
    });
  } catch (err) {
    console.error('[Remove Stock Error]:', err);
    return res.status(500).json({ error: 'Failed to remove stock from watchlist.' });
  }
}

module.exports = {
  getWatchlists,
  createWatchlist,
  getWatchlistById,
  updateWatchlist,
  deleteWatchlist,
  addStock,
  removeStock,
};
