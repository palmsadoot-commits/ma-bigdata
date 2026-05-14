const db = require('../config/db');
const { sysLog } = require('../utils/logger');

// Cache สำหรับ IP ที่ถูกบล็อก และการตั้งค่าความปลอดภัย
let blockedIpCache = new Set();
let securitySettingsCache = null;
let lastCacheUpdate = 0;

/**
 * 🛡️ Hardened Threat Detector & Auto-Blocker
 */
const updateSecurityCache = async () => {
    try {
        const now = Date.now();
        if (now - lastCacheUpdate < 30000) return; 

        // 1. ดึง IP ที่ถูกบล็อก
        const [blockedRows] = await db.query('SELECT ip_address FROM blocked_ips WHERE expires_at IS NULL OR expires_at > NOW()');
        blockedIpCache = new Set(blockedRows.map(r => r.ip_address));

        // 2. ดึงการตั้งค่าความปลอดภัย (รองรับฟีเจอร์ใหม่)
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
        const [rows] = await db.query(
            'SELECT SUM(threat_score) as total_score, COUNT(*) as attack_count FROM threat_logs WHERE ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
            [ip]
        );
        
        const totalScore = (rows[0].total_score || 0) + score;
        const attackCount = (rows[0].attack_count || 0) + 1;

        // เงื่อนไขการบล็อกแบบ Full Configuration:
        // 1. คะแนนสะสมเกินเกณฑ์ (Accumulative Score)
        // 2. ความถี่การโจมตีเกินกำหนด (Attack Frequency)
        // 3. เป็นการโจมตีระดับร้ายแรง (Immediate Block Score)
        if (
            totalScore >= securitySettingsCache.score_threshold || 
            attackCount >= securitySettingsCache.attack_limit_per_hour || 
            score >= securitySettingsCache.immediate_block_score
        ) {
            let expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + securitySettingsCache.block_duration_hours);

            await db.query(
                'INSERT INTO blocked_ips (ip_address, reason, blocked_by, expires_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE reason=VALUES(reason), expires_at=VALUES(expires_at)',
                [
                    ip, 
                    `Auto-blocked: ${reason} (Cumulative Score: ${totalScore}, Peak Score: ${score})`, 
                    'System-AutoBlock',
                    expiresAt
                ]
            );
            
            lastCacheUpdate = 0; 
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

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
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
                score = 85; // จะถูกบล็อกทันทีหากเกณฑ์ immediate_block_score คือ 80
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
                const sql = `
                    INSERT INTO threat_logs (ip_address, kill_chain_phase, attack_type, target_url, method, payload, headers, threat_score, status_code, is_blocked)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                await db.query(sql, [
                    ip, detectedThreat.phase, detectedThreat.type, url, req.method,
                    fullPayload.substring(0, 1000), JSON.stringify(req.headers), score,
                    res.statusCode, isBlocked
                ]);

                if (securitySettingsCache.notify_admin) {
                    const alertLevel = score >= 80 ? 'CRITICAL' : 'WARNING';
                    await sysLog(alertLevel, 'SECURITY', `⚠️ ${isBlocked ? '[AUTO-BLOCKED]' : '[REJECTED]'} ${detectedThreat.type} from ${ip}`, {
                        req, metadata: { phase: detectedThreat.phase, type: detectedThreat.type, score, autoBlocked: isBlocked, status: res.statusCode }
                    });
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
