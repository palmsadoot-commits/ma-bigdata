const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/upload');

const validate = require('../middleware/validate');
const { updateSettingsSchema } = require('../schemas/settingSchema');

// 🌐 Public Routes (For LINE Webhook)
router.post('/webhook', settingController.lineWebhook);

// 🔒 Protected Routes
router.get('/', settingController.getSettings);
router.put('/', authenticateToken, requireRole(['admin']), upload.fields([
    { name: 'system_logo', maxCount: 1 },
    { name: 'system_favicon', maxCount: 1 }
]), validate({ body: updateSettingsSchema }), settingController.updateSettings);

router.get('/health', authenticateToken, requireRole(['admin']), settingController.getSystemHealth);
router.post('/test-line', authenticateToken, requireRole(['admin']), settingController.testLineConnection);
router.post('/test-email', authenticateToken, requireRole(['admin']), settingController.testEmailConnection);

// 📡 Webhook & Ngrok Management
router.get('/webhook-status', authenticateToken, requireRole(['admin']), settingController.getWebhookStatus);
router.post('/webhook-reset', authenticateToken, requireRole(['admin']), settingController.resetWebhookStatus);
router.post('/ngrok/start', authenticateToken, requireRole(['admin']), settingController.startNgrok);
router.post('/ngrok/stop', authenticateToken, requireRole(['admin']), settingController.stopNgrok);

module.exports = router;
