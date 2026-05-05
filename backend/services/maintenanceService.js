const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { sysLog } = require('../utils/logger');

/**
 * Enterprise Maintenance Service
 * Handles automatic cleanup of logs and backup files
 */
const maintenanceService = {
    /**
     * ดึงการตั้งค่า Maintenance ปัจจุบัน
     */
    async getSettings() {
        const [rows] = await db.query('SELECT * FROM maintenance_settings WHERE id = 1');
        return rows[0] || {
            db_retention_days: 30,
            source_retention_days: 30,
            log_retention_days: 30,
            is_auto_cleanup: 1
        };
    },

    /**
     * อัปเดตการตั้งค่า Maintenance
     */
    async updateSettings(data) {
        const { db_retention_days, source_retention_days, log_retention_days, is_auto_cleanup } = data;
        await db.query(
            `UPDATE maintenance_settings SET 
                db_retention_days = ?, 
                source_retention_days = ?, 
                log_retention_days = ?, 
                is_auto_cleanup = ?,
                last_run_at = last_run_at
            WHERE id = 1`,
            [db_retention_days, source_retention_days, log_retention_days, is_auto_cleanup]
        );
        return { success: true };
    },

    /**
     * รันกระบวนการทำความสะอาด (Cleanup Process)
     */
    async runCleanup(manual = false) {
        const settings = await this.getSettings();
        if (!manual && settings.is_auto_cleanup === 0) return;

        console.log('🧹 Starting Maintenance Cleanup Process...');
        const stats = { logsDeleted: 0, filesDeleted: 0 };

        try {
            // 1. ลบ System Logs และ Audit Logs
            const logDate = new Date();
            logDate.setDate(logDate.getDate() - settings.log_retention_days);
            const formattedLogDate = logDate.toISOString().slice(0, 19).replace('T', ' ');

            const [logResult] = await db.query('DELETE FROM system_logs WHERE timestamp < ?', [formattedLogDate]);
            const [auditResult] = await db.query('DELETE FROM audit_logs WHERE created_at < ?', [formattedLogDate]);
            stats.logsDeleted = (logResult.affectedRows || 0) + (auditResult.affectedRows || 0);

            // 2. ลบไฟล์ Backup เก่าในเครื่อง (Database Backups)
            const dbBackupDir = path.join(__dirname, '../../backups/database');
            stats.filesDeleted += await this.cleanupDirectory(dbBackupDir, settings.db_retention_days);

            // 3. ลบไฟล์ Source Backup เก่า
            const sourceBackupDir = path.join(__dirname, '../../backups/source');
            stats.filesDeleted += await this.cleanupDirectory(sourceBackupDir, settings.source_retention_days);

            // อัปเดตเวลาที่รันล่าสุด
            await db.query('UPDATE maintenance_settings SET last_run_at = NOW() WHERE id = 1');

            const message = `Cleanup completed: Deleted ${stats.logsDeleted} logs and ${stats.filesDeleted} old backup files.`;
            await sysLog('INFO', 'SYSTEM', message, { metadata: { stats, manual } });
            console.log(`✅ ${message}`);

            return stats;
        } catch (err) {
            console.error('❌ Maintenance Cleanup Error:', err.message);
            await sysLog('ERROR', 'SYSTEM', `Cleanup failed: ${err.message}`, { metadata: { error: err.message } });
            throw err;
        }
    },

    /**
     * Helper สำหรับลบไฟล์ที่เก่าเกินกำหนดในโฟลเดอร์
     */
    async cleanupDirectory(directory, retentionDays) {
        let deletedCount = 0;
        if (!fs.existsSync(directory)) return 0;

        const files = fs.readdirSync(directory);
        const now = Date.now();
        const threshold = retentionDays * 24 * 60 * 60 * 1000;

        for (const file of files) {
            const filePath = path.join(directory, file);
            const stats = fs.statSync(filePath);
            
            if (now - stats.mtimeMs > threshold) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        }
        return deletedCount;
    }
};

module.exports = maintenanceService;
