const db = require('./config/db');
async function fix() {
    try {
        await db.query('DELETE FROM blocked_ips WHERE ip_address IN ("::1", "127.0.0.1", "::ffff:127.0.0.1")');
        console.log('✅ Unblocked local IPs');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fix();
