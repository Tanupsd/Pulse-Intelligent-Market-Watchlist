const path = require('path');
const bcrypt = require(path.join(__dirname, '../../backend/node_modules/bcryptjs'));
const { pool } = require('../../backend/src/db/pool');

async function runSeed() {
  console.log('[Seed] Starting database seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Clean existing data for clean idempotent seed
    console.log('[Seed] Truncating existing tables...');
    await client.query(`
      TRUNCATE TABLE 
        stock_visits,
        detected_changes,
        market_events,
        user_checkpoints,
        market_snapshots,
        watchlist_stocks,
        watchlists,
        users 
      CASCADE;
    `);

    // 2. Create demo user
    console.log('[Seed] Creating demo user...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, name, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, phone`,
      ['demo@example.com', passwordHash, 'Demo Investor', '+1 555 019 2834']
    );
    const userId = userRes.rows[0].id;
    console.log(`[Seed] Demo user created with ID: ${userId}`);

    // Also create a second user for user-isolation tests
    const user2Res = await client.query(
      `INSERT INTO users (email, password_hash, name, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email`,
      ['other@example.com', passwordHash, 'Other User', '+1 555 019 9999']
    );
    const user2Id = user2Res.rows[0].id;

    // 3. Create primary watchlist
    console.log('[Seed] Creating watchlists...');
    const watchlistRes = await client.query(
      `INSERT INTO watchlists (user_id, name)
       VALUES ($1, $2)
       RETURNING id, name`,
      [userId, 'My Watchlist']
    );
    const watchlistId = watchlistRes.rows[0].id;

    // Secondary watchlist for demo user
    await client.query(
      `INSERT INTO watchlists (user_id, name)
       VALUES ($1, $2)`,
      [userId, 'Tech Titans']
    );

    // Watchlist for other user to test isolation
    await client.query(
      `INSERT INTO watchlists (user_id, name)
       VALUES ($1, $2)`,
      [user2Id, 'Private Watchlist']
    );

    // 4. Add stocks to primary watchlist
    const symbols = ['NVDA', 'AMD', 'AAPL', 'MSFT', 'TSLA'];
    for (const sym of symbols) {
      await client.query(
        `INSERT INTO watchlist_stocks (watchlist_id, symbol)
         VALUES ($1, $2)`,
        [watchlistId, sym]
      );
    }
    console.log(`[Seed] Added ${symbols.length} stocks to watchlist.`);

    // 5. Seed user checkpoints (from 2 hours ago)
    console.log('[Seed] Seeding previous checkpoints (2 hours ago)...');
    const checkpointTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

    const checkpointData = [
      { symbol: 'NVDA', price: 193.61, volume: 40000000 },
      { symbol: 'AMD',  price: 158.75, volume: 26000000 },
      { symbol: 'AAPL', price: 240.24, volume: 48000000 },
      { symbol: 'MSFT', price: 445.50, volume: 22000000 },
      { symbol: 'TSLA', price: 228.10, volume: 55000000 },
    ];

    for (const cp of checkpointData) {
      await client.query(
        `INSERT INTO user_checkpoints (user_id, watchlist_id, symbol, price, volume, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, watchlistId, cp.symbol, cp.price, cp.volume, checkpointTimestamp]
      );
    }

    // 6. Seed Current Market Snapshots
    console.log('[Seed] Seeding market snapshots...');
    const currentSnapshots = [
      {
        symbol: 'NVDA',
        price: 184.32,
        change_percent: -4.80,
        volume: 84000000,
        market_cap: 4520000000000,
        source: 'MOCK_PRIMARY',
        data_status: 'LIVE'
      },
      {
        symbol: 'AMD',
        price: 162.41,
        change_percent: 2.30,
        volume: 65000000,
        market_cap: 263000000000,
        source: 'MOCK_PRIMARY',
        data_status: 'LIVE'
      },
      {
        symbol: 'AAPL',
        price: 241.20,
        change_percent: 0.40,
        volume: 43200000,
        market_cap: 3680000000000,
        source: 'MOCK_PRIMARY',
        data_status: 'LIVE'
      },
      {
        symbol: 'MSFT',
        price: 448.18,
        change_percent: 0.60,
        volume: 21800000,
        market_cap: 3330000000000,
        source: 'MOCK_PRIMARY',
        data_status: 'LIVE'
      },
      {
        symbol: 'TSLA',
        price: 220.80,
        change_percent: -3.20,
        volume: 72000000,
        market_cap: 704000000000,
        source: 'MOCK_PRIMARY',
        data_status: 'LIVE'
      },
      {
        symbol: 'AMZN',
        price: 188.90,
        change_percent: 1.10,
        volume: 38000000,
        market_cap: 1960000000000,
        source: 'MOCK_PRIMARY',
        data_status: 'LIVE'
      },
      {
        symbol: 'GOOGL',
        price: 165.40,
        change_percent: -0.80,
        volume: 25000000,
        market_cap: 2050000000000,
        source: 'MOCK_PRIMARY',
        data_status: 'LIVE'
      },
      {
        symbol: 'META',
        price: 512.30,
        change_percent: 1.80,
        volume: 18000000,
        market_cap: 1300000000000,
        source: 'MOCK_PRIMARY',
        data_status: 'LIVE'
      }
    ];

    for (const snap of currentSnapshots) {
      await client.query(
        `INSERT INTO market_snapshots (symbol, price, change_percent, volume, market_cap, timestamp, source, data_status)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)`,
        [snap.symbol, snap.price, snap.change_percent, snap.volume, snap.market_cap, snap.source, snap.data_status]
      );
    }

    // 7. Seed Market Events
    console.log('[Seed] Seeding market events...');
    const marketEvents = [
      {
        symbol: 'NVDA',
        event_type: 'REGULATORY',
        title: 'Department of Justice expands semiconductor antitrust inquiry into AI accelerator supply agreements',
        description: 'Regulators seek internal documents regarding bundled software licensing terms and hyperscaler supply allocations.',
        source: 'Financial Times / Bloomberg',
        url: 'https://example.com/news/nvda-antitrust',
        timestamp: new Date(Date.now() - 42 * 60 * 1000), // 42 mins ago
        importance: 'HIGH'
      },
      {
        symbol: 'TSLA',
        event_type: 'GUIDANCE',
        title: 'Q3 Delivery outlook adjusted due to assembly line upgrades at Austin Gigafactory',
        description: 'Management lowered quarter delivery expectations by 4% citing tooling transition for next-gen powertrain components.',
        source: 'Reuters',
        url: 'https://example.com/news/tsla-guidance',
        timestamp: new Date(Date.now() - 55 * 60 * 1000), // 55 mins ago
        importance: 'HIGH'
      },
      {
        symbol: 'AMD',
        event_type: 'PRODUCT',
        title: 'Enterprise cloud provider selects Instinct MI325X for tier-1 inference deployment',
        description: 'Major cloud provider signs multi-million dollar volume supply agreement for next-generation generative AI clusters.',
        source: 'PR Newswire',
        url: 'https://example.com/news/amd-datacenter',
        timestamp: new Date(Date.now() - 90 * 60 * 1000), // 90 mins ago
        importance: 'MEDIUM'
      },
      {
        symbol: 'AAPL',
        event_type: 'ANALYST',
        title: 'Analyst note reiterates Neutral rating citing steady iPhone upgrade cycle',
        description: 'Channel checks indicate supply chain builds remain consistent with seasonal historical averages.',
        source: 'Morgan Stanley',
        url: 'https://example.com/news/aapl-note',
        timestamp: new Date(Date.now() - 110 * 60 * 1000), // 110 mins ago
        importance: 'LOW'
      }
    ];

    for (const ev of marketEvents) {
      await client.query(
        `INSERT INTO market_events (symbol, event_type, title, description, source, url, timestamp, importance)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [ev.symbol, ev.event_type, ev.title, ev.description, ev.source, ev.url, ev.timestamp, ev.importance]
      );
    }

    // 8. Seed Stock Visits for Analytics
    console.log('[Seed] Seeding stock visits for analytics...');
    const visitCounts = [
      { symbol: 'NVDA', count: 18 },
      { symbol: 'AAPL', count: 14 },
      { symbol: 'TSLA', count: 11 },
      { symbol: 'MSFT', count: 9 },
      { symbol: 'AMD',  count: 6 },
      { symbol: 'AMZN', count: 4 },
      { symbol: 'GOOGL', count: 2 },
    ];

    for (const item of visitCounts) {
      for (let i = 0; i < item.count; i++) {
        // distribute timestamps across past 72 hours
        const minutesAgo = (i * 240) + Math.floor(Math.random() * 60);
        const visitTime = new Date(Date.now() - minutesAgo * 60 * 1000);
        await client.query(
          `INSERT INTO stock_visits (user_id, symbol, visited_at)
           VALUES ($1, $2, $3)`,
          [userId, item.symbol, visitTime]
        );
      }
    }

    // Also add a couple visits for user2 to test user isolation
    await client.query(
      `INSERT INTO stock_visits (user_id, symbol, visited_at)
       VALUES ($1, $2, NOW())`,
      [user2Id, 'NVDA']
    );

    await client.query('COMMIT');
    console.log('[Seed] Seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Seed] Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('[Seed] Process finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { runSeed };
