const { query } = require('../db/pool');

class CheckpointService {
  /**
   * Retrieve previous user checkpoints for a specific watchlist.
   * Returns a dictionary keyed by uppercase symbol.
   */
  async getUserCheckpoints(userId, watchlistId) {
    const res = await query(
      `SELECT symbol, price, volume, timestamp
       FROM user_checkpoints
       WHERE user_id = $1 AND watchlist_id = $2`,
      [userId, watchlistId]
    );

    const checkpoints = {};
    let latestTimestamp = null;

    for (const row of res.rows) {
      const sym = row.symbol.toUpperCase();
      const ts = new Date(row.timestamp);
      if (!latestTimestamp || ts > latestTimestamp) {
        latestTimestamp = ts;
      }

      checkpoints[sym] = {
        symbol: sym,
        price: Number(row.price),
        volume: Number(row.volume),
        timestamp: row.timestamp,
      };
    }

    return {
      checkpoints,
      lastCheckedAt: latestTimestamp ? latestTimestamp.toISOString() : null,
    };
  }

  /**
   * Update or initialize user checkpoints for a watchlist with current quote state.
   * Only called AFTER differences have been processed or on explicit user checkpoint confirmation.
   */
  async updateWatchlistCheckpoints(userId, watchlistId, quotes) {
    const now = new Date();
    const updated = [];

    for (const q of quotes) {
      const res = await query(
        `INSERT INTO user_checkpoints (user_id, watchlist_id, symbol, price, volume, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, watchlist_id, symbol)
         DO UPDATE SET
           price = EXCLUDED.price,
           volume = EXCLUDED.volume,
           timestamp = EXCLUDED.timestamp
         RETURNING symbol, price, volume, timestamp`,
        [userId, watchlistId, q.symbol.toUpperCase(), q.price, q.volume, now]
      );
      updated.push(res.rows[0]);
    }

    return {
      updatedCount: updated.length,
      checkpointTimestamp: now.toISOString(),
    };
  }

  /**
   * Get single checkpoint for stock
   */
  async getStockCheckpoint(userId, symbol) {
    const res = await query(
      `SELECT symbol, price, volume, timestamp, watchlist_id
       FROM user_checkpoints
       WHERE user_id = $1 AND symbol = $2
       ORDER BY timestamp DESC
       LIMIT 1`,
      [userId, symbol.toUpperCase()]
    );

    if (res.rows.length === 0) return null;
    return {
      symbol: res.rows[0].symbol,
      price: Number(res.rows[0].price),
      volume: Number(res.rows[0].volume),
      timestamp: res.rows[0].timestamp,
      watchlistId: res.rows[0].watchlist_id,
    };
  }
}

module.exports = new CheckpointService();
