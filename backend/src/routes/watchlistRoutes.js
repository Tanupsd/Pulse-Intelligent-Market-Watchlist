const express = require('express');
const router = express.Router();
const {
  getWatchlists,
  createWatchlist,
  getWatchlistById,
  updateWatchlist,
  deleteWatchlist,
  addStock,
  removeStock,
} = require('../controllers/watchlistController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', getWatchlists);
router.post('/', createWatchlist);
router.get('/:id', getWatchlistById);
router.put('/:id', updateWatchlist);
router.delete('/:id', deleteWatchlist);

// Stock management
router.post('/:id/stocks', addStock);
router.delete('/:id/stocks/:symbol', removeStock);

module.exports = router;
