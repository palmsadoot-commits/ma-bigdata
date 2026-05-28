const db = require('./config/db');
async function check() {
    try {
        const [rows] = await db.query('SELECT * FROM security_settings WHERE id = 1');
        console.log('Current Settings in DB:', JSON.stringify(rows[0], null, 2));
    } catch (e) {
        console.error('Error checking settings:', e.message);
    }
    process.exit();
}
check();
