const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Database Backup
router.post('/manual', authenticateToken, requireRole(['admin']), backupController.manualBackup);
router.get('/logs', authenticateToken, requireRole(['admin']), backupController.getBackupLogs);
router.get('/settings', authenticateToken, requireRole(['admin']), backupController.getBackupSettings);
router.put('/settings', authenticateToken, requireRole(['admin']), backupController.updateBackupSettings);
router.post('/restore', authenticateToken, requireRole(['admin']), backupController.restoreBackup);
router.post('/bulk-delete', authenticateToken, requireRole(['admin']), backupController.bulkDeleteBackups); // ✅ ลบ DB แบบกลุ่ม
router.delete('/:fileName', authenticateToken, requireRole(['admin']), backupController.deleteBackup);

// Source Backup
router.post('/source/manual', authenticateToken, requireRole(['admin']), backupController.manualSourceBackup);
router.get('/source/logs', authenticateToken, requireRole(['admin']), backupController.getSourceBackupLogs);
router.get('/source/settings', authenticateToken, requireRole(['admin']), backupController.getSourceBackupSettings);
router.post('/source/profiles', authenticateToken, requireRole(['admin']), backupController.createSourceBackupProfile);
router.delete('/source/profiles/:id', authenticateToken, requireRole(['admin']), backupController.deleteSourceBackupProfile);
router.put('/source/settings', authenticateToken, requireRole(['admin']), backupController.updateSourceBackupSettings);
router.post('/source/bulk-delete', authenticateToken, requireRole(['admin']), backupController.bulkDeleteSourceBackups); // ✅ ลบ Source แบบกลุ่ม
router.delete('/source/:fileName', authenticateToken, requireRole(['admin']), backupController.deleteSourceBackup);


// GitHub Sync
router.post('/github/manual', authenticateToken, requireRole(['admin']), backupController.manualGithubSync);
router.get('/github/logs', authenticateToken, requireRole(['admin']), backupController.getGithubLogs);
router.get('/github/settings', authenticateToken, requireRole(['admin']), backupController.getGithubSettings);
router.put('/github/settings', authenticateToken, requireRole(['admin']), backupController.updateGithubSettings);
router.post('/github/bulk-delete', authenticateToken, requireRole(['admin']), backupController.bulkDeleteGithubLogs); // ✅ ลบ GitHub แบบกลุ่ม
router.delete('/github/logs/:id', authenticateToken, requireRole(['admin']), backupController.deleteGithubLog);

// Google Drive Sync
router.post('/gdrive/manual', authenticateToken, requireRole(['admin']), backupController.manualGDriveSync);
router.get('/gdrive/logs', authenticateToken, requireRole(['admin']), backupController.getGDriveLogs);
router.get('/gdrive/verify-files', authenticateToken, requireRole(['admin']), backupController.verifyGDriveFiles);
router.get('/gdrive/settings', authenticateToken, requireRole(['admin']), backupController.getGDriveSettings);
router.put('/gdrive/settings', authenticateToken, requireRole(['admin']), backupController.updateGDriveSettings);
router.post('/gdrive/bulk-delete', authenticateToken, requireRole(['admin']), backupController.bulkDeleteGDriveLogs); // ✅ ลบ GDrive แบบกลุ่ม
router.delete('/gdrive/logs/:id', authenticateToken, requireRole(['admin']), backupController.deleteGDriveLog);

// Task History (Calendar)
router.get('/task-history', authenticateToken, requireRole(['admin']), backupController.getTaskHistory);

// Storage Stats
router.get('/storage-stats', authenticateToken, requireRole(['admin']), backupController.getStorageStats);
router.get('/storage-history', authenticateToken, requireRole(['admin']), backupController.getStorageHistory); // ✅ เพิ่มฟิลด์ประวัติย้อนหลัง

module.exports = router;
