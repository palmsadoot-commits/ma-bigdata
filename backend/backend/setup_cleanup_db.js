const db = require('./config/db');

async function setupCleanup() {
    try {
        console.log('🔄 อัปเดตชื่อเมนูในระบบ (Backup & Cleanup)...');
        await db.query(`UPDATE system_menus SET title = 'Backup & Cleanup', icon = 'SafetyCertificateOutlined' WHERE path = '/backup'`);
        
        console.log('✅ เปลี่ยนชื่อเมนูสำหรับ Auto Cleanup เรียบร้อยแล้ว!');
        process.exit(0);
    } catch (err) {
        console.error('❌ พบข้อผิดพลาด:', err.message);
        process.exit(1);
    }
}

setupCleanup();
