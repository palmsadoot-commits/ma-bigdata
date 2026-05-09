const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ทุกเส้นทางต้องการสิทธิ์ Admin
router.use(authenticateToken, requireRole(['admin']));

router.get('/threats', securityController.getThreats);
router.get('/stats', securityController.getStats);
router.get('/blocked-ips', securityController.getBlockedIps);
router.post('/block-ip', securityController.blockIp);
router.post('/unblock-ip', securityController.unblockIp);

module.exports = router;
