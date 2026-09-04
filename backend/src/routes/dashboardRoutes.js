const express = require('express');
const router = express.Router();
const { getWatchlistSummary, updateWatchlistCheckpoint } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Primary dashboard summary endpoint: GET /api/watchlists/:id/summary
router.get('/:id/summary', getWatchlistSummary);

// Checkpoint acknowledge / advance: POST /api/watchlists/:id/checkpoint
router.post('/:id/checkpoint', updateWatchlistCheckpoint);

module.exports = router;
