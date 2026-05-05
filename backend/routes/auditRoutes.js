const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { addClient } = require('../utils/sse');

// ✅ เส้นทางดึงข้อมูลแบบดั้งเดิม (Audit Actions)
router.get('/', authenticateToken, requireRole(['admin']), auditController.getAuditLogs);

// ✅ เส้นทางดึงข้อมูลระดับโลก (System Logs)
router.get('/system', authenticateToken, requireRole(['admin']), auditController.getSystemLogs);

// ✅ เส้นทางดึงสถิติ (Log Stats for Dashboard)
router.get('/stats', authenticateToken, requireRole(['admin']), auditController.getLogStats);

// ✅ ช่องทางกระจายสัญญาณแจ้งเตือน (SSE) แบบเรียลไทม์
router.get('/live-alerts', addClient);

module.exports = router;
