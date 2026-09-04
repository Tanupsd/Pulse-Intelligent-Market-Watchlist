const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {
  getStockDetail,
  getStockChanges,
  getStockHistory,
  searchStocks,
  compareStocks,
} = require('../controllers/stocksController');

// Optional auth middleware so checkpoint comparison works if logged in
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET || 'pulse_jwt_super_secret_hackathon_2026_key', (err, decoded) => {
      if (!err && decoded) {
        req.user = decoded;
      }
      next();
    });
  } else {
    next();
  }
};

router.use(optionalAuth);

// Search stocks: GET /api/stocks/search?q=...
router.get('/search', searchStocks);

// Public Side-by-Side Stock Comparison: GET /api/stocks/compare?symbols=AAPL,NVDA&range=1M
router.get('/compare', compareStocks);

// Stock Detail: GET /api/stocks/:symbol
router.get('/:symbol', getStockDetail);

// Stock Changes & Signals: GET /api/stocks/:symbol/changes
router.get('/:symbol/changes', getStockChanges);

// Stock Price History: GET /api/stocks/:symbol/history?range=1D
router.get('/:symbol/history', getStockHistory);

module.exports = router;
