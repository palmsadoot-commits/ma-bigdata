require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupGDrive() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        // 1. สร้างตารางการตั้งค่า GDrive
        await db.query(`
            CREATE TABLE IF NOT EXISTS gdrive_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                client_id VARCHAR(255),
                client_secret VARCHAR(255),
                refresh_token TEXT,
                folder_id VARCHAR(255),
                sync_targets VARCHAR(255) DEFAULT 'database,source',
                schedule_type VARCHAR(50) DEFAULT 'daily',
                schedule_days VARCHAR(50),
                schedule_time TIME,
                is_active TINYINT(1) DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Insert แถวเริ่มต้นถ้ายังไม่มี
        const [rows] = await db.query('SELECT * FROM gdrive_settings LIMIT 1');
        if (rows.length === 0) {
            await db.query(`
                INSERT INTO gdrive_settings (client_id, client_secret, refresh_token, folder_id, schedule_time) 
                VALUES ('', '', '', '', '06:00:00')
            `);
        }

        // 2. สร้างตารางเก็บ Log ของ GDrive Sync
        await db.query(`
            CREATE TABLE IF NOT EXISTS gdrive_sync_logs (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                sync_targets VARCHAR(255),
                status VARCHAR(255),
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Google Drive Tables Created Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating tables:', err);
        process.exit(1);
    }
}

setupGDrive();
