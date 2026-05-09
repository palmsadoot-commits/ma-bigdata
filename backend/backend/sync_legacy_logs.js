const db = require('./config/db');
const dayjs = require('dayjs');

const syncLegacyLogsToHistory = async () => {
    try {
        console.log('🔄 เริ่มการซิงค์ข้อมูลประวัติเก่าลงในตารางแผนงาน...');
        
        // 1. ซิงค์ Database Backups
        const [dbLogs] = await db.query('SELECT log_id, created_at FROM backup_logs');
        for (const log of dbLogs) {
            const date = dayjs(log.created_at).format('YYYY-MM-DD');
            const time = dayjs(log.created_at).format('HH:mm:ss');
            await db.query(
                `INSERT INTO backup_tasks_history (task_type, scheduled_date, scheduled_time, status, completed_at, log_id) 
                 VALUES ('db', ?, ?, 'success', ?, ?)
                 ON DUPLICATE KEY UPDATE status='success', completed_at=VALUES(completed_at), log_id=VALUES(log_id), scheduled_time=VALUES(scheduled_time)`,
                [date, time, log.created_at, log.log_id]
            );
        }

        // 2. ซิงค์ Source Backups
        const [srcLogs] = await db.query('SELECT log_id, created_at FROM source_backup_logs');
        for (const log of srcLogs) {
            const date = dayjs(log.created_at).format('YYYY-MM-DD');
            const time = dayjs(log.created_at).format('HH:mm:ss');
            await db.query(
                `INSERT INTO backup_tasks_history (task_type, scheduled_date, scheduled_time, status, completed_at, log_id) 
                 VALUES ('source', ?, ?, 'success', ?, ?)
                 ON DUPLICATE KEY UPDATE status='success', completed_at=VALUES(completed_at), log_id=VALUES(log_id), scheduled_time=VALUES(scheduled_time)`,
                [date, time, log.created_at, log.log_id]
            );
        }

        // 3. ซิงค์ GitHub Sync
        const [gitLogs] = await db.query('SELECT log_id, created_at FROM github_sync_logs');
        for (const log of gitLogs) {
            const date = dayjs(log.created_at).format('YYYY-MM-DD');
            const time = dayjs(log.created_at).format('HH:mm:ss');
            await db.query(
                `INSERT INTO backup_tasks_history (task_type, scheduled_date, scheduled_time, status, completed_at, log_id) 
                 VALUES ('github', ?, ?, 'success', ?, ?)
                 ON DUPLICATE KEY UPDATE status='success', completed_at=VALUES(completed_at), log_id=VALUES(log_id), scheduled_time=VALUES(scheduled_time)`,
                [date, time, log.created_at, log.log_id]
            );
        }

        // 4. ซิงค์ GDrive Sync
        const [gdriveLogs] = await db.query('SELECT log_id, created_at FROM gdrive_sync_logs');
        for (const log of gdriveLogs) {
            const date = dayjs(log.created_at).format('YYYY-MM-DD');
            const time = dayjs(log.created_at).format('HH:mm:ss');
            await db.query(
                `INSERT INTO backup_tasks_history (task_type, scheduled_date, scheduled_time, status, completed_at, log_id) 
                 VALUES ('gdrive', ?, ?, 'success', ?, ?)
                 ON DUPLICATE KEY UPDATE status='success', completed_at=VALUES(completed_at), log_id=VALUES(log_id), scheduled_time=VALUES(scheduled_time)`,
                [date, time, log.created_at, log.log_id]
            );
        }

        console.log('✅ ซิงค์ข้อมูลสำเร็จ!');
        process.exit(0);
    } catch (err) {
        console.error('❌ ผิดพลาด:', err.message);
        process.exit(1);
    }
};

syncLegacyLogsToHistory();
