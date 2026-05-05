const db = require('../config/db');

exports.getThreats = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM threat_logs ORDER BY created_at DESC LIMIT 100');
        res.json(rows);
    } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                kill_chain_phase as phase, 
                COUNT(*) as count 
            FROM threat_logs 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            GROUP BY kill_chain_phase
        `);
        res.json(rows);
    } catch (err) { next(err); }
};

exports.getBlockedIps = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM blocked_ips ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { next(err); }
};

exports.blockIp = async (req, res, next) => {
    const { ip_address, reason, expires_in_hours } = req.body;
    try {
        let expiresAt = null;
        if (expires_in_hours) {
            expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + parseInt(expires_in_hours));
        }

        await db.query(
            'INSERT INTO blocked_ips (ip_address, reason, blocked_by, expires_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE reason=VALUES(reason), expires_at=VALUES(expires_at)',
            [ip_address, reason, `Admin ID: ${req.user.user_id}`, expiresAt]
        );
        res.json({ success: true, message: `IP ${ip_address} has been blocked.` });
    } catch (err) { next(err); }
};

exports.unblockIp = async (req, res, next) => {
    const { ip_address } = req.body;
    try {
        await db.query('DELETE FROM blocked_ips WHERE ip_address = ?', [ip_address]);
        res.json({ success: true, message: `IP ${ip_address} has been unblocked.` });
    } catch (err) { next(err); }
};
