const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        console.log(`[Auth] No token provided for ${req.method} ${req.url}`);
        return res.status(401).json({ 
            status: 'error',
            code: 'UNAUTHORIZED',
            message: 'กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ' 
        });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'fallback_secret' || secret === 'your_jwt_secret') {
        console.warn('⚠️ CRITICAL SECURITY WARNING: JWT_SECRET is missing or insecure! System might be vulnerable.');
    }

    // ✅ ป้องกัน Algorithm Confusion Attack โดยบังคับใช้ HS256 เท่านั้น
    jwt.verify(token, secret || 'fallback_secret', { algorithms: ['HS256'] }, (err, user) => {
        if (err) {
            console.log(`[Auth] Token verification failed: ${err.message}`);
            return res.status(401).json({ 
                status: 'error',
                code: 'TOKEN_INVALID',
                message: 'เซสชันหมดอายุหรือรหัสผ่านไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' 
            });
        }
        req.user = user; 
        next();
    });
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                status: 'error',
                code: 'FORBIDDEN',
                message: 'ขออภัย คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขข้อมูลในส่วนนี้' 
            });
        }
        next();
    };
};

module.exports = { authenticateToken, requireRole };

