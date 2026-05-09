const { sysLog } = require('../utils/logger');
const crypto = require('crypto');

/**
 * Enterprise Traffic Logger Middleware
 * Captures request details, response status, and duration
 */
const trafficLogger = async (req, res, next) => {
    // 🚩 กรอง OPTIONS ทิ้งทันที (ไม่ควรบันทึกลง DB เลย)
    if (req.method === 'OPTIONS') return next();

    // ✅ สร้าง Trace ID สำหรับทุก Request เพื่อการแกะรอยที่แม่นยำ
    req.traceId = crypto.randomUUID();
    res.setHeader('X-Trace-Id', req.traceId);

    const start = Date.now();
    
    // บันทึกเฉพาะ API (ไม่บันทึก Static Files เช่น รูปภาพ/CSS)
    if (!req.url.startsWith('/api/')) return next();

    // รอให้ Response เสร็จสิ้น (เพื่อให้ Middleware ตัวอื่นๆ เช่น Auth ทำงานเสร็จก่อน)
    res.on('finish', async () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const level = statusCode >= 400 ? (statusCode >= 500 ? 'ERROR' : 'WARN') : 'INFO';
        const category = 'TRAFFIC';
        
        // ดักจับ User ID (จะปรากฏถ้า API นั้นผ่าน middleware auth มาแล้ว)
        // หรือดักจับจาก Request Body/Header เผื่อเคสที่ไม่ได้ใช้ Token ปกติ
        const userId = req.user ? req.user.user_id : null;

        // ไม่บันทึก Log ของตัวดึง Log เอง (ป้องกัน Loop)
        if (req.url.includes('/api/audit') || req.url.includes('/api/system-logs')) return;

        const message = `${req.method} ${req.originalUrl || req.url} - ${statusCode} (${duration}ms)`;
        
        await sysLog(level, category, message, {
            userId,
            req,
            duration,
            traceId: req.traceId,
            metadata: {
                userAgent: req.headers['user-agent'],
                query: req.query,
                statusCode: statusCode
            }
        });
    });

    next();
};

module.exports = trafficLogger;

