const db = require('../config/db');

/**
 * ดึง Audit Logs เดิม (Action ของ User)
 */
exports.getAuditLogs = async (req, res) => {
    try {
        const sql = `
            SELECT a.*, u.username, CONCAT(u.first_name, ' ', u.last_name) as fullname 
            FROM audit_logs a 
            LEFT JOIN users u ON a.user_id = u.user_id 
            ORDER BY a.created_at DESC 
            LIMIT 500
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching audit logs:", err);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};

/**
 * ดึง System Logs (World Class Observability)
 */
exports.getSystemLogs = async (req, res) => {
    try {
        const { level, category, search, limit = 500, offset = 0, startDate, endDate } = req.query;
        let sql = `
            SELECT s.*, u.username, u.first_name, u.last_name, 
                   CONCAT(u.first_name, ' ', u.last_name) as fullname 
            FROM system_logs s 
            LEFT JOIN users u ON s.user_id = u.user_id 
            WHERE 1=1
        `;
        const params = [];

        // ✅ Date Range Filter
        if (startDate) { sql += " AND s.timestamp >= ?"; params.push(startDate); }
        if (endDate) { sql += " AND s.timestamp <= ?"; params.push(endDate); }

        if (level) { sql += " AND s.level = ?"; params.push(level); }
        if (category) { sql += " AND s.category = ?"; params.push(category); }
        if (search) { 
            sql += " AND (s.message LIKE ? OR s.path LIKE ? OR s.ip_address LIKE ?)"; 
            const searchVal = `%${search}%`;
            params.push(searchVal, searchVal, searchVal);
        }

        sql += " ORDER BY s.timestamp DESC LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching system logs:", err);
        res.status(500).json({ error: 'Failed to fetch system logs' });
    }
};

/**
 * ดึงสถิติภาพรวมสำหรับ Dashboard (รองรับ Date Range Filter)
 */
exports.getLogStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // ✅ กำหนดเงื่อนไขช่วงเวลา: ใช้ค่าจาก query params หรือ fallback เป็น 24 ชม.ล่าสุด
        let dateCondition = 'timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)';
        let timelineCondition = 'timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        const dateParams = [];
        const timelineDateParams = [];

        if (startDate && endDate) {
            dateCondition = 'timestamp >= ? AND timestamp <= ?';
            timelineCondition = 'timestamp >= ? AND timestamp <= ?';
            dateParams.push(startDate, endDate);
            timelineDateParams.push(startDate, endDate);
        }

        // 1. นับจำนวน Log แยกตาม Level
        const [levelStats] = await db.query(`
            SELECT level, COUNT(*) as count 
            FROM system_logs 
            WHERE ${dateCondition}
            GROUP BY level
        `, [...dateParams]);

        // 2. นับจำนวน Log แยกตาม Category
        const [categoryStats] = await db.query(`
            SELECT category, COUNT(*) as count 
            FROM system_logs 
            WHERE ${dateCondition}
            GROUP BY category
        `, [...dateParams]);

        // 3. สถิติรวมแยกตามวัน (แยกตามประเภทความสำคัญ)
        const [errorTimeline] = await db.query(`
            SELECT 
                DATE(timestamp) as date, 
                SUM(IF(level = 'ERROR', 1, 0)) as error_count,
                SUM(IF(level = 'CRITICAL', 1, 0)) as critical_count,
                SUM(IF(category = 'SECURITY', 1, 0)) as security_count,
                SUM(IF(category = 'ACCESS', 1, 0)) as access_count
            FROM system_logs 
            WHERE (level IN ('ERROR', 'CRITICAL') OR category IN ('SECURITY', 'ACCESS'))
            AND ${timelineCondition}
            GROUP BY DATE(timestamp)
            ORDER BY date ASC
        `, [...timelineDateParams]);

        // 4. API Traffic ที่ช้าที่สุด (Top 5 Slow APIs)
        const [slowApis] = await db.query(`
            SELECT method, path, AVG(duration) as avg_duration, COUNT(*) as call_count
            FROM system_logs
            WHERE category = 'TRAFFIC' AND duration IS NOT NULL
            ${startDate && endDate ? 'AND timestamp >= ? AND timestamp <= ?' : ''}
            GROUP BY method, path
            ORDER BY avg_duration DESC
            LIMIT 5
        `, startDate && endDate ? [startDate, endDate] : []);

        // ✅ 5. ดึงรายการ IP ต้องสงสัย (Security Active Defense)
        const [suspiciousIPs] = await db.query(`
            SELECT 
                ip_address, 
                COUNT(*) as failed_attempts, 
                MAX(timestamp) as last_attempt
            FROM system_logs
            WHERE message LIKE 'Failed login%' 
            AND ${dateCondition}
            GROUP BY ip_address
            HAVING failed_attempts >= 3
            ORDER BY failed_attempts DESC
            LIMIT 10
        `, [...dateParams]);

        res.json({
            levelStats,
            categoryStats,
            errorTimeline,
            slowApis,
            suspiciousIPs
        });
    } catch (err) {
        console.error("Error fetching log stats:", err);
        res.status(500).json({ error: 'Failed to fetch log stats' });
    }
};
