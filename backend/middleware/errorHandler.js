const { sysLog } = require('../utils/logger');

const { ZodError } = require('zod');

const errorHandler = async (err, req, res, next) => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 🛡️ Handle Zod Validation Errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'ข้อมูลไม่ถูกต้อง',
            details: err.errors.map(zErr => ({
                field: zErr.path.join('.'),
                message: zErr.message
            }))
        });
    }

    const statusCode = err.status || 500;
    
    // 🚩 บันทึก Error ลง Database (หัวใจสำคัญของระบบ World Class)
    const level = statusCode >= 500 ? 'ERROR' : 'WARN';
    const category = 'ERROR';
    const message = `[System Error] ${err.message || 'Unknown Error'}`;

    await sysLog(level, category, message, {
        userId: req.user ? req.user.user_id : null,
        req,
        metadata: {
            stack: err.stack,
            details: err.details || null,
            body: req.body, // ช่วยให้รู้ว่า Payload ไหนที่ทำให้ระบบพัง
            query: req.query
        }
    });

    // แสดง Error ใน Console สำหรับการ Debug ในตัวเครื่อง
    console.error(`❌ [${new Date().toISOString()}] ${req.method} ${req.url} Error:`, err.message);
    if (isDevelopment) console.error(err.stack);

    res.status(statusCode).json({
        error: statusCode >= 500 ? 'Server Error' : 'Request Error',
        message: err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
        // ✅ ส่งรายละเอียดเชิงลึกเฉพาะในโหมด Development
        details: isDevelopment ? (err.details || err.stack) : 'กรุณาติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่'
    });
};

module.exports = errorHandler;
