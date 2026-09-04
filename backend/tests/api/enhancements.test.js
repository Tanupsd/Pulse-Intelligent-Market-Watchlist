const request = require('supertest');
const app = require('../../src/app');
const { pool, query } = require('../../src/db/pool');

describe('Pulse Major Enhancements API Tests', () => {
  let userAToken;
  let userAId;
  let userBToken;
  let userBId;

  const testEmailA = `enh_a_${Date.now()}@example.com`;
  const testEmailB = `enh_b_${Date.now()}@example.com`;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmailA,
        password: 'password123',
        name: 'Alice Investor',
        phone: '+1 555 100 2000',
      });
    expect(resA.status).toBe(201);
    userAToken = resA.body.token;
    userAId = resA.body.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmailB,
        password: 'password123',
        name: 'Bob Trader',
        phone: '+1 555 300 4000',
      });
    expect(resB.status).toBe(201);
    userBToken = resB.body.token;
    userBId = resB.body.user.id;
  });

  afterAll(async () => {
    try {
      await query('DELETE FROM users WHERE email IN ($1, $2)', [testEmailA, testEmailB]);
    } catch (e) {
      // ignore
    }
  });

  describe('User Profile & Password Management', () => {
    test('GET /api/users/me - retrieves user profile', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testEmailA);
      expect(res.body.user.name).toBe('Alice Investor');
      expect(res.body.user.phone).toBe('+1 555 100 2000');
    });

    test('GET /api/users/me - rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });

    test('PUT /api/users/me - updates name, phone, and email', async () => {
      const newName = 'Alice Updated';
      const newPhone = '+1 555 999 8888';

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          email: testEmailA,
          name: newName,
          phone: newPhone,
        });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe(newName);
      expect(res.body.user.phone).toBe(newPhone);
    });

    test('PUT /api/users/me - prevents updating to an already registered email', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          email: testEmailB, // already owned by User B
          name: 'Conflict User',
          phone: '123',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    test('PUT /api/users/me/password - updates password when current password matches', async () => {
      const res = await request(app)
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newSecurePassword456',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('successfully');

      // Verify login works with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmailA,
          password: 'newSecurePassword456',
        });
      expect(loginRes.status).toBe(200);
    });

    test('PUT /api/users/me/password - rejects wrong current password', async () => {
      const res = await request(app)
        .put('/api/users/me/password')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          currentPassword: 'wrongPassword!',
          newPassword: 'anotherNewPassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Current password is incorrect');
    });
  });

  describe('Stock Visits & Analytics Aggregation', () => {
    test('POST /api/users/me/stock-visits - records visit', async () => {
      const res = await request(app)
        .post('/api/users/me/stock-visits')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ symbol: 'NVDA' });

      expect(res.status).toBe(201);
      expect(res.body.recorded).toBe(true);
      expect(res.body.visit.symbol).toBe('NVDA');
    });

    test('POST /api/users/me/stock-visits - deduplicates rapid repeat visits', async () => {
      // Immediate second visit to NVDA
      const res = await request(app)
        .post('/api/users/me/stock-visits')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ symbol: 'NVDA' });

      expect(res.status).toBe(200);
      expect(res.body.recorded).toBe(false);
      expect(res.body.message).toContain('cooldown window');
    });

    test('GET /api/users/me/analytics - returns aggregated visit counts with user isolation', async () => {
      // Record a visit for User B to AAPL
      await request(app)
        .post('/api/users/me/stock-visits')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ symbol: 'AAPL' });

      // Check User A analytics: should contain NVDA, not AAPL
      const resA = await request(app)
        .get('/api/users/me/analytics')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(resA.status).toBe(200);
      expect(Array.isArray(resA.body.analytics)).toBe(true);
      const nvdaItem = resA.body.analytics.find(item => item.symbol === 'NVDA');
      expect(nvdaItem).toBeDefined();
      expect(nvdaItem.visits).toBeGreaterThanOrEqual(1);

      // User A shouldn't have AAPL
      const aaplItemA = resA.body.analytics.find(item => item.symbol === 'AAPL');
      expect(aaplItemA).toBeUndefined();

      // Check User B analytics: should contain AAPL, not NVDA
      const resB = await request(app)
        .get('/api/users/me/analytics')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(resB.status).toBe(200);
      const aaplItemB = resB.body.analytics.find(item => item.symbol === 'AAPL');
      expect(aaplItemB).toBeDefined();
    });
  });

  describe('Market Rankings & Pagination', () => {
    test('GET /api/market/top-performers - sorted strictly descending by changePercent', async () => {
      const res = await request(app).get('/api/market/top-performers?limit=5&offset=0');

      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.items.length).toBeLessThanOrEqual(5);

      for (let i = 0; i < res.body.items.length - 1; i++) {
        expect(res.body.items[i].changePercent).toBeGreaterThanOrEqual(
          res.body.items[i + 1].changePercent
        );
      }
    });

    test('GET /api/market/top-losers - sorted strictly ascending by changePercent', async () => {
      const res = await request(app).get('/api/market/top-losers?limit=5&offset=0');

      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.items.length).toBeLessThanOrEqual(5);

      for (let i = 0; i < res.body.items.length - 1; i++) {
        expect(res.body.items[i].changePercent).toBeLessThanOrEqual(
          res.body.items[i + 1].changePercent
        );
      }
    });

    test('GET /api/market/top-performers - supports pagination via offset and limit', async () => {
      const page1 = await request(app).get('/api/market/top-performers?limit=5&offset=0');
      const page2 = await request(app).get('/api/market/top-performers?limit=5&offset=5');

      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      if (page1.body.items.length > 0 && page2.body.items.length > 0) {
        expect(page1.body.items[0].symbol).not.toBe(page2.body.items[0].symbol);
      }
    });
  });

  describe('Public Stock Comparison', () => {
    test('GET /api/stocks/compare - compares AAPL and NVDA side-by-side', async () => {
      const res = await request(app).get('/api/stocks/compare?symbols=AAPL,NVDA&range=1M');

      expect(res.status).toBe(200);
      expect(res.body.symbols).toContain('AAPL');
      expect(res.body.symbols).toContain('NVDA');
      expect(res.body.stocks.length).toBe(2);

      const aapl = res.body.stocks.find(s => s.symbol === 'AAPL');
      expect(aapl).toBeDefined();
      expect(aapl.price).toBeGreaterThan(0);
      expect(aapl.history).toBeDefined();
      expect(Array.isArray(aapl.history)).toBe(true);
    });

    test('GET /api/stocks/compare - returns empty results if no symbols provided', async () => {
      const res = await request(app).get('/api/stocks/compare');

      expect(res.status).toBe(200);
      expect(res.body.symbols).toEqual([]);
      expect(res.body.stocks.length).toBe(0);
    });
  });

  describe('Public vs Authenticated Stock Details Privacy', () => {
    test('GET /api/stocks/:symbol - unauthenticated request omits checkpoint and attention data', async () => {
      const res = await request(app).get('/api/stocks/AAPL');

      expect(res.status).toBe(200);
      expect(res.body.stock).toBeDefined();
      expect(res.body.stock.symbol).toBe('AAPL');
      expect(res.body.stock.price).toBeGreaterThan(0);
      expect(res.body.stock.isAuthenticated).toBe(false);
      // Ensure checkpoint and attention score are NOT present
      expect(res.body.stock.checkpointPrice).toBeUndefined();
      expect(res.body.stock.checkpointTimestamp).toBeUndefined();
      expect(res.body.stock.hasCheckpoint).toBeUndefined();
      expect(res.body.stock.sinceLastCheck).toBeUndefined();
      expect(res.body.stock.attentionScore).toBeUndefined();
      expect(res.body.stock.severity).toBeUndefined();
    });

    test('GET /api/stocks/:symbol - authenticated request returns checkpoint and attention data', async () => {
      const res = await request(app)
        .get('/api/stocks/AAPL')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stock).toBeDefined();
      expect(res.body.stock.symbol).toBe('AAPL');
      expect(res.body.stock.price).toBeGreaterThan(0);
      expect(res.body.stock.isAuthenticated).toBe(true);
      expect(res.body.stock.attentionScore).toBeDefined();
      expect(res.body.stock.severity).toBeDefined();
    });

    test('GET /api/stocks/:symbol/changes - unauthenticated request returns 401', async () => {
      const res = await request(app).get('/api/stocks/AAPL/changes');

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Authentication required/i);
    });
  });
});
