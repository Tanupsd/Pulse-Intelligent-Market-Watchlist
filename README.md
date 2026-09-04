# Pulse — Smart Market Watchlist

> **A normal watchlist tells users what their stocks are doing. Pulse tells users what meaningfully changed while they were away.**

[![CODE 2026 Hackathon](https://img.shields.io/badge/CODE_2026-Hackathon_MVP-6366F1)](https://github.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v22-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16%2B-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-57_Passing-success)](https://jestjs.io/)

---

## 1. Product Vision

Every trading day, investors are bombarded by ticker grids showing dozens of blinking red and green numbers. Traditional watchlists answer only one superficial question: *"What is the stock price right now?"*

**Pulse answers three essential questions:**
1. **What changed?** (Delta between current market state and the user's prior checkpoint)
2. **Why does it matter?** (Correlated signals: volume anomalies, major events, benchmark decoupling)
3. **What deserves my attention right now?** (Deterministic Attention Scoring and ranked prioritization)

```text
User opens Pulse
        ↓
System knows when they last checked
        ↓
Fetch current market state
        ↓
Compare current state with previous checkpoint
        ↓
Detect meaningful changes
        ↓
Rank changes by attention score
        ↓
Show user only the changes worth noticing
```

---

## 2. Live Demo Credentials

For instant evaluation, the database is pre-seeded with a realistic market scenario:

| Field | Value |
| :--- | :--- |
| **Email** | `demo@example.com` |
| **Password** | `password123` |
| **Quick Action** | Click **"Fill Demo"** on the login screen for instant 1-click access |

### The Demo Scenario:
When logging in as the demo user, the dashboard immediately reveals:
- **"3 meaningful changes since your last check"**
- 🔴 **NVIDIA (NVDA)**: **Ranked #1 (Attention Score: 88, CRITICAL)**
  - Dropped **-4.8%** since previous checkpoint ($193.61 $\rightarrow$ $184.32$)
  - Volume surged to **2.1×** 30-day average
  - High-importance antitrust regulatory inquiry detected
- 🟡 **AMD**: **WATCH / IMPORTANT (Attention Score: 53)**
  - Gained **+2.3%** on **2.5×** average volume
- 🟢 **Apple (AAPL)**: **NORMAL (Attention Score: 0)**
  - Quiet drift (+0.4%), no anomalies
- **Scenario Toggle**: Click the scenario pill in the navbar (`Demo` | `Quiet` | `Volatile`) to test dynamic market states!

---

## 3. Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React
- **Backend**: Node.js, Express.js, PostgreSQL (`pg`), JWT Auth, bcryptjs, Helmet, Morgan, CORS
- **Testing**: Jest & Supertest (Backend), Vitest & React Testing Library (Frontend)
- **Infrastructure**: Docker, Docker Compose, PostgreSQL 16/18

---

## 4. Architecture Diagram

```text
                               ┌────────────────────────────────┐
                               │       Frontend (React/Vite)    │
                               │  Tailwind, Lucide, Recharts    │
                               └───────────────┬────────────────┘
                                               │ HTTP / REST
                                               ▼
                               ┌────────────────────────────────┐
                               │       Express.js Backend       │
                               │  Auth, Routes, Rate Limiting   │
                               └───────────────┬────────────────┘
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               ▼                                                               ▼
┌─────────────────────────────┐                                ┌───────────────────────────────┐
│   Meaningful Change Engine  │                                │      MarketDataService        │
│  - Price signal (max 40)    │                                │  - MockMarketDataProvider     │
│  - Volume anomaly (max 25)  │                                │  - RealProvider extensible    │
│  - Events & recency (max 25)│                                │  - Caching & Data Status:     │
│  - Rel. performance (max 10)│                                │    LIVE, DELAYED, STALE       │
└──────────────┬──────────────┘                                └───────────────┬───────────────┘
               │                                                               │
               └───────────────────────────────┬───────────────────────────────┘
                                               ▼
                               ┌────────────────────────────────┐
                               │      PostgreSQL Database       │
                               │  Users, Watchlists, Snapshots, │
                               │  Checkpoints, Events, Changes  │
                               └────────────────────────────────┘
```

---

## 5. Meaningful Change Algorithm

Attention Score is computed deterministically between **0 and 100 points**:

```text
Attention Score = Price Movement (max 40)
                + Volume Anomaly (max 25)
                + Market Events (max 25)
                + Benchmark Decoupling (max 10)
```

### Thresholds:
- **Price Delta**: $\ge 4.0\% \rightarrow 40\text{ pts}$, $2.5\% - 3.99\% \rightarrow 25\text{ pts}$, $1.0\% - 2.49\% \rightarrow 10\text{ pts}$
- **Volume Ratio**: $\ge 3.0\times \rightarrow 25\text{ pts}$, $2.0\times - 2.99\times \rightarrow 18\text{ pts}$, $1.5\times - 1.99\times \rightarrow 8\text{ pts}$
- **Market Events**: `CRITICAL` (25 pts), `HIGH` (20 pts), `MEDIUM` (10 pts) with time decay
- **Benchmark Decoupling**: $|\text{Stock} - \text{SPY}| \ge 3.0\% \rightarrow 10\text{ pts}$, $\ge 1.5\% \rightarrow 5\text{ pts}$

### Severity Tiers:
- **75 – 100**: 🔴 `CRITICAL`
- **50 – 74**: 🟠 `IMPORTANT`
- **25 – 49**: 🟡 `WATCH`
- **0 – 24**: 🟢 `NORMAL`

See full algorithmic documentation in [`docs/meaningful-changes.md`](docs/meaningful-changes.md).

---

## 6. Getting Started

### Option A: Docker Compose (Recommended)

Run the entire full-stack system with a single command:

```bash
docker compose up --build
```

- **Frontend**: [http://localhost:8080](http://localhost:8080)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **PostgreSQL**: `localhost:5432`

---

### Option B: Local Development

#### Prerequisites:
- Node.js 18+
- PostgreSQL 14+ running locally

#### 1. Database Setup:
```bash
# In backend/.env ensure your DB credentials match:
# DB_HOST=127.0.0.1, DB_PORT=5432 (or 5433), DB_NAME=pulse, DB_USER=postgres
```

Run migrations and deterministic demo seed:
```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
```

#### 2. Start Backend:
```bash
npm run dev
# Server running at http://localhost:5000
```

#### 3. Start Frontend:
```bash
cd ../frontend
npm install
npm run dev
# Vite server running at http://localhost:5173
```

---

## 2.1 Public Experience vs. Authenticated Experience

### Public Experience (Zero Friction, No Login Required):
- **Home / Landing (`/`)**:
  - Live **Market Movers**: Top 5 Performers & Top 5 Losers ranked strictly by daily percentage change.
  - Asynchronous **"View More"** loading 50 additional global stocks without page reloads.
  - Inline **Get Started / Quick Login** hero card with 1-click demo access.
- **Stock Comparison (`/compare`)**:
  - Side-by-side comparison defaulting to `AAPL` vs `NVDA`.
  - **"+ Add Stock"** action supporting up to 5 concurrent assets with clean horizontal scrolling.
  - Normalized % Return performance curves over 1D, 1W, 1M, and 1Y ranges via Recharts.
- **Watchlists Preview**:
  - Clicking "Watchlists" when logged out opens an informative **Auth Prompt Modal** explaining checkpoints rather than an abrupt error.

### Authenticated Experience:
- **Personal Checkpoints & Meaningful Changes (`/dashboard`)**:
  - Full "Since Your Last Check" telemetry, Attention Scores (0–100), and non-causal explanation modals.
- **Account & Analytics (`/profile`)**:
  - Edit personal details (Name, Phone, Email) with collision validation.
  - Secure password changes with current password bcrypt verification.
  - **Most Visited Stocks**: Server-side telemetry aggregated via PostgreSQL (`COUNT(*) ... GROUP BY symbol`) visualized with a Recharts bar chart.
  - Automatic 60-second cooldown deduplication on stock visit logging.

---

## 7. Running Tests

### Backend Tests (40 Tests: Unit, Integration & Enhancements):
```bash
cd backend
npm test
```
Tests cover:
- Meaningful Change Engine unit calculations & scoring weights
- Missing checkpoint / first visit handling
- Stale data detection
- User isolation (User A cannot access User B watchlists or analytics)
- Full API authentication and watchlist CRUD workflows
- User Profile update and validation (duplicate email prevention)
- Password update with bcrypt verification
- Stock visit deduplication & PostgreSQL analytics aggregation
- Market rankings sorting & pagination (Top Performers & Losers)
- Public stock comparison endpoint

### Frontend Tests (17 Tests: RTL & Vitest):
```bash
cd frontend
npm test -- --run
```
Tests cover:
- Attention badges (CRITICAL, IMPORTANT, WATCH, NORMAL)
- DataStatusPill with stale and delayed warnings
- StockCard with "Since Last Check" delta
- WhyChangedModal interactive signal explanation
- AuthPromptModal checkpoint explanation and navigation
- Public Navbar links and authenticated user controls
- HomePage hero value proposition and live rankings
- Public ComparisonPage side-by-side fundamentals and charts
- ProfilePage user information form, password update, and analytics chart

---

## 8. Financial Disclaimer

Market information displayed in Pulse is for informational purposes only and may be delayed. Pulse does not provide financial advice, trading execution, or investment recommendations.
