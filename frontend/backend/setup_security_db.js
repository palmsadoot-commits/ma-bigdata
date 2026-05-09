const db = require('./config/db');

const setupSecurityDb = async () => {
    try {
        console.log('🛡️ กำลังเตรียมโครงสร้างฐานข้อมูลระบบความปลอดภัย (Security Dashboard)...');

        // 1. ตารางเก็บ Log ภัยคุกคาม (Kill Chain Analysis)
        const createThreatLogs = `
            CREATE TABLE IF NOT EXISTS threat_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ip_address VARCHAR(50) NOT NULL,
                kill_chain_phase ENUM('Reconnaissance', 'Access', 'Execution', 'Persistence') NOT NULL,
                attack_type VARCHAR(100) NOT NULL,
                target_url VARCHAR(255),
                method VARCHAR(10),
                payload TEXT,
                headers TEXT,
                threat_score INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (ip_address),
                INDEX (kill_chain_phase)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        // 2. ตารางเก็บ IP ที่ถูกปิดกั้น (Block List)
        const createBlockedIps = `
            CREATE TABLE IF NOT EXISTS blocked_ips (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ip_address VARCHAR(50) NOT NULL UNIQUE,
                reason TEXT,
                blocked_by VARCHAR(100) DEFAULT 'System',
                expires_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (ip_address)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;

        await db.query(createThreatLogs);
        console.log('✅ สร้างตาราง threat_logs เรียบร้อยแล้ว');

        await db.query(createBlockedIps);
        console.log('✅ สร้างตาราง blocked_ips เรียบร้อยแล้ว');

        // 3. เพิ่มเมนู Security ลงในฐานข้อมูล (ถ้ายังไม่มี)
        await db.query(`
            UPDATE system_menus 
            SET title = 'Security & Logs' 
            WHERE title = 'System Logs'
        `);
        
        console.log('🚀 โครงสร้างฐานข้อมูลระบบความปลอดภัยพร้อมใช้งาน!');
        process.exit(0);
    } catch (err) {
        console.error('❌ เกิดข้อผิดพลาดในการติดตั้งฐานข้อมูล:', err.message);
        process.exit(1);
    }
};

setupSecurityDb();
