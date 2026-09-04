-- Database performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_stocks_lookup ON watchlist_stocks(watchlist_id, symbol);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_symbol_time ON market_snapshots(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_checkpoints_lookup ON user_checkpoints(user_id, watchlist_id, symbol);
CREATE INDEX IF NOT EXISTS idx_market_events_symbol_time ON market_events(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_detected_changes_user_time ON detected_changes(user_id, watchlist_id, detected_at DESC);
