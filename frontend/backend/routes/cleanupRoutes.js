const express = require('express');
const router = express.Router();
const cleanupController = require('../controllers/cleanupController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/settings', authenticateToken, requireRole(['admin']), cleanupController.getSettings);
router.get('/preview', authenticateToken, requireRole(['admin']), cleanupController.getPreview);
router.get('/preview/details', authenticateToken, requireRole(['admin']), cleanupController.getDetails);
router.put('/settings', authenticateToken, requireRole(['admin']), cleanupController.updateSettings);
router.post('/manual', authenticateToken, requireRole(['admin']), cleanupController.manualCleanup);

module.exports = router;
