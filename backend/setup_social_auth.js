const db = require('./config/db');

async function setupSocialAuth() {
    console.log('🚀 Starting Social Auth Database Migration...');
    
    const alterTableSql = `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS line_id VARCHAR(255) DEFAULT NULL AFTER email,
        ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) DEFAULT NULL AFTER line_id,
        ADD COLUMN IF NOT EXISTS social_profile_pic TEXT DEFAULT NULL AFTER user_photo,
        ADD COLUMN IF NOT EXISTS auth_provider ENUM('local', 'line', 'google') DEFAULT 'local' AFTER is_active,
        ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45) DEFAULT NULL AFTER auth_provider,
        ADD INDEX idx_line_id (line_id),
        ADD INDEX idx_google_id (google_id);
    `;

    try {
        // 1. ตรวจสอบการเชื่อมต่อ
        await db.query('SELECT 1');
        console.log('✅ Database connection successful.');

        // 2. ปรับปรุงตาราง
        await db.query(alterTableSql);
        console.log('✅ Table "users" updated successfully with social auth fields.');

        console.log('\n✨ Migration completed! You are ready for LINE & Google integration.');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        process.exit(0);
    }
}

setupSocialAuth();
