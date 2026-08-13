const db = require('../config/db');
const { sysLog } = require('../utils/logger');
const { getRealIp, getGeoLocation } = require('../utils/dataHelper');

// Cache สำหรับ IP ที่ถูกบล็อก และการตั้งค่าความปลอดภัย
let blockedIpCache = new Set();
let securitySettingsCache = null;
let lastCacheUpdate = 0;

// In-memory cache for tracking active threat scores and attack counts per IP (spoofing and DDoS protection)
const activeThreatsCache = new Map();

// เคลียร์ข้อมูล Cache ประวัติภัยคุกคามของ IP ที่ไม่มีการเคลื่อนไหวเกิน 1 ชั่วโมง เพื่อป้องกัน Memory Leak
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of activeThreatsCache.entries()) {
        if (now - data.lastSeen > 3600000) {
            activeThreatsCache.delete(ip);
        }
    }
}, 300000); // ทำงานทุกๆ 5 นาที
const updateSecurityCache = async () => {
    try {
        const now = Date.now();
        // รีเฟรชเมื่อครบ 30 วินาที หรือเมื่อมีการสั่งอัปเดตผ่าน Global Flag
        if (now - lastCacheUpdate < 30000 && !global.securityCacheNeedsUpdate) return; 

        // 1. ดึง IP ที่ถูกบล็อก
        const [blockedRows] = await db.query('SELECT ip_address FROM blocked_ips WHERE expires_at IS NULL OR expires_at > NOW()');
        blockedIpCache = new Set(blockedRows.map(r => r.ip_address));

        // 2. ดึงการตั้งค่าความปลอดภัย
        const [settingsRows] = await db.query('SELECT * FROM security_settings WHERE id = 1');
        securitySettingsCache = settingsRows[0] || {
            auto_block_enabled: true,
            score_threshold: 100,
            attack_limit_per_hour: 10,
            block_duration_hours: 24,
            whitelist_ips: '127.0.0.1, ::1, localhost',
            immediate_block_score: 80,
            notify_admin: true
        };

        lastCacheUpdate = now;
        global.securityCacheNeedsUpdate = false; // Reset flag
        console.log('🛡️ Security Cache Updated');
    } catch (err) {
        console.error('❌ Failed to update security cache:', err.message);
    }
};

const isWhitelisted = (ip) => {
    if (!securitySettingsCache || !securitySettingsCache.whitelist_ips) return false;
    const whitelist = securitySettingsCache.whitelist_ips.split(',').map(item => item.trim());
    return whitelist.includes(ip) || ip === '::ffff:127.0.0.1';
};

/**
 * 🚨 Automated IP Blocking Logic (IPS)
 */
const autoBlockIp = async (ip, score, reason) => {
    if (isWhitelisted(ip) || !securitySettingsCache.auto_block_enabled) return false;

    try {
        const now = Date.now();
        let cached = activeThreatsCache.get(ip);
        
        // หากไม่มี cache หรือเป็นข้อมูลที่เก่ากว่า 1 ชั่วโมง ให้สร้างตัวเก็บประวัติชุดใหม่
        if (!cached || (now - cached.startTime > 3600000)) {
            cached = { totalScore: 0, attackCount: 0, startTime: now, lastSeen: now };
        }
        
        // บันทึกและสะสมค่าคะแนนภัยคุกคามในหน่วยความจำ (แทนการไป SELECT SUM ในฐานข้อมูล)
        cached.totalScore += score;
        cached.attackCount += 1;
        cached.lastSeen = now;
        activeThreatsCache.set(ip, cached);

        if (
            cached.totalScore >= securitySettingsCache.score_threshold || 
            cached.attackCount >= securitySettingsCache.attack_limit_per_hour || 
            score >= securitySettingsCache.immediate_block_score
        ) {
            let expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + securitySettingsCache.block_duration_hours);

            // บันทึกลงฐานข้อมูลเพื่อการจดจำ IP ที่ถูกบล็อกแบบถาวร (Persistence)
            await db.query(
                'INSERT INTO blocked_ips (ip_address, reason, blocked_by, expires_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE reason=VALUES(reason), expires_at=VALUES(expires_at)',
                [
                    ip, 
                    `Auto-blocked: ${reason} (Cumulative Score: ${cached.totalScore}, Peak Score: ${score})`, 
                    'System-AutoBlock',
                    expiresAt
                ]
            );
            
            // อัปเดตในหน่วยความจำทันทีเพื่อให้การบล็อกมีผลใน request ถัดไปทันที (Realtime protection)
            blockedIpCache.add(ip);
            
            // ลบประวัติความถี่ความพยายามออกจาก cache หลังจาก IP ถูกบล็อกไปแล้ว
            activeThreatsCache.delete(ip);
            
            return true;
        }
        return false;
    } catch (err) {
        console.error('❌ Auto-Block Error:', err.message);
        return false;
    }
};

const threatDetector = async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();

    // ✅ ดึง Real IP จาก Global Middleware หรือฟังก์ชันกลาง
    const ip = req.realIp || getRealIp(req);
    
    await updateSecurityCache();
    
    if (!isWhitelisted(ip) && blockedIpCache.has(ip)) {
        return res.status(403).json({ 
            status: 'error', 
            code: 'FORBIDDEN_IP',
            message: 'Your IP address has been blocked due to suspicious activity.' 
        });
    }

    const url = req.originalUrl || req.url;
    if (req.headers.upgrade?.toLowerCase() === 'websocket' || url.includes('token=')) {
        return next();
    }

    const userAgent = req.headers['user-agent'] || '';
    let decodedUrl = '';
    try { decodedUrl = decodeURIComponent(url); } catch (e) { decodedUrl = url; }
    
    const body = JSON.stringify(req.body || {});
    const query = JSON.stringify(req.query || {});
    const fullPayload = `${decodedUrl} ${body} ${query}`.toLowerCase();

    let detectedThreat = null;
    let score = 0;

    // --- Threat Analysis ---
    const reconPatterns = [
        { regex: /^\/(\.env|\.git|\.aws|\.ssh|config\.php|backup|dump|phpmyadmin)/i, type: 'Sensitive Path Discovery' },
        { regex: /nmap|masscan|sqlmap|nikto|acunetix|goby|zgrab|cyberchef/i, type: 'Security Scanner', target: userAgent },
        { regex: /\/@fs\/|\/node_modules\/|package\.json|vite\.config/i, type: 'Dev Environment Leak Discovery' }
    ];

    if (!decodedUrl.startsWith('/api/')) {
        for (const p of reconPatterns) {
            if (p.regex.test(p.target || decodedUrl)) {
                detectedThreat = { phase: 'Reconnaissance', type: p.type };
                score = 30;
                break;
            }
        }
    }

    if (!detectedThreat) {
        const attackPatterns = [
            { regex: /union\s+all\s+select|select\s+.*\s+from|' or 1=1|--|#|xp_cmdshell|information_schema|group_concat/i, type: 'SQL Injection' },
            { regex: /<script|onerror=|onload=|javascript:|alert\(|confirm\(|prompt\(|document\.cookie/i, type: 'Cross-Site Scripting (XSS)' },
            { regex: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i, type: 'Path Traversal' },
            { regex: /etc\/passwd|windows\/win\.ini|proc\/self\/environ/i, type: 'LFI/RFI Attempt' },
            { regex: /eval\(|base64_decode|system\(|exec\(|passthru\(|shell_exec\(/i, type: 'Remote Code Execution (RCE) Attempt' }
        ];

        for (const p of attackPatterns) {
            if (p.regex.test(fullPayload)) {
                detectedThreat = { phase: 'Execution', type: p.type };
                score = 85; 
                break;
            }
        }
    }

    if (!detectedThreat) {
        const persistencePatterns = [
            { regex: /shell\.php|cmd\.php|upload\.php|backdoor|web-shell|c99\.php|r57\.php/i, type: 'Web Shell Access Attempt' },
            { regex: /\/api\/admin\/promote|\/api\/users\/promote|GRANT\s+ALL\s+PRIVILEGES/i, type: 'Privilege Escalation Attempt' }
        ];

        for (const p of persistencePatterns) {
            if (p.regex.test(decodedUrl) || p.regex.test(fullPayload)) {
                detectedThreat = { phase: 'Persistence', type: p.type };
                score = 100;
                break;
            }
        }
    }

    res.on('finish', async () => {
        if (detectedThreat && !isWhitelisted(ip)) {
            try {
                const isBlocked = await autoBlockIp(ip, score, detectedThreat.type);
                const geo = getGeoLocation(ip);
                
                // ✅ ใช้รูปแบบที่สวยงาม: City, Country (เช่น Bangkok, Thailand)
                let locationStr = 'Unknown';
                if (geo.country === 'Local') {
                    locationStr = 'Internal Network';
                } else if (geo.country !== 'Unknown') {
                    locationStr = `${geo.city}, ${geo.country}`;
                }
                
                const sql = `
                    INSERT INTO threat_logs (ip_address, location, kill_chain_phase, attack_type, target_url, method, payload, headers, threat_score, status_code, is_blocked)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                await db.query(sql, [
                    ip, locationStr, detectedThreat.phase, detectedThreat.type, url, req.method,
                    fullPayload.substring(0, 1000), JSON.stringify(req.headers), score,
                    res.statusCode, isBlocked
                ]);

                if (securitySettingsCache.notify_admin) {
                    const alertLevel = score >= 80 ? 'CRITICAL' : 'WARNING';
                    await sysLog(alertLevel, 'SECURITY', `⚠️ ${isBlocked ? '[AUTO-BLOCKED]' : '[REJECTED]'} ${detectedThreat.type} from ${ip}`, {
                        req, metadata: { phase: detectedThreat.phase, type: detectedThreat.type, score, autoBlocked: isBlocked, status: res.statusCode }
                    });
                }

                // 🛡️ ส่งแจ้งเตือนภัยคุกคามความปลอดภัยผ่าน LINE / Email (ตามค่าที่เปิดไว้ใน System Settings)
                try {
                    const [sysRows] = await db.query('SELECT notify_security_line, notify_security_email, admin_email FROM system_settings WHERE id = 1');
                    const sysConf = sysRows[0] || {};
                    const notifyLine = Number(sysConf.notify_security_line) === 1;
                    const notifyEmail = Number(sysConf.notify_security_email) === 1;

                    if (notifyLine || notifyEmail) {
                        const { sendLineNotify, sendEmail } = require('../services/notificationService');
                        const secMsg = `🛡️ [แจ้งเตือนความปลอดภัย Security Alert]\n` +
                                       `📌 สถานะ: ${isBlocked ? '⛔ บล็อก IP อัตโนมัติ (AUTO-BLOCKED)' : '⚠️ สกัดกั้นภัยคุกคาม (REJECTED)'}\n` +
                                       `🌐 ผู้โจมตี (IP): ${ip}\n` +
                                       `📍 ตำแหน่ง: ${locationStr}\n` +
                                       `⚔️ ขั้นตอน (Kill Chain): ${detectedThreat.phase}\n` +
                                       `🎯 ประเภท: ${detectedThreat.type}\n` +
                                       `🔗 Target: ${url}\n` +
                                       `📊 คะแนนความเสี่ยง: ${score}/100\n` +
                                       `⏰ เวลา: ${new Date().toLocaleString('th-TH')}`;

                        if (notifyLine) {
                            await sendLineNotify(secMsg);
                        }
                        if (notifyEmail && sysConf.admin_email) {
                            await sendEmail(`🚨 [Security Alert] ${isBlocked ? 'Auto-Blocked IP ' + ip : detectedThreat.type}`, secMsg);
                        }
                    }
                } catch (secErr) {
                    console.error('❌ Failed sending Security Alert notifications:', secErr.message);
                }
            } catch (err) {
                console.error('❌ Threat Logger Error:', err.message);
            }
        }
    });

    if (detectedThreat && !isWhitelisted(ip)) {
        return res.status(403).json({
            status: 'error',
            code: 'SECURITY_VIOLATION',
            message: 'Request rejected due to potential security threat.'
        });
    }

    next();
};

module.exports = threatDetector;
