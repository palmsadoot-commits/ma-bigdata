const db = require('./backend/config/db');

const updateSecuritySettingsDb = async () => {
    try {
        console.log('🛡️ กำลังเพิ่มตารางกำหนดค่าความปลอดภัย (Security Settings)...');

        const createSecuritySettings = `
            CREATE TABLE IF NOT EXISTS security_settings (
                id INT PRIMARY KEY DEFAULT 1,
                auto_block_enabled BOOLEAN DEFAULT TRUE,
                score_threshold INT DEFAULT 100,
                attack_limit_per_hour INT DEFAULT 10,
                block_duration_hours INT DEFAULT 24,
                whitelist_ips TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        await db.query(createSecuritySettings);
        
        // Insert default values if not exists
        await db.query(`
            INSERT IGNORE INTO security_settings (id, auto_block_enabled, score_threshold, attack_limit_per_hour, block_duration_hours, whitelist_ips)
            VALUES (1, TRUE, 100, 10, 24, '127.0.0.1, ::1, localhost')
        `);

        console.log('✅ เพิ่มตาราง security_settings และค่าเริ่มต้นเรียบร้อยแล้ว');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating security database:', err.message);
        process.exit(1);
    }
};

updateSecuritySettingsDb();
