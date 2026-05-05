const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/settings', authenticateToken, requireRole(['admin']), maintenanceController.getSettings);
router.put('/settings', authenticateToken, requireRole(['admin']), maintenanceController.updateSettings);
router.post('/run', authenticateToken, requireRole(['admin']), maintenanceController.runManualCleanup);

module.exports = router;
