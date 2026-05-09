const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { sysLog } = require('../utils/logger');

const cleanupService = {
    /**
     * ดึงข้อมูลการตั้งค่า Auto Cleanup
     */
    async getSettings() {
        const [rows] = await db.query('SELECT * FROM cleanup_settings LIMIT 1');
        return rows[0] || null;
    },

    /**
     * อัปเดตการตั้งค่า Auto Cleanup
     */
    async updateSettings(data) {
        const { db_retention_days, source_retention_days, system_log_retention_days, ticket_log_retention_days, schedule_type, schedule_days, schedule_time, is_active } = data;
        await db.query(`
            UPDATE cleanup_settings SET 
                db_retention_days=?, source_retention_days=?, system_log_retention_days=?, 
                ticket_log_retention_days=?, schedule_type=?, schedule_days=?, schedule_time=?, is_active=?
            WHERE id=1
        `, [
            db_retention_days || 30, source_retention_days || 30, system_log_retention_days || 90, 
            ticket_log_retention_days || 180, schedule_type || 'weekly', schedule_days || '0', 
            schedule_time || '03:00:00', is_active || 0
        ]);
        
        // เราจะเรียกใช้ฟังก์ชันอัปเดต Cron Job หลังจากนี้
    },

    /**
     * 🔍 วิเคราะห์รายการที่จะถูกลบ (Preview)
     */
    async getCleanupPreview() {
        const settings = await this.getSettings();
        if (!settings) throw new Error('Cleanup settings not found');

        // 1. ตรวจสอบ DB Backups
        const [oldDbs] = await db.query(`SELECT COUNT(*) as count FROM backup_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`, [settings.db_retention_days]);
        
        // 2. ตรวจสอบ Source Code Backups
        const [oldSrcs] = await db.query(`SELECT COUNT(*) as count FROM source_backup_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`, [settings.source_retention_days]);

        // 3. ตรวจสอบ System Logs
        const [oldSysLogs] = await db.query(`SELECT COUNT(*) as count FROM system_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)`, [settings.system_log_retention_days]);

        // 4. ตรวจสอบ Ticket Logs
        const [oldTicketLogs] = await db.query(`SELECT COUNT(*) as count FROM ticket_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`, [settings.ticket_log_retention_days]);

        return {
            dbCount: oldDbs[0].count,
            sourceCount: oldSrcs[0].count,
            sysLogCount: oldSysLogs[0].count,
            ticketLogCount: oldTicketLogs[0].count,
            retention: {
                db: settings.db_retention_days,
                source: settings.source_retention_days,
                sys: settings.system_log_retention_days,
                ticket: settings.ticket_log_retention_days
            }
        };
    },

    /**
     * 🔍 ดึงรายละเอียดรายการที่จะถูกลบ (Drill Down)
     */
    async getCleanupDetails(type) {
        const settings = await this.getSettings();
        if (!settings) throw new Error('Cleanup settings not found');

        let data = [];
        switch (type) {
            case 'db':
                [data] = await db.query(`SELECT file_name, file_size, created_at FROM backup_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY created_at ASC LIMIT 100`, [settings.db_retention_days]);
                break;
            case 'source':
                [data] = await db.query(`SELECT file_name, file_size, created_at FROM source_backup_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY created_at ASC LIMIT 100`, [settings.source_retention_days]);
                break;
            case 'syslog':
                [data] = await db.query(`SELECT id, level, category as module, message, timestamp as created_at FROM system_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY timestamp ASC LIMIT 100`, [settings.system_log_retention_days]);
                break;
            case 'ticketlog':
                [data] = await db.query(`SELECT log_id as id, ticket_id, action, actor_name as actor, created_at FROM ticket_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY created_at ASC LIMIT 100`, [settings.ticket_log_retention_days]);
                break;
        }
        return data;
    },

    /**
     * 🧹 ประมวลผลการล้างข้อมูล (Manual & Auto)
     * @param {string} actor - ใครเป็นคนสั่งลบ (เช่น 'Admin (Manual)', 'System (Auto)')
     */
    async performCleanup(actor = 'System') {
        const settings = await this.getSettings();
        if (!settings) throw new Error('Cleanup settings not found');

        let report = { dbDeleted: 0, sourceDeleted: 0, sysLogsDeleted: 0, ticketLogsDeleted: 0 };

        // 1. ล้าง Database Backups ที่เก่าเกินไป
        const dbDir = path.resolve(__dirname, '../../backups/database');
        if (fs.existsSync(dbDir)) {
            const [oldDbs] = await db.query(`SELECT file_name FROM backup_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`, [settings.db_retention_days]);
            for (const row of oldDbs) {
                const filePath = path.join(dbDir, row.file_name);
                if (fs.existsSync(filePath)) {
                    try { fs.unlinkSync(filePath); report.dbDeleted++; } catch(e) {}
                }
            }
            await db.query(`DELETE FROM backup_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`, [settings.db_retention_days]);
        }

        // 2. ล้าง Source Code Backups ที่เก่าเกินไป
        const srcDir = path.resolve(__dirname, '../../backups/source');
        if (fs.existsSync(srcDir)) {
            const [oldSrcs] = await db.query(`SELECT file_name FROM source_backup_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`, [settings.source_retention_days]);
            for (const row of oldSrcs) {
                const filePath = path.join(srcDir, row.file_name);
                if (fs.existsSync(filePath)) {
                    try { fs.unlinkSync(filePath); report.sourceDeleted++; } catch(e) {}
                }
            }
            await db.query(`DELETE FROM source_backup_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`, [settings.source_retention_days]);
        }

        // 3. ล้าง System Logs ที่เก่าเกินไป
        const [sysRes] = await db.query(`DELETE FROM system_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)`, [settings.system_log_retention_days]);
        report.sysLogsDeleted = sysRes.affectedRows;

        // 4. ล้าง Ticket Logs ที่เก่าเกินไป
        const [ticketRes] = await db.query(`DELETE FROM ticket_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`, [settings.ticket_log_retention_days]);
        report.ticketLogsDeleted = ticketRes.affectedRows;

        // บันทึกผลลัพธ์ลง System Log
        const totalDeleted = report.dbDeleted + report.sourceDeleted + report.sysLogsDeleted + report.ticketLogsDeleted;
        if (totalDeleted > 0) {
            await sysLog('INFO', 'SYSTEM', `[Auto Cleanup] ล้างข้อมูลสำเร็จโดย ${actor}`, {
                metadata: {
                    action: 'DATA_CLEANUP',
                    ...report
                }
            });
        }

        return report;
    }
};

module.exports = cleanupService;
