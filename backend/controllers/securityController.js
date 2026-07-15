const db = require('../config/db');

exports.getThreats = async (req, res, next) => {
    try {
        const { startDate, endDate, limit = 200, attack_type, kill_chain_phase } = req.query;
        let sql = 'SELECT * FROM threat_logs WHERE 1=1';
        const params = [];

        if (startDate) { sql += ' AND created_at >= ?'; params.push(startDate); }
        if (endDate) { sql += ' AND created_at <= ?'; params.push(endDate); }
        if (attack_type) { sql += ' AND attack_type = ?'; params.push(attack_type); }
        if (kill_chain_phase) { sql += ' AND kill_chain_phase = ?'; params.push(kill_chain_phase); }

        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let dateCondition = 'created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
        const params = [];

        if (startDate && endDate) {
            dateCondition = 'created_at >= ? AND created_at <= ?';
            params.push(startDate, endDate);
        }

        const [rows] = await db.query(`
            SELECT 
                kill_chain_phase as phase, 
                COUNT(*) as count 
            FROM threat_logs 
            WHERE ${dateCondition}
            GROUP BY kill_chain_phase
        `, params);
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

exports.getSecuritySettings = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM security_settings WHERE id = 1');
        res.json(rows[0] || {});
    } catch (err) { next(err); }
};

exports.updateSecuritySettings = async (req, res, next) => {
    const { 
        auto_block_enabled, 
        score_threshold, 
        attack_limit_per_hour, 
        block_duration_hours, 
        whitelist_ips,
        immediate_block_score,
        notify_admin
    } = req.body;
    
    console.log('📡 Updating Security Settings:', req.body);

    try {
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
        `, [
            auto_block_enabled ? 1 : 0, 
            score_threshold, 
            attack_limit_per_hour, 
            block_duration_hours, 
            whitelist_ips,
            immediate_block_score,
            notify_admin ? 1 : 0
        ]);

        console.log('✅ DB Update Result:', result);

        // ✅ แจ้งเตือน Middleware ผ่าน Global Flag (เลี่ยง Circular Dependency)
        global.securityCacheNeedsUpdate = true;
        
        res.json({ success: true, message: 'บันทึกการตั้งค่าความปลอดภัยเรียบร้อยแล้ว' });
    } catch (err) { 
        console.error('❌ Update Settings Error:', err.message);
        next(err); 
    }
};
