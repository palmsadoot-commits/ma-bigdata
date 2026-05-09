const db = require('./config/db');

async function setup() {
    console.log('🚀 Starting Database Setup for New Features...');

    try {
        // 1. Add notify_backup_status to system_settings
        const [columns] = await db.query("SHOW COLUMNS FROM system_settings LIKE 'notify_backup_status'");
        if (columns.length === 0) {
            await db.query("ALTER TABLE system_settings ADD COLUMN notify_backup_status TINYINT(1) DEFAULT 1 AFTER enable_line");
            console.log('✅ Added notify_backup_status to system_settings');
        } else {
            console.log('ℹ️ notify_backup_status already exists in system_settings');
        }

        // 2. Create storage_history table
        const createStorageHistorySQL = `
            CREATE TABLE IF NOT EXISTS storage_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                snapshot_date DATE NOT NULL,
                db_used BIGINT DEFAULT 0,
                source_used BIGINT DEFAULT 0,
                github_used BIGINT DEFAULT 0,
                gdrive_used BIGINT DEFAULT 0,
                total_used BIGINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_date (snapshot_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
        await db.query(createStorageHistorySQL);
        console.log('✅ Created storage_history table');

        console.log('🎉 Database Setup Completed Successfully!');
    } catch (err) {
        console.error('❌ Database Setup Failed:', err.message);
    } finally {
        process.exit(0);
    }
}

setup();
