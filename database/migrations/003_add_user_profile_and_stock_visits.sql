-- Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

-- Create stock_visits table for tracking user views and analytics
CREATE TABLE IF NOT EXISTS stock_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient analytics queries
CREATE INDEX IF NOT EXISTS idx_stock_visits_user_id ON stock_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_visits_symbol ON stock_visits(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_visits_visited_at ON stock_visits(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_visits_user_symbol ON stock_visits(user_id, symbol);
