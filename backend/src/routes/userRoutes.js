const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

// All /api/users routes require authentication
router.use(authenticateToken);

router.get('/me', profileController.getProfile);
router.put('/me', profileController.updateProfile);
router.put('/me/password', profileController.updatePassword);
router.post('/me/stock-visits', profileController.recordStockVisit);
router.get('/me/analytics', profileController.getUserAnalytics);

module.exports = router;
