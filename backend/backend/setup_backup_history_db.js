const db = require('./config/db');

const setupBackupHistory = async () => {
    try {
        console.log('🔄 กำลังสร้างตาราง backup_tasks_history...');
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS backup_tasks_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                task_type ENUM('db', 'source', 'github', 'gdrive') NOT NULL,
                scheduled_date DATE NOT NULL,
                scheduled_time TIME NOT NULL,
                status ENUM('pending', 'success', 'error', 'missed') DEFAULT 'pending',
                completed_at DATETIME NULL,
                log_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_task (task_type, scheduled_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
        
        await db.query(createTableQuery);
        console.log('✅ สร้างตาราง backup_tasks_history เรียบร้อยแล้ว!');

        // ✅ สร้างข้อมูลย้อนหลัง 30 วัน เพื่อให้ปฏิทินมีข้อมูลทันที (Simulation)
        // ในระบบจริง ข้อมูลจะถูกสร้างโดย Cron Job รายวัน
        console.log('🔄 กำลังตรวจสอบและสร้างข้อมูลย้อนหลัง...');
        // ... โค้ดส่วนนี้จะรันผ่าน Service อีกที

        process.exit(0);
    } catch (err) {
        console.error('❌ เกิดข้อผิดพลาด:', err.message);
        process.exit(1);
    }
};

setupBackupHistory();
