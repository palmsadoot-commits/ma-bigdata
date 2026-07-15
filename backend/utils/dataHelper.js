/**
 * centralize data cleaning and conversion helpers
 */
const geoip = require('geoip-lite');

const toNull = (val) => (val === '' || val === undefined || val === 'null' || val === null) ? null : val;

const toInt = (val, defaultVal = null) => {
    if (val === '' || val === undefined || val === null) return defaultVal;
    const parsed = parseInt(val);
    return isNaN(parsed) ? defaultVal : parsed;
};

const toFloat = (val, defaultVal = null) => {
    if (val === '' || val === undefined || val === null) return defaultVal;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? defaultVal : parsed;
};

// Improved XSS filter for better prevention (Express 5 Compatible)
const simpleSanitize = (html) => {
    if (!html || typeof html !== 'string') return html;
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove onEvent="auth()" or onEvent='auth()'
        .replace(/on\w+\s*=\s*[^\s>]+/gi, '') // Remove onEvent=auth() (no quotes)
        .replace(/javascript:\s*[^"'>\s]*/gi, '') // Remove javascript: protocol
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, ''); // Remove objects
};


// ✅ ฟังก์ชันดึง IP Address จริง (Real IP Resolution) ที่ต้านการปลอมแปลง (Spoofing-Resistant)
const getRealIp = (req) => {
    if (!req) return 'unknown';
    
    // ดึงค่า TCP socket IP จริงจากตัวการเชื่อมต่อ
    let socketIp = req.socket.remoteAddress || '';
    if (socketIp && typeof socketIp === 'string') {
        if (socketIp.includes('::ffff:')) {
            socketIp = socketIp.split(':').pop();
        }
        if (socketIp === '::1') socketIp = '127.0.0.1';
    }

    // ฟังก์ชันตรวจสอบว่า IP ต้นทางเป็น Proxy/Network ภายในหรือไม่
    const isTrustedLocalProxy = (ip) => {
        return ip === '127.0.0.1' || 
               ip === '::1' || 
               ip.startsWith('10.') || 
               ip.startsWith('192.168.') || 
               /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);
    };

    // เชื่อถือ Header เฉพาะเมื่อคำขอส่งมาจาก Proxy ภายในหรือ Localhost เท่านั้น
    if (isTrustedLocalProxy(socketIp)) {
        const clientPublicIp = req.headers['x-client-public-ip'];
        const cfIp = req.headers['cf-connecting-ip'];
        const realIp = req.headers['x-real-ip'];
        const forwarded = req.headers['x-forwarded-for'];
        
        let ip = clientPublicIp || cfIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : socketIp);
        
        if (ip && typeof ip === 'string') {
            if (ip.includes('::ffff:')) {
                ip = ip.split(':').pop();
            }
            if (ip === '::1') return '127.0.0.1';
        }
        return ip || 'unknown';
    }

    // กรณีอื่น ๆ (เชื่อมต่อมาจากข้างนอกโดยตรง) จะไม่เชื่อถือ Header ใด ๆ เพื่อป้องกัน IP Spoofing
    return socketIp || 'unknown';
};

// ✅ ฟังก์ชันระบุตำแหน่งทางภูมิศาสตร์
const getGeoLocation = (ip) => {
    // 1. ตรวจสอบ Localhost และ Private IP (LAN)
    const isPrivate = (ip) => {
        return ip === '127.0.0.1' || ip === '::1' || 
               ip.startsWith('192.168.') || 
               ip.startsWith('10.') || 
               /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);
    };

    if (!ip || isPrivate(ip)) {
        return { country: 'Local', city: 'Internal Network', region: '' };
    }

    const geo = geoip.lookup(ip);
    if (!geo) return { country: 'Unknown', city: 'Unknown', region: '' };
    
    // 2. แปลงรหัสประเทศ และจัดการกรณีชื่อเมืองว่าง
    const countryNames = { 'TH': 'Thailand', 'US': 'USA', 'JP': 'Japan', 'CN': 'China', 'SG': 'Singapore' };
    const country = countryNames[geo.country] || geo.country;
    
    // ถ้าไม่มีชื่อเมือง แต่มีประเทศ ให้แสดงแค่ประเทศหรือระบุเป็นพื้นที่หลัก
    let city = geo.city || '';
    let region = geo.region || '';

    if (geo.timezone && geo.timezone.includes('Bangkok')) {
        if (!city) city = 'Bangkok';
        if (!region) region = 'Central Thailand';
    }

    return {
        country: country,
        city: city || 'Main Region',
        region: region || 'N/A'
    };
};

module.exports = {
    toNull,
    toInt,
    toFloat,
    simpleSanitize,
    getRealIp,
    getGeoLocation
};
