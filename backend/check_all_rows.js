const db = require('./config/db');
async function check() {
    try {
        const [rows] = await db.query('SELECT * FROM security_settings');
        console.log('--- ALL SECURITY SETTINGS ROWS ---');
        console.log(JSON.stringify(rows, null, 2));
        console.log('---------------------------------');
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit();
}
check();
