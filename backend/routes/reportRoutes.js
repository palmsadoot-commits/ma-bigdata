const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All report routes require Admin or Manager role
router.use(authenticateToken, requireRole(['admin', 'manager']));

router.get('/kpis', reportController.getKpis);
router.get('/trend', reportController.getTrend);
router.get('/categories', reportController.getCategoryDistribution);
router.get('/vendors', reportController.getVendorPerformance);
router.get('/status-breakdown', reportController.getStatusBreakdown);
router.get('/executive-summary', reportController.getAdvancedExecutiveSummary);

module.exports = router;
