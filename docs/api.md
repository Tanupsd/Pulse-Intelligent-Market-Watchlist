# Pulse REST API Specification

Base URL: `http://localhost:5000/api`

## Authentication Header
All protected endpoints require a valid JWT token:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication

### `POST /api/auth/register`
Create a new user account. Automatically creates a default starter watchlist.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Account created successfully.",
    "user": {
      "id": "eea6ffb2-8c3f-4af9-8cb9-9448f76ded9f",
      "email": "user@example.com",
      "created_at": "2026-09-04T08:15:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### `POST /api/auth/login`
Authenticate user with email and password.
- **Request Body**:
  ```json
  {
    "email": "demo@example.com",
    "password": "password123"
  }
  ```
- **Response (200 OK)**: Returns user object and JWT token.

### `GET /api/auth/me` [Protected]
Retrieve the profile of the authenticated user.

---

## 2. Watchlists

### `GET /api/watchlists` [Protected]
List all watchlists belonging to the current user with stock counts.

### `POST /api/watchlists` [Protected]
Create a new watchlist.
- **Request Body**: `{ "name": "AI & Tech" }`

### `GET /api/watchlists/:id` [Protected]
Retrieve single watchlist with stock tickers. Enforces user isolation.

### `PUT /api/watchlists/:id` [Protected]
Rename a watchlist.

### `DELETE /api/watchlists/:id` [Protected]
Delete a watchlist and associated checkpoints/stocks.

### `POST /api/watchlists/:id/stocks` [Protected]
Add stock symbol to watchlist.
- **Request Body**: `{ "symbol": "NVDA" }`
- **Response (201 Created)**: Returns inserted stock record. Prevents duplicates with 409 Conflict.

### `DELETE /api/watchlists/:id/stocks/:symbol` [Protected]
Remove stock symbol from watchlist.

---

## 3. Dashboard Summary & Checkpoints

### `GET /api/watchlists/:id/summary` [Protected]
The primary dashboard endpoint. Compares current state against user checkpoints, calculates Attention Scores, and returns stocks ranked by attention priority.
- **Response (200 OK)**:
  ```json
  {
    "watchlist": {
      "id": "528574d7-466d-4952-bda5-7975d045d61f",
      "name": "My Watchlist"
    },
    "lastCheckedAt": "2026-09-04T06:15:00.000Z",
    "meaningfulChanges": 3,
    "attention": {
      "critical": 1,
      "important": 1,
      "watch": 1,
      "normal": 2
    },
    "benchmark": {
      "symbol": "SPY",
      "name": "S&P 500 Index ETF",
      "changePercent": -1.0,
      "price": 555.2
    },
    "stocks": [
      {
        "symbol": "NVDA",
        "name": "NVIDIA Corporation",
        "price": 184.32,
        "dailyChange": -4.8,
        "sinceLastCheck": -4.8,
        "hasCheckpoint": true,
        "checkpointPrice": 193.61,
        "attentionScore": 88,
        "severity": "CRITICAL",
        "isMeaningful": true,
        "scoreBreakdown": {
          "priceMovement": 40,
          "volumeAnomaly": 18,
          "marketEvent": 20,
          "relativePerformance": 10,
          "total": 88
        },
        "reasons": [
          {
            "type": "PRICE",
            "text": "Price fell 4.8% since your last check (major movement).",
            "metric": "-4.8%"
          },
          {
            "type": "VOLUME",
            "text": "Trading volume is 2.1× the recent average (unusual activity).",
            "metric": "2.1× avg"
          },
          {
            "type": "EVENT",
            "text": "Event detected: Department of Justice expands semiconductor antitrust inquiry",
            "metric": "HIGH (REGULATORY)"
          }
        ],
        "dataStatus": "LIVE"
      }
    ]
  }
  ```

### `POST /api/watchlists/:id/checkpoint` [Protected]
Advances/acknowledges the user checkpoint to current market quotes.
- **Response (200 OK)**:
  ```json
  {
    "message": "Checkpoint successfully updated.",
    "updatedCount": 5,
    "checkpointTimestamp": "2026-09-04T08:20:00.000Z"
  }
  ```

---

## 4. Stock Details & Analysis

### `GET /api/stocks/:symbol` [Optional Auth]
Returns detailed stock quote, checkpoint comparison, change intelligence, and relevant events.

### `GET /api/stocks/:symbol/changes` [Optional Auth]
Returns transparent signal decomposition, confidence levels, and non-causal explanation reasons.

### `GET /api/stocks/:symbol/history?range=1D|1W|1M|1Y`
Returns time series points for interactive charts:
```json
{
  "symbol": "NVDA",
  "range": "1D",
  "points": [
    { "timestamp": "2026-09-04T07:00:00Z", "timeLabel": "07:00 AM", "price": 193.61, "volume": 3500000 },
    { "timestamp": "2026-09-04T08:00:00Z", "timeLabel": "08:00 AM", "price": 184.32, "volume": 84000000 }
  ]
}
```

### `GET /api/stocks/search?q=NVDA`
Instant symbol lookup across supported stock catalog.

---

## 5. Market Scenario Controls (Demo / Testing)

### `GET /api/market/scenario`
Returns current scenario (`demo`, `quiet`, `volatile`) and data status.

### `POST /api/market/scenario`
Toggle market scenario on the fly:
```json
{ "scenario": "quiet" }
```

### `POST /api/market/status`
Toggle market data status for stale/delayed testing:
```json
{ "status": "STALE" }
```

---

## 6. User Profile, Security & Telemetry [Protected]

### `GET /api/users/me`
Retrieve profile details (`id`, `name`, `phone`, `email`, `created_at`, `updated_at`).

### `PUT /api/users/me`
Update profile details (`name`, `phone`, `email`). Enforces RFC email format and checks for email uniqueness across accounts.

### `PUT /api/users/me/password`
Update password. Verifies `currentPassword` with bcrypt before accepting new password (minimum 6 characters).
```json
{
  "currentPassword": "password123",
  "newPassword": "newSecurePassword456"
}
```

### `POST /api/users/me/stock-visits`
Record a user view event on a stock ticker. Includes an automatic 60-second cooldown deduplication window.
```json
{ "symbol": "NVDA" }
```

### `GET /api/users/me/analytics`
Retrieve aggregated interaction frequency per symbol and total visit count:
```json
{
  "analytics": [
    { "symbol": "NVDA", "visits": 18, "last_visited": "2026-09-04T09:12:00Z" },
    { "symbol": "AAPL", "visits": 14, "last_visited": "2026-09-04T08:45:00Z" }
  ],
  "totalVisits": 32
}
```

---

## 7. Public Market Rankings & Stock Comparison

### `GET /api/market/top-performers?limit=5&offset=0`
Public endpoint returning equities sorted strictly descending by percentage gain (`changePercent`). Supports pagination for asynchronous loading.

### `GET /api/market/top-losers?limit=5&offset=0`
Public endpoint returning equities sorted strictly ascending by percentage loss (`changePercent`). Supports pagination for asynchronous loading.

### `GET /api/stocks/compare?symbols=AAPL,NVDA&range=1M`
Public side-by-side comparison endpoint for 2 to 5 stocks. Returns current quotes, period return %, 52-week ranges, PE ratios, and historical curve points.

