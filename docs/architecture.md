# Pulse System Architecture Document

## 1. Architectural Principles

Pulse is built around four core architectural pillars:
1. **Stateless Backend**: All HTTP requests are authenticated via self-contained JWT tokens. Backend nodes can scale horizontally behind any load balancer with zero sticky-session requirement.
2. **Batch-Oriented Market Ingestion**: The API avoids N+1 query patterns by fetching quotes, events, and checkpoints in single batch operations (`MarketDataService.getQuotes(symbols)`).
3. **Graceful Fallback & Degradation**: Market data cascades through Primary Provider $\rightarrow$ Secondary Provider $\rightarrow$ Database Snapshot Cache. Data staleness is tracked explicitly with status flags (`LIVE`, `DELAYED`, `STALE`, `UNAVAILABLE`).
4. **Relational Consistency**: PostgreSQL manages strict referential integrity between users, watchlists, checkpoints, and market events.

---

## 2. High-Level System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    React Client (Vite)                      │
│      Tailwind CSS • Recharts • Lucide • React Router        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js API Layer                     │
│    JWT Auth • Rate Limiter • Helmet • Centralized Errors    │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│  Meaningful Change Engine   │ │     MarketDataService       │
│  - Price signal calculation │ │  - Primary: Mock Provider   │
│  - Volume anomaly detection │ │  - Secondary: Extensible    │
│  - Event recency scoring    │ │  - Snapshot Caching & Status│
│  - Benchmark decoupling     │ │    (LIVE, DELAYED, STALE)   │
└──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │
               └───────────────┬───────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                     │
│  users • watchlists • watchlist_stocks • market_snapshots   │
│   user_checkpoints • market_events • detected_changes       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema & Indexing Optimization

To ensure $O(\log N)$ lookups even with hundreds of thousands of users and market observations, the schema employs composite B-tree indexes:

```sql
-- Fast user lookup for authentication
CREATE INDEX idx_users_email ON users(email);

-- Rapid retrieval of all user watchlists
CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);

-- Prevents duplicate tickers & ensures quick stock joins
CREATE INDEX idx_watchlist_stocks_lookup ON watchlist_stocks(watchlist_id, symbol);

-- Snapshot cache lookups by symbol ordered by latest timestamp
CREATE INDEX idx_market_snapshots_symbol_time ON market_snapshots(symbol, timestamp DESC);

-- O(1) checkpoint lookups per user and watchlist
CREATE INDEX idx_user_checkpoints_lookup ON user_checkpoints(user_id, watchlist_id, symbol);

-- Chronological event timeline filtering
CREATE INDEX idx_market_events_symbol_time ON market_events(symbol, timestamp DESC);
```

---

## 4. Scalability & Performance Considerations

### Avoiding N+1 Query Traps
In typical naive implementations, generating a summary of 10 stocks issues 10 individual quote requests and 10 individual checkpoint queries. In Pulse:
- `watchlist_stocks` symbols are fetched in one query.
- Quotes are requested in a single batch call (`getQuotes(symbols)`).
- Checkpoints are loaded in a single query:
  `SELECT * FROM user_checkpoints WHERE user_id = $1 AND watchlist_id = $2;`
- Events are loaded via grouped index lookups.

### Caching Strategy (In-Memory & Redis Roadmap)
For local development and MVP evaluation:
- In-memory provider catalog avoids unnecessary external network calls.
- Historical snapshots in PostgreSQL serve as fallback when external providers fail.

**Production Redis Roadmap:**
For production deployments exceeding 10,000 requests per minute:
```text
Client Request
      ↓
Check Redis: `quotes:${symbol}` (TTL: 15 seconds)
      ├── Cache Hit  → Return instantly (~1ms)
      └── Cache Miss → Ingest from Provider → Set Redis → Save DB Snapshot Async
```

### Background Refresh Pattern (`MarketRefreshService`)
Rather than forcing user requests to block on market ingestion, a scheduled interval service (or BullMQ/Redis worker) polls symbols active in user watchlists every 60 seconds and updates `market_snapshots`. When the user visits, the API reads already-warmed data.

---

## 5. Interaction Telemetry & Analytics Architecture

### Low-Overhead Event Logging
To track research engagement without degrading response latency:
- User stock views trigger `POST /api/users/me/stock-visits`.
- **Deduplication Cooldown**: An SQL index-backed subquery verifies whether a view for `(user_id, symbol)` occurred within the previous 60 seconds:
  ```sql
  SELECT id FROM stock_visits 
  WHERE user_id = $1 AND symbol = $2 AND visited_at > NOW() - INTERVAL '60 seconds' 
  LIMIT 1;
  ```
- If within the cooldown window, insertion is omitted, eliminating spurious telemetry from React re-renders or tab switches.

### Server-Side Analytics Aggregation
Rather than computing frequencies in client JavaScript, PostgreSQL leverages the composite index `idx_stock_visits_user_symbol` to aggregate counts directly in the database engine:
```sql
SELECT 
  symbol, 
  COUNT(*)::int AS visits,
  MAX(visited_at) AS last_visited
FROM stock_visits
WHERE user_id = $1
GROUP BY symbol
ORDER BY visits DESC, last_visited DESC
LIMIT 10;
```
This guarantees $O(\log N)$ scan efficiency and sub-millisecond execution times.

---

## 6. Public Stock Comparison & Market Movers Architecture

### Zero-Friction Public Market Engine
- **Decoupled Security**: Market Movers (`/top-performers`, `/top-losers`) and Stock Comparison (`/compare`) require no authentication.
- **Normalized Multi-Asset Returns**: To compare diverse equities (e.g. AAPL at \$240 and NVDA at \$184) on a single chart, the system normalizes each asset's historical curve:
  $$\text{Normalized Return}_t = \left( \frac{\text{Price}_t - \text{Price}_0}{\text{Price}_0} \right) \times 100\%$$
  This yields a unified relative gain/loss baseline across 1D, 1W, 1M, and 1Y horizons.

