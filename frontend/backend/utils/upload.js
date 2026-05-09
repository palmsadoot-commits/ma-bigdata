const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// ฟังก์ชันกรองไฟล์ที่อนุญาต (Security Check)
const fileFilter = (req, file, cb) => {
    // ดึงค่าจาก system_settings (ใช้ Promise .then แทนเพื่อความเสถียรใน Multer)
    db.query('SELECT allowed_file_types, max_file_size_mb, security_strict_mode FROM system_settings WHERE id = 1')
        .then(([rows]) => {
            const settings = rows[0] || { 
                allowed_file_types: 'jpg,jpeg,png,pdf,doc,docx,xls,xlsx',
                max_file_size_mb: 5,
                security_strict_mode: 1
            };

            const allowedExtensions = settings.allowed_file_types.split(',').map(ext => ext.trim().toLowerCase());
            const fileExt = path.extname(file.originalname).toLowerCase().replace('.', '');
            
            // 1. ตรวจสอบนามสกุลไฟล์
            if (!allowedExtensions.includes(fileExt)) {
                return cb(new Error(`ประเภทไฟล์ .${fileExt} ไม่ได้รับอนุญาต! อนุญาตเฉพาะ: ${settings.allowed_file_types}`), false);
            }

            // 2. ตรวจสอบ MIME Type (ถ้าเปิด Strict Mode)
            if (settings.security_strict_mode === 1) {
                const mimeType = file.mimetype.toLowerCase();
                const dangerousMimes = ['application/x-msdownload', 'application/javascript', 'text/html', 'application/x-sh'];
                
                if (dangerousMimes.includes(mimeType)) {
                    return cb(new Error('ตรวจพบไฟล์ที่อาจเป็นอันตราย (Dangerous MIME Type)!'), false);
                }

                // ตรวจสอบความสอดคล้อง (Office & Common Formats)
                const mimeMap = {
                    'pdf': 'application/pdf',
                    'doc': 'application/msword',
                    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'xls': 'application/vnd.ms-excel',
                    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                };

                if (mimeMap[fileExt] && mimeType !== mimeMap[fileExt]) {
                    // ผ่อนปรนบางกรณีของ MS Office ที่ Browser อาจจะส่ง MIME มาไม่เหมือนกัน
                    if (!mimeType.includes('officedocument') && !mimeType.includes('ms-excel') && !mimeType.includes('msword')) {
                        return cb(new Error(`ไฟล์ .${fileExt} ไม่ถูกต้อง (MIME mismatch)!`), false);
                    }
                }

                if (['jpg', 'jpeg', 'png'].includes(fileExt) && !mimeType.startsWith('image/')) {
                    return cb(new Error('ไฟล์รูปภาพไม่ถูกต้อง (MIME mismatch)!'), false);
                }
            }

            cb(null, true);
        })
        .catch(err => {
            console.error("Multer FileFilter DB Error:", err);
            // กรณี DB พลาด ให้ใช้ค่ามาตรฐานที่ปลอดภัยและครอบคลุม
            const stdAllowed = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];
            const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
            if (stdAllowed.includes(ext)) return cb(null, true);
            cb(new Error('เกิดข้อผิดพลาดในการตรวจสอบประเภทไฟล์'), false);
        });
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});

const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/avatars/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const userId = req.body.user_id || 'unknown';
        cb(null, `avatar-${userId}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const uploadAvatar = multer({ 
    storage: avatarStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (extname) return cb(null, true);
        cb(new Error('รูปโปรไฟล์ต้องเป็นไฟล์ภาพเท่านั้น (JPG, PNG, GIF)'));
    },
    limits: { fileSize: 2 * 1024 * 1024 } 
});

module.exports = { upload, uploadAvatar };
