const db = require('../config/db');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { logAction, sysLog } = require('../utils/logger');

// DEBUG: ตรวจสอบค่า Configuration เมื่อ Backend เริ่มทำงาน
console.log('--- 🛡️ Social Auth Configuration Status ---');
console.log('LINE_ID:', process.env.LINE_LOGIN_CHANNEL_ID ? '✅ Loaded' : '❌ Missing');
console.log('GOOGLE_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Loaded' : '❌ Missing');
console.log('GOOGLE_CALLBACK:', process.env.GOOGLE_CALLBACK_URL || '❌ Missing');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || '❌ Missing'); // ✅ เพิ่มการตรวจสอบ URL
console.log('------------------------------------------');

/**
 * 🧠 Unified Social Identity Handler (The "Smart" Logic)
 * จัดการการระบุตัวตน การผูกบัญชีอัตโนมัติ และการบันทึกประวัติการเข้าใช้งาน
 */
async function handleSocialLogin(profile, provider, req) {
    const { id, email, displayName, pictureUrl } = profile;
    const idField = `${provider}_id`; // google_id หรือ line_id
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];
    
    // 1. ค้นหาด้วย Social ID (รวดเร็วที่สุด)
    let [users] = await db.query(`SELECT * FROM users WHERE ${idField} = ?`, [id]);
    let user = users[0];

    // 2. ถ้าไม่เจอ Social ID ให้ค้นหาด้วย Email (Smart Account Linking)
    if (!user && email) {
        [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
            user = users[0];
            // ผูกบัญชีให้อัตโนมัติเพราะอีเมลตรงกัน
            await db.query(
                `UPDATE users SET ${idField} = ?, social_profile_pic = ?, last_login_ip = ?, auth_provider = ? WHERE user_id = ?`,
                [id, pictureUrl, ip, provider, user.user_id]
            );
            await logAction(user.user_id, 'ACCOUNT_LINKED', `Automatically linked ${provider} account via email matching`, req);
            
            // 🧠 สำคัญ: ดึงข้อมูลใหม่ทั้งหมดจาก DB เพื่อให้ได้ฟิลด์อื่นๆ (เบอร์โทร, โครงการ, ฯลฯ)
            const [updatedUsers] = await db.query('SELECT * FROM users WHERE user_id = ?', [user.user_id]);
            user = updatedUsers[0];
        }
    }

    // 3. ถ้ายังไม่เจอ (User ใหม่) -> สร้างบัญชีใหม่ (Auto Register)
    if (!user) {
        const username = `${provider}_${id.substring(0, 8)}`;
        const [result] = await db.query(
            `INSERT INTO users (username, password_hash, email, first_name, last_name, ${idField}, social_profile_pic, auth_provider, last_login_ip, role) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [username, 'SOCIAL_AUTH_NO_PASSWORD', email, displayName, '', id, pictureUrl, provider, ip, 'technician']
        );
        const [newUsers] = await db.query('SELECT * FROM users WHERE user_id = ?', [result.insertId]);
        user = newUsers[0];
        await logAction(user.user_id, 'REGISTER_SOCIAL', `Registered new user via ${provider}: ${username} (Default role: technician)`, req);
    } else {
        // อัปเดตข้อมูลล่าสุด (IP, รูปโปรไฟล์)
        await db.query(
            'UPDATE users SET last_login_ip = ?, social_profile_pic = ? WHERE user_id = ?',
            [ip, pictureUrl, user.user_id]
        );
        // 🧠 ดึงข้อมูลล่าสุดอีกครั้งเพื่อความแม่นยำ 100%
        const [refreshedUsers] = await db.query('SELECT * FROM users WHERE user_id = ?', [user.user_id]);
        user = refreshedUsers[0];
    }

    return user;
}

// --- LINE AUTHENTICATION ---

exports.lineLogin = (req, res) => {
    const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
    const redirectUri = encodeURIComponent(process.env.LINE_LOGIN_CALLBACK_URL);
    const state = 'lmis_line_' + Math.random().toString(36).substring(7);
    const scope = 'profile%20openid%20email';
    res.redirect(`https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`);
};

exports.lineCallback = async (req, res) => {
    const { code, error, linking, user_id: linkingUserId } = req.query;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    if (error) return res.redirect(`${process.env.FRONTEND_URL}/login?error=line_denied`);

    try {
        const tokenResponse = await axios.post('https://api.line.me/oauth2/v2.1/token', 
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: linking ? `${process.env.LINE_LOGIN_CALLBACK_URL}?linking=true&user_id=${linkingUserId}` : process.env.LINE_LOGIN_CALLBACK_URL,
                client_id: process.env.LINE_LOGIN_CHANNEL_ID,
                client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET
            }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const { access_token, id_token } = tokenResponse.data;
        const profileResponse = await axios.get('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const idTokenPayload = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64').toString());
        const profile = {
            id: profileResponse.data.userId,
            email: idTokenPayload.email,
            displayName: profileResponse.data.displayName,
            pictureUrl: profileResponse.data.pictureUrl
        };

        if (linking === 'true' && linkingUserId) {
            await db.query('UPDATE users SET line_id = ?, social_profile_pic = ? WHERE user_id = ?', [profile.id, profile.pictureUrl, linkingUserId]);
            await logAction(linkingUserId, 'ACCOUNT_LINKED', `User manually linked LINE account from profile`, req);
            return res.redirect(`${process.env.FRONTEND_URL}/profile?linked=success`);
        }

        const user = await handleSocialLogin(profile, 'line', req);
        issueTokenAndRedirect(res, user);

    } catch (err) {
        handleAuthError(err, res, 'LINE', ip);
    }
};

exports.linkLine = (req, res) => {
    const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
    const userId = req.query.user_id;
    const redirectUri = encodeURIComponent(`${process.env.LINE_LOGIN_CALLBACK_URL}?linking=true&user_id=${userId}`);
    res.redirect(`https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${redirectUri}&state=linking&scope=profile%20openid%20email`);
};

// --- GOOGLE AUTHENTICATION ---

exports.googleLogin = (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL;
    
    console.log('--- 🔍 Google Auth Attempt ---');
    console.log('Sending redirect_uri:', redirectUri);
    console.log('------------------------------');

    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID' || !redirectUri) {
        console.error('❌ Google Auth Configuration Missing in .env');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=config_missing`);
    }

    const scope = encodeURIComponent('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email');
    const state = 'lmis_google_' + Math.random().toString(36).substring(7);
    
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`);
};

exports.googleCallback = async (req, res) => {
    const { code, error, linking, user_id: linkingUserId } = req.query;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    if (error) return res.redirect(`${process.env.FRONTEND_URL}/login?error=google_denied`);

    try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: linking ? `${process.env.GOOGLE_CALLBACK_URL}?linking=true&user_id=${linkingUserId}` : process.env.GOOGLE_CALLBACK_URL,
            grant_type: 'authorization_code'
        });

        const { access_token } = tokenResponse.data;
        const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const profile = {
            id: profileResponse.data.id,
            email: profileResponse.data.email,
            displayName: profileResponse.data.name,
            pictureUrl: profileResponse.data.picture
        };

        if (linking === 'true' && linkingUserId) {
            await db.query('UPDATE users SET google_id = ?, social_profile_pic = ? WHERE user_id = ?', [profile.id, profile.pictureUrl, linkingUserId]);
            await logAction(linkingUserId, 'ACCOUNT_LINKED', `User manually linked Google account from profile`, req);
            return res.redirect(`${process.env.FRONTEND_URL}/profile?linked=success`);
        }

        const user = await handleSocialLogin(profile, 'google', req);
        issueTokenAndRedirect(res, user);

    } catch (err) {
        handleAuthError(err, res, 'Google', ip);
    }
};

exports.linkGoogle = (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const userId = req.query.user_id;
    const redirectUri = encodeURIComponent(`${process.env.GOOGLE_CALLBACK_URL}?linking=true&user_id=${userId}`);
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=profile%20email&state=linking`);
};

// --- HELPERS ---

const userService = require('../services/userService');

function issueTokenAndRedirect(res, user) {
    // 🧠 ใช้ Logic รวมศูนย์จาก Service
    const userData = userService.getSafeUserData(user);

    const token = jwt.sign(
        { user_id: user.user_id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '12h' }
    );

    res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
}

async function handleAuthError(err, res, provider, ip) {
    const errorDetail = err.response?.data || err.message;
    console.error(`❌ ${provider} Auth Error:`, errorDetail);
    await sysLog('ERROR', 'AUTH', `${provider} Auth failed: ${err.message}`, { metadata: { ip, details: errorDetail } });
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
}
