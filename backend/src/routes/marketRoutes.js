const express = require('express');
const router = express.Router();
const {
  setScenario,
  getScenario,
  setProviderMode,
  setDataStatus,
} = require('../controllers/stocksController');

router.get('/scenario', getScenario);
router.post('/scenario', setScenario);
router.get('/provider', getScenario);
router.post('/provider', setProviderMode);
router.post('/status', setDataStatus);

module.exports = router;
