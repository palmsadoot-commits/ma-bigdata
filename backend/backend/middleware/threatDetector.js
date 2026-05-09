const db = require('../config/db');
const { sysLog } = require('../utils/logger');

// Cache สำหรับ IP ที่ถูกบล็อก (Refresh ทุก 1 นาที)
let blockedIpCache = new Set();
let lastCacheUpdate = 0;

const updateBlockedIpCache = async () => {
    try {
        const now = Date.now();
        if (now - lastCacheUpdate < 60000) return; // กรองความถี่การอัปเดต

        const [rows] = await db.query('SELECT ip_address FROM blocked_ips WHERE expires_at IS NULL OR expires_at > NOW()');
        blockedIpCache = new Set(rows.map(r => r.ip_address));
        lastCacheUpdate = now;
    } catch (err) {
        console.error('❌ Failed to update blocked IP cache:', err.message);
    }
};

/**
 * Threat Detection & Kill Chain Analysis Middleware
 */
const threatDetector = async (req, res, next) => {
    // 🚩 ข้ามคำขอประเภท OPTIONS (Preflight) เพื่อป้องกันการบันทึก Log ซ้ำซ้อน
    if (req.method === 'OPTIONS') return next();

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    
    // 1. ตรวจสอบการ Block IP ทันที
    await updateBlockedIpCache();
    if (blockedIpCache.has(ip)) {
        return res.status(403).json({ 
            status: 'error', 
            code: 'FORBIDDEN_IP',
            message: 'Your IP address has been blocked due to suspicious activity.' 
        });
    }

    // 2. วิเคราะห์ Threat Patterns
    const url = req.originalUrl || req.url;
    const userAgent = req.headers['user-agent'] || '';
    const body = JSON.stringify(req.body || {});
    const query = JSON.stringify(req.query || {});
    const fullPayload = `${url} ${body} ${query}`.toLowerCase();

    let detectedThreat = null;

    // --- A. Reconnaissance Phase ---
    const reconPatterns = [
        { regex: /\/\.env|\/\.git|\/phpmyadmin|\/\.aws|\/config\.php/i, type: 'Sensitive Path Discovery' },
        { regex: /nmap|masscan|sqlmap|nikto|acunetix|goby/i, type: 'Security Scanner', target: userAgent }
    ];

    for (const p of reconPatterns) {
        if (p.regex.test(p.target || url)) {
            detectedThreat = { phase: 'Reconnaissance', type: p.type };
            break;
        }
    }

    // --- B. Execution Phase (Exploitation) ---
    if (!detectedThreat) {
        const attackPatterns = [
            { regex: /union\s+select|select\s+.*\s+from|' or 1=1|--|#|xp_cmdshell/i, type: 'SQL Injection' },
            { regex: /<script|onerror=|onload=|javascript:|alert\(/i, type: 'Cross-Site Scripting (XSS)' },
            { regex: /\.\.\/|\.\.\\/i, type: 'Path Traversal' },
            { regex: /etc\/passwd|windows\/win\.ini/i, type: 'LFI/RFI Attempt' }
        ];

        for (const p of attackPatterns) {
            if (p.regex.test(fullPayload)) {
                detectedThreat = { phase: 'Execution', type: p.type };
                break;
            }
        }
    }

    // --- C. Persistence Phase (Maintaining Access) ---
    if (!detectedThreat) {
        const persistencePatterns = [
            { regex: /shell\.php|cmd\.php|upload\.php|backdoor|web-shell/i, type: 'Web Shell Access Attempt' },
            { regex: /\/api\/admin\/reset-password|\/api\/users\/promote/i, type: 'Privilege Escalation Attempt' }
        ];

        for (const p of persistencePatterns) {
            if (p.regex.test(url)) {
                detectedThreat = { phase: 'Persistence', type: p.type };
                break;
            }
        }
    }

    // 3. บันทึกและแจ้งเตือนเมื่อพบภัยคุกคาม
    if (detectedThreat) {
        try {
            // ✅ ประเมินความรุนแรง (Score) ตามขั้นตอน Kill Chain
            let score = 20; // Default LOW (Recon)
            if (detectedThreat.phase === 'Access') score = 50; // MEDIUM
            if (detectedThreat.phase === 'Execution') score = 80; // HIGH
            if (detectedThreat.phase === 'Persistence') score = 100; // CRITICAL

            const sql = `
                INSERT INTO threat_logs (ip_address, kill_chain_phase, attack_type, target_url, method, payload, headers, threat_score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            await db.query(sql, [
                ip,
                detectedThreat.phase,
                detectedThreat.type,
                url,
                req.method,
                fullPayload.substring(0, 1000), 
                JSON.stringify(req.headers),
                score
            ]);

            // แจ้งเตือนความปลอดภัยระดับสูง
            await sysLog('CRITICAL', 'SECURITY', `⚠️ Security Threat Detected: ${detectedThreat.type} from ${ip}`, {
                req,
                metadata: { phase: detectedThreat.phase, type: detectedThreat.type }
            });

        } catch (err) {
            console.error('❌ Threat Logger Error:', err.message);
        }
    }

    next();
};

module.exports = threatDetector;
