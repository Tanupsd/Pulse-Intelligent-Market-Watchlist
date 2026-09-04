const request = require('supertest');
const app = require('../../src/app');
const { pool, query } = require('../../src/db/pool');

describe('Pulse API Integration Tests', () => {
  let userAToken;
  let userAId;
  let userBToken;
  let userBId;
  let userAWatchlistId;
  let userBWatchlistId;

  const testEmailA = `test_a_${Date.now()}@example.com`;
  const testEmailB = `test_b_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmailA, password: 'password123' });
    expect(resA.status).toBe(201);
    userAToken = resA.body.token;
    userAId = resA.body.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmailB, password: 'password123' });
    expect(resB.status).toBe(201);
    userBToken = resB.body.token;
    userBId = resB.body.user.id;
  });

  afterAll(async () => {
    // Cleanup created test users
    try {
      await query('DELETE FROM users WHERE email IN ($1, $2)', [testEmailA, testEmailB]);
    } catch (e) {
      // ignore
    }
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/register - fails with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmailA, password: 'password123' });
      expect(res.status).toBe(409);
    });

    test('POST /api/auth/login - succeeds with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmailA, password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmailA);
    });

    test('POST /api/auth/login - fails with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmailA, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    test('GET /api/auth/me - succeeds with valid JWT', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe(userAId);
      expect(res.body.user.password_hash).toBeUndefined();
    });

    test('GET /api/auth/me - fails without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Watchlist Management & User Isolation', () => {
    test('POST /api/watchlists - User A creates a watchlist', async () => {
      const res = await request(app)
        .post('/api/watchlists')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ name: 'Alpha Tech' });
      expect(res.status).toBe(201);
      userAWatchlistId = res.body.watchlist.id;
      expect(res.body.watchlist.name).toBe('Alpha Tech');
    });

    test('POST /api/watchlists - User B creates a watchlist', async () => {
      const res = await request(app)
        .post('/api/watchlists')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ name: 'Beta Tech' });
      expect(res.status).toBe(201);
      userBWatchlistId = res.body.watchlist.id;
    });

    test('GET /api/watchlists - returns only User A watchlists', async () => {
      const res = await request(app)
        .get('/api/watchlists')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
      const ids = res.body.watchlists.map(w => w.id);
      expect(ids).toContain(userAWatchlistId);
      expect(ids).not.toContain(userBWatchlistId);
    });

    test('GET /api/watchlists/:id - User A cannot access User B watchlist (User Isolation)', async () => {
      const res = await request(app)
        .get(`/api/watchlists/${userBWatchlistId}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(404);
    });

    test('POST /api/watchlists/:id/stocks - User A adds stocks to their watchlist', async () => {
      const res = await request(app)
        .post(`/api/watchlists/${userAWatchlistId}/stocks`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ symbol: 'NVDA' });
      expect(res.status).toBe(201);
      expect(res.body.stock.symbol).toBe('NVDA');

      // Add another stock
      await request(app)
        .post(`/api/watchlists/${userAWatchlistId}/stocks`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ symbol: 'AMD' });
    });

    test('POST /api/watchlists/:id/stocks - rejects duplicate symbol in same watchlist', async () => {
      const res = await request(app)
        .post(`/api/watchlists/${userAWatchlistId}/stocks`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ symbol: 'NVDA' });
      expect(res.status).toBe(409);
    });

    test('POST /api/watchlists/:id/stocks - User A cannot add stock to User B watchlist', async () => {
      const res = await request(app)
        .post(`/api/watchlists/${userBWatchlistId}/stocks`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ symbol: 'TSLA' });
      expect(res.status).toBe(404);
    });

    test('DELETE /api/watchlists/:id/stocks/:symbol - User A removes a stock', async () => {
      const res = await request(app)
        .delete(`/api/watchlists/${userAWatchlistId}/stocks/AMD`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Dashboard Summary & Checkpoints', () => {
    test('GET /api/watchlists/:id/summary - returns ranked changes and attention score', async () => {
      const res = await request(app)
        .get(`/api/watchlists/${userAWatchlistId}/summary`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.watchlist.id).toBe(userAWatchlistId);
      expect(Array.isArray(res.body.stocks)).toBe(true);
      expect(res.body.stocks.length).toBeGreaterThan(0);
      expect(res.body.stocks[0].symbol).toBe('NVDA');
      expect(res.body.stocks[0].attentionScore).toBeDefined();
      expect(res.body.stocks[0].reasons.length).toBeGreaterThan(0);
    });

    test('POST /api/watchlists/:id/checkpoint - successfully updates user checkpoints', async () => {
      const res = await request(app)
        .post(`/api/watchlists/${userAWatchlistId}/checkpoint`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.updatedCount).toBeGreaterThan(0);
      expect(res.body.checkpointTimestamp).toBeDefined();
    });
  });

  describe('Stock Detail & Search Endpoints', () => {
    test('GET /api/stocks/:symbol - returns quote and change evaluation', async () => {
      const res = await request(app)
        .get('/api/stocks/NVDA')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stock.symbol).toBe('NVDA');
      expect(res.body.stock.price).toBeDefined();
      expect(res.body.stock.attentionScore).toBeDefined();
      expect(Array.isArray(res.body.events)).toBe(true);
    });

    test('GET /api/stocks/:symbol/history - returns time series data points', async () => {
      const res = await request(app)
        .get('/api/stocks/NVDA/history?range=1D');

      expect(res.status).toBe(200);
      expect(res.body.symbol).toBe('NVDA');
      expect(res.body.points.length).toBeGreaterThan(0);
      expect(res.body.points[0].price).toBeDefined();
      expect(res.body.points[0].volume).toBeDefined();
    });

    test('GET /api/stocks/search - searches supported symbols', async () => {
      const res = await request(app)
        .get('/api/stocks/search?q=NVD');

      expect(res.status).toBe(200);
      expect(res.body.results.some(r => r.symbol === 'NVDA')).toBe(true);
    });
  });
});
