const db = require('../config/db');
const { broadcastAlert } = require('./sse');

/**
 * Enterprise System Logger
 * @param {string} level - INFO, WARN, ERROR, CRITICAL
 * @param {string} category - ACCESS, TRAFFIC, SECURITY, ERROR, SYSTEM, OPERATIONAL
 * @param {string} message - Human readable message
 * @param {object} options - { userId, req, duration, metadata, traceId }
 */
const sysLog = async (level, category, message, options = {}) => {
    try {
        const { userId, req, duration, metadata, traceId } = options;
        let ipAddress = 'unknown';
        let method = null;
        let path = null;
        let activeTraceId = traceId || null;

        if (req) {
            ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
            method = req.method;
            path = req.originalUrl || req.url;
            if (!activeTraceId && req.traceId) activeTraceId = req.traceId;
        }

        const sql = `
            INSERT INTO system_logs (level, category, message, trace_id, user_id, ip_address, method, path, duration, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(sql, [
            level || 'INFO',
            category || 'SYSTEM',
            message,
            activeTraceId,
            userId || null,
            ipAddress,
            method,
            path,
            duration || null,
            metadata ? JSON.stringify(metadata) : null
        ]);

        // ✅ กระจายสัญญาณไปยังหน้าจอ Admin ทันที (Live Notification)
        broadcastAlert(level, category, message, metadata);

        // ✅ สำหรับ CRITICAL Error ให้ส่ง Alert ทาง Email & LINE
        if (level === 'CRITICAL') {
            try {
                const { sendEmail, sendLineNotify } = require('../services/notificationService');
                const alertMessage = `🚨 [CRITICAL ALERT]\nTrace ID: ${activeTraceId || 'N/A'}\nMessage: ${message}\nCategory: ${category}\nPath: ${path || 'N/A'}\nIP: ${ipAddress}`;
                
                // ส่งแบบ Non-blocking เพื่อไม่ให้กระทบ Performance หลัก
                sendEmail(`CRITICAL ERROR: ${message.substring(0, 50)}`, alertMessage);
                sendLineNotify(alertMessage);
            } catch (notifyErr) {
                console.error('⚠️ Failed to send critical alert notification:', notifyErr.message);
            }
        }

    } catch (err) {
        console.error('❌ Logger Error:', err.message);
    }
};

/**
 * Backward compatibility for legacy audit logs
 */
const logAction = async (userId, action, detail, req = null) => {
    let ipAddress = 'unknown';
    let traceId = null;

    if (req) { 
        ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'; 
        traceId = req.traceId || null;
    }

    try {
        await db.query(
            'INSERT INTO audit_logs (user_id, action, detail, ip_address) VALUES (?, ?, ?, ?)',
            [userId, action, detail, ipAddress]
        );
    } catch (err) { console.error('❌ Failed to log action:', err.message); }

    // บันทึกลง system_logs ใหม่
    await sysLog('INFO', 'SECURITY', `${action}: ${detail}`, { userId, req, traceId });
};


module.exports = { sysLog, logAction };

