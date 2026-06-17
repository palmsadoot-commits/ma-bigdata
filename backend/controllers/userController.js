const db = require('../config/db');
const userService = require('../services/userService');
const jwt = require('jsonwebtoken');
const { logAction, sysLog } = require('../utils/logger');

// 🛡️ Brute-Force Protection Memory Cache
const failedAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000;

exports.login = async (req, res, next) => {
    const { username, password } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    let attempts = failedAttempts.get(ip) || { count: 0, lockUntil: null };
    if (attempts.lockUntil && attempts.lockUntil > Date.now()) {
        const remainingMins = Math.ceil((attempts.lockUntil - Date.now()) / 60000);
        await sysLog('WARN', 'SECURITY', `Blocked login attempt from locked IP: ${ip}`, { req, metadata: { username } });
        return res.status(429).json({ error: `ตรวจพบการสุ่มรหัสผ่าน! ถูกระงับการเข้าสู่ระบบชั่วคราว กรุณาลองใหม่ในอีก ${remainingMins} นาที` });
    }

    const handleFailedLogin = async (reasonMsg, dbUser = null) => {
        attempts.count += 1;
        if (attempts.count >= MAX_ATTEMPTS) attempts.lockUntil = Date.now() + LOCK_TIME;
        failedAttempts.set(ip, attempts);
        await sysLog('WARN', 'SECURITY', `Failed login attempt: ${reasonMsg} (${username})`, { 
            req, userId: dbUser ? dbUser.user_id : null, metadata: { username, reason: reasonMsg } 
        });
        await logAction(dbUser ? dbUser.user_id : null, 'LOGIN_FAILED', `Attempted username: ${username}`, req);
    };

    try {
        const result = await userService.validateLogin(username, password);
        
        if (!result.success) {
            await handleFailedLogin(result.reason, result.user);
            return res.status(401).json({ error: result.reason === 'User not found' ? 'ชื่อผู้ใช้งานไม่ถูกต้อง!' : 'รหัสผ่านไม่ถูกต้อง!' });
        }

        const user = result.user;
        failedAttempts.delete(ip);

        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, role: user.role }, 
            process.env.JWT_SECRET || 'fallback_secret', 
            { expiresIn: '12h' }
        );

        delete user.password_hash; 
        user.token = token; 

        await sysLog('INFO', 'ACCESS', `Successful login: User ${username}`, { 
            req, userId: user.user_id, metadata: { username, role: user.role } 
        });
        await logAction(user.user_id, 'LOGIN_SUCCESS', `User ${username} logged in`, req);

        res.json({ success: true, user: user });
    } catch (err) { next(err); }
};

exports.getUsers = async (req, res, next) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
    const userId = req.params.id;
    const { first_name, last_name, agency, role, project_id, new_password, email, is_active } = req.body;
    try {
        // ✅ ส่งค่าทั้งหมดไปยัง Service
        const result = await userService.updateUser(userId, { 
            first_name, 
            last_name, 
            agency, 
            role, 
            project_id,
            email,
            is_active
        }, new_password);


        
        const detailMessage = result.changes.length > 0 
            ? `แก้ไขข้อมูลผู้ใช้งาน ID ${userId}: ${result.changes.join(', ')}` 
            : `แก้ไขข้อมูลผู้ใช้งาน ID ${userId} (ไม่มีการเปลี่ยนแปลง)`;

        await sysLog('INFO', 'OPERATIONAL', detailMessage, { 
            userId: req.user?.user_id, req,
            metadata: { action: 'USER_UPDATED', target_user_id: userId, fields_changed: result.changes } 
        });
        await logAction(req.user?.user_id, 'USER_UPDATED', detailMessage, req);
        
        res.json({ success: true, message: 'อัปเดตข้อมูลสำเร็จ!' });
    } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.user_id; 
        const result = await userService.updateProfile(userId, req.body);
        
        const detailMessage = result.changes.length > 0 ? `แก้ไขข้อมูลส่วนตัว: ${result.changes.join(', ')}` : 'บันทึกข้อมูลส่วนตัว (ไม่มีการเปลี่ยนแปลง)';
        
        await sysLog('INFO', 'OPERATIONAL', detailMessage, { 
            userId, req, metadata: { action: 'PROFILE_UPDATED', fields_changed: result.changes } 
        });
        await logAction(userId, 'PROFILE_UPDATED', detailMessage, req);
        
        res.json({ success: true, message: 'อัปเดตข้อมูลส่วนตัวสำเร็จ' });
    } catch (err) { next(err); }
};

exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const user = await userService.getUserById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        delete user.password_hash;
        res.json(user);
    } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
    try {
        const userId = req.user?.user_id;
        const username = req.user?.username || 'Unknown';
        await sysLog('INFO', 'ACCESS', `User Logout: ${username}`, { req, userId, metadata: { action: 'LOGOUT', username } });
        await logAction(userId, 'LOGOUT', `User ${username} logged out`, req);
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) { next(err); }
};

exports.register = async (req, res, next) => {
    const { username, password, first_name, last_name, role, project_id, agency } = req.body;
    try {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(`INSERT INTO users (username, password_hash, first_name, last_name, role, project_id, agency) VALUES (?, ?, ?, ?, ?, ?, ?)`, [username, hashedPassword, first_name, last_name, role, project_id || null, agency || null]);
        await logAction(req.user?.user_id, 'USER_REGISTERED', `New user registered: ${username} (${role})`, req);
        res.json({ success: true, message: 'User registered successfully' });
    } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await userService.getUserById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await db.query('DELETE FROM users WHERE user_id = ?', [userId]);
        await sysLog('WARN', 'OPERATIONAL', `ลบผู้ใช้งาน: ${user.username} (ID: ${userId}) ออกจากระบบ`, { 
            userId: req.user?.user_id, req, metadata: { action: 'USER_DELETED', target_user_id: userId } 
        });
        await logAction(req.user?.user_id, 'USER_DELETED', `Deleted user ID: ${userId}`, req);
        res.json({ success: true, message: 'ลบผู้ใช้งานออกจากระบบเรียบร้อยแล้ว' });
    } catch (err) { next(err); }
};

exports.uploadAvatar = async (req, res, next) => {
    try {
        const { user_id } = req.body;
        if (!user_id || !req.file) return res.status(400).json({ error: 'กรุณาเลือกไฟล์ภาพ' });
        await db.query(`UPDATE users SET user_photo = ? WHERE user_id = ?`, [req.file.filename, user_id]);
        await sysLog('INFO', 'OPERATIONAL', `อัปโหลดรูปโปรไฟล์ใหม่: ${req.file.filename}`, { userId: user_id, req, metadata: { action: 'AVATAR_UPLOADED' } });
        res.json({ success: true, filename: req.file.filename, message: 'อัปโหลดรูปโปรไฟล์สำเร็จ' });
    } catch (err) { next(err); }
};

exports.updatePassword = async (req, res, next) => {
    const { user_id, old_password, new_password } = req.body;
    try {
        const user = await userService.getUserById(user_id);
        if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });

        const bcrypt = require('bcrypt');
        const crypto = require('crypto');
        let isMatch = false;
        if (user.password_hash.length === 32) isMatch = (crypto.createHash('md5').update(old_password).digest('hex') === user.password_hash);
        else isMatch = await bcrypt.compare(old_password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });

        await db.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [await bcrypt.hash(new_password, 10), user_id]);
        await sysLog('INFO', 'SECURITY', `ผู้ใช้เปลี่ยนรหัสผ่านของตนเอง`, { userId: user_id, req, metadata: { action: 'PASSWORD_CHANGED' } });
        res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ!' });
    } catch (err) { next(err); }
};

exports.getTechnicians = async (req, res, next) => {
    const project_id = req.query.project_id;
    try {
        let sql = `SELECT user_id, CONCAT(first_name, ' ', last_name) AS full_name FROM users WHERE role IN ('technician', 'head_technician') AND status = 'active'`;
        let params = [];
        if (project_id) { sql += ` AND project_id = ?`; params.push(project_id); }
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) { next(err); }
};

exports.completeProfile = async (req, res, next) => {
    try {
        const userId = req.user.user_id;
        const { project_id, agency, position, telephone, mobile, first_name, last_name, email, username, password } = req.body;

        // 🛡️ ขั้นตอนการตรวจสอบความซ้ำซ้อน (Backend Reinforcement)
        
        // 1. ตรวจสอบ Username ซ้ำ
        const [existingUser] = await db.query('SELECT user_id FROM users WHERE username = ? AND user_id != ?', [username, userId]);
        if (existingUser.length > 0) return res.status(400).json({ error: 'ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว กรุณาใช้ชื่ออื่น' });

        // 2. ตรวจสอบ Email ซ้ำ
        const [existingEmail] = await db.query('SELECT user_id FROM users WHERE email = ? AND user_id != ?', [email, userId]);
        if (existingEmail.length > 0) return res.status(400).json({ error: 'อีเมลนี้ถูกลงทะเบียนไว้แล้วในระบบ' });

        // 🛡️ จัดการ Password Hashing
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash(password, 10);

        // 📝 บันทึกข้อมูลลงฐานข้อมูล
        // อัปเดตข้อมูลทั้งหมด และเปลี่ยนสถานะให้ไม่ต้อง Onboarding อีก
        // หากมีการตั้งรหัสผ่าน ให้ถือว่าเป็น account ที่สมบูรณ์
        await db.query(
            `UPDATE users SET 
                project_id = ?, agency = ?, position = ?, 
                telephone = ?, mobile = ?, first_name = ?, 
                last_name = ?, email = ?, username = ?, 
                password_hash = ?, is_active = 1
             WHERE user_id = ?`,
            [
                project_id, agency, position, 
                telephone || null, mobile, first_name, 
                last_name, email, username, 
                passwordHash, userId
            ]
        );

        await logAction(userId, 'COMPLETE_PROFILE', `User completed onboarding and set hybrid credentials (User: ${username})`, req);
        await sysLog('INFO', 'ACCESS', `New hybrid user initialized: ${username}`, { userId, req });

        res.json({ success: true, message: 'บันทึกข้อมูลสำเร็จ ยินดีต้อนรับเข้าสู่ระบบครับ' });
    } catch (err) { next(err); }
};
