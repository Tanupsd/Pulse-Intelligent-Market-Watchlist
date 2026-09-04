const express = require('express');
const router = express.Router();
const {
  setScenario,
  getScenario,
  setProviderMode,
  setDataStatus,
  getTopPerformers,
  getTopLosers,
} = require('../controllers/stocksController');

router.get('/scenario', getScenario);
router.post('/scenario', setScenario);
router.get('/provider', getScenario);
router.post('/provider', setProviderMode);
router.post('/status', setDataStatus);

// Market Rankings (Top Performers & Top Losers)
router.get('/top-performers', getTopPerformers);
router.get('/top-losers', getTopLosers);

module.exports = router;
