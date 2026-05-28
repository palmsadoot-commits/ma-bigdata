const db = require('./config/db');
const threatDetector = require('./middleware/threatDetector');

async function testUpdate() {
    try {
        console.log('Attempting to update settings...');
        const [result] = await db.query(`
            UPDATE security_settings 
            SET 
                auto_block_enabled = ?, 
                score_threshold = ?, 
                attack_limit_per_hour = ?, 
                block_duration_hours = ?, 
                whitelist_ips = ?,
                immediate_block_score = ?,
                notify_admin = ?
            WHERE id = 1
        `, [0, 100, 10, 24, '127.0.0.1', 80, 1]);
        
        console.log('Update result:', result);
        
        if (threatDetector && threatDetector.resetCache) {
            console.log('Resetting cache...');
            threatDetector.resetCache();
        } else {
            console.log('threatDetector.resetCache not found!');
        }
        
        const [rows] = await db.query('SELECT * FROM security_settings WHERE id = 1');
        console.log('New Settings in DB:', JSON.stringify(rows[0], null, 2));
    } catch (e) {
        console.error('Test failed:', e);
    }
    process.exit();
}
testUpdate();
