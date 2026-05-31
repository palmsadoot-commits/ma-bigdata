const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { toNull, toInt, toFloat } = require('../utils/dataHelper');
const { logAction, sysLog } = require('../utils/logger');
const { sendLineNotify, sendEmail } = require('../services/notificationService');
const { exec, spawn } = require('child_process');
const axios = require('axios');
let ngrok = null;
try { ngrok = require('ngrok'); } catch (e) {}

let currentNgrokUrl = null;
let lastCapturedLineId = null;

// ดึงข้อมูลการตั้งค่าทั้งหมด
exports.getSettings = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM system_settings WHERE id = 1');
        if (rows.length === 0) {
            await db.query(`INSERT IGNORE INTO system_settings (id, system_name) VALUES (1, 'LMIS Big Data')`);
            const [newRows] = await db.query('SELECT * FROM system_settings WHERE id = 1');
            return res.json(newRows[0]);
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

// อัปเดตข้อมูลการตั้งค่า
exports.updateSettings = async (req, res) => {
    try {
        const body = req.body || {};
        const [oldRows] = await db.query('SELECT * FROM system_settings WHERE id = 1');
        const oldData = oldRows[0] || {};
        const fields = [];
        const params = [];
        let changes = [];

        const addField = (col, val, type = 'string') => {
            let newVal;
            const oldVal = oldData[col];
            if (val === undefined && type !== 'bool') return;
            if (type === 'bool') newVal = (val === '1' || val === 1 || val === true || val === 'true') ? 1 : 0;
            else if (type === 'int') newVal = toInt(val, oldVal);
            else if (type === 'float') newVal = toFloat(val, oldVal);
            else newVal = (val === '' || val === 'null' || val === null) ? null : val;
            fields.push(`${col} = ?`);
            params.push(newVal);
        };

        addField('system_name', body.system_name);
        addField('agency_name', body.agency_name);
        addField('enable_line', body.enable_line, 'bool');
        addField('notify_backup_status', body.notify_backup_status, 'bool'); // ✅ เพิ่มฟิลด์ใหม่
        addField('enable_email', body.enable_email, 'bool');
        addField('notify_new_ticket', body.notify_new_ticket, 'bool');
        addField('notify_status_change', body.notify_status_change, 'bool');
        addField('line_notify_token', body.line_notify_token);
        addField('line_group_id', body.line_group_id);
        addField('ngrok_authtoken', body.ngrok_authtoken);
        addField('smtp_host', body.smtp_host);
        addField('smtp_port', body.smtp_port);
        addField('smtp_user', body.smtp_user);
        addField('smtp_pass', body.smtp_pass);
        addField('admin_email', body.admin_email);
        addField('allowed_file_types', body.allowed_file_types);
        addField('default_sla_hours', body.default_sla_hours, 'int');
        addField('default_penalty_rate', body.default_penalty_rate, 'float');
        addField('max_file_size_mb', body.max_file_size_mb, 'int');
        addField('security_strict_mode', body.security_strict_mode, 'bool');
        addField('sla_hardware_hours', body.sla_hardware_hours, 'int');
        addField('sla_software_hours', body.sla_software_hours, 'int');
        addField('sla_app_hours', body.sla_app_hours, 'int');
        addField('ack_limit_hours', body.ack_limit_hours, 'int');
        addField('maintenance_mode', body.maintenance_mode, 'bool');
        addField('msg_template_new', body.msg_template_new);
        addField('msg_template_update', body.msg_template_update);
        addField('theme_mode', body.theme_mode);
        addField('primary_color', body.primary_color);
        addField('system_font', body.system_font);
        addField('error_404_active', body.error_404_active, 'bool');
        addField('error_500_active', body.error_500_active, 'bool');

        if (req.files) {
            if (req.files['system_logo']) { fields.push('system_logo = ?'); params.push(req.files['system_logo'][0].filename); }
            if (req.files['system_favicon']) { fields.push('system_favicon = ?'); params.push(req.files['system_favicon'][0].filename); }
        }

        await db.query(`UPDATE system_settings SET ${fields.join(', ')} WHERE id = 1`, params);
        res.json({ success: true, message: 'บันทึกสำเร็จ' });
    } catch (err) { res.status(500).json({ error: 'Update failed' }); }
};

// ทดสอบส่ง LINE
exports.testLineConnection = async (req, res) => {
    try {
        const testMessage = `🔔 [ทดสอบ] LINE Connection OK\nเวลา: ${new Date().toLocaleString('th-TH')}`;
        await sendLineNotify(testMessage);
        res.json({ success: true, message: 'ส่งข้อความทดสอบสำเร็จ' });
    } catch (err) { res.status(500).json({ error: 'ล้มเหลว' }); }
};

// ทดสอบส่ง Email
exports.testEmailConnection = async (req, res) => {
    try {
        await sendEmail('🔔 Test Email', 'SMTP Connection Success');
        res.json({ success: true, message: 'ส่งอีเมลทดสอบสำเร็จ' });
    } catch (err) { res.status(500).json({ error: 'ล้มเหลว' }); }
};

// ตรวจสอบสุขภาพระบบ
exports.getSystemHealth = async (req, res) => {
    try {
        const os = require('os');
        const { execSync } = require('child_process');
        const [dbVersionRows] = await db.query('SELECT VERSION() as version');
        const dbVersion = dbVersionRows[0]?.version || 'Unknown';

        // --- ⚙️ Health Scoring Logic (5 Dimensions) ---
        let totalScore = 0;

        // 1. Database Health (30%)
        let dbScore = 30;
        if (!dbVersion || dbVersion === 'Unknown') dbScore = 0;
        totalScore += dbScore;

        // 2. Memory Health (20%)
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
        let memScore = 20;
        if (memUsagePercent > 95) memScore = 2;
        else if (memUsagePercent > 85) memScore = 10;
        else if (memUsagePercent > 70) memScore = 15;
        totalScore += memScore;

        // 3. Disk Storage Health (20%)
        let diskInfo = { total: '0 GB', free: '0 GB', used_percent: 0 };
        let diskScore = 20;
        try {
            const psOutput = execSync('powershell.exe -NoProfile -Command "Get-PSDrive C | Select-Object Used, Free | ConvertTo-Json"').toString();
            const diskData = JSON.parse(psOutput);
            const total = diskData.Used + diskData.Free;
            const usedPercent = (diskData.Used / total) * 100;
            diskInfo = {
                total: (total / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
                free: (diskData.Free / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
                used_percent: parseFloat(usedPercent.toFixed(1))
            };
            if (usedPercent > 95) diskScore = 2;
            else if (usedPercent > 85) diskScore = 10;
            else if (usedPercent > 70) diskScore = 15;
        } catch (e) { diskScore = 0; }
        totalScore += diskScore;

        // 4. Folder Permissions (20%)
        const targetFolders = [
            { name: 'uploads', path: path.resolve(__dirname, '..', 'uploads') },
            { name: 'backups', path: path.resolve(__dirname, '..', '..', 'backups') }
        ];
        let folderScore = 0;
        const folders = [];
        targetFolders.forEach(folder => {
            let status = 'Writable';
            try { 
                fs.accessSync(folder.path, fs.constants.W_OK); 
                folderScore += 10; 
            } catch (e) { status = 'Error/Read-only'; }
            folders.push({ name: folder.name, status });
        });
        totalScore += folderScore;

        // 5. Process & Runtime (10%)
        let processScore = 10;
        const heapUsed = process.memoryUsage().heapUsed / (1024 * 1024);
        if (heapUsed > 500) processScore = 5; // Simple threshold
        totalScore += processScore;

        // --- 📊 Final Status Determination ---
        let healthStatus = 'OPTIMIZED';
        if (totalScore < 40) healthStatus = 'CRITICAL';
        else if (totalScore < 70) healthStatus = 'WARNING';
        else if (totalScore < 90) healthStatus = 'HEALTHY';

        const health = {
            status: healthStatus,
            score: totalScore,
            score_details: {
                database: dbScore,
                memory: memScore,
                disk: diskScore,
                folders: folderScore,
                process: processScore
            },
            server_time: new Date().toLocaleString('th-TH'),
            node_version: process.version,
            os: {
                platform: os.platform(),
                release: os.release(),
                arch: os.arch(),
                cpus: os.cpus().length,
                total_mem: (totalMem / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
                free_mem: (freeMem / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
                uptime: (process.uptime() / 3600).toFixed(2) + ' Hours',
                disk: diskInfo
            },
            database: {
                status: 'Connected',
                version: dbVersion,
                pool_limit: 10
            },
            process: {
                memory_usage: heapUsed.toFixed(2) + ' MB',
                pid: process.pid
            },
            folders: folders
        };

        res.json(health);
    } catch (err) { 
        console.error('Health Check Error:', err);
        res.status(500).json({ error: 'Health info failed' }); 
    }
};

// LINE Webhook (Interactive Postback Support)
exports.lineWebhook = async (req, res) => {
    const { replyMessage, sendUpdateTicketFlex } = require('../services/notificationService');
    const querystring = require('querystring');

    console.log('--- 📨 Incoming LINE Webhook ---');
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Body:', JSON.stringify(req.body));

    try {
        const events = req.body.events || [];
        
        if (events.length === 0) {
            console.log('ℹ️ Webhook Verify/Empty event received');
            return res.sendStatus(200);
        }

        for (const event of events) {
            const capturedId = event.source?.groupId || event.source?.userId || event.source?.roomId;
            if (capturedId) {
                lastCapturedLineId = capturedId;
                console.log('📍 Captured ID:', capturedId);
            }

            // ... (rest of the logic) ...
            if (event.type === 'postback') {
                const data = querystring.parse(event.postback.data);
                const lineUserId = event.source.userId;

                if (data.action === 'accept_job' && data.ticket_no) {
                    // ก) ค้นหาข้อมูลช่างจาก line_id
                    const [userRows] = await db.query(
                        'SELECT user_id, first_name, last_name, vendor_id FROM users WHERE line_id = ? AND role IN ("technician", "head_technician", "admin")',
                        [lineUserId]
                    );
                    
                    if (userRows.length === 0) {
                        await replyMessage(event.replyToken, '❌ ไม่พบข้อมูลช่างในระบบ หรือคุณยังไม่ได้ผูกบัญชี LINE');
                        continue;
                    }

                    const technician = userRows[0];
                    const techName = `${technician.first_name} ${technician.last_name}`;

                    // ข) อัปเดตใบงาน
                    const [ticketRows] = await db.query('SELECT ticket_id, status_id FROM tickets WHERE ticket_number = ?', [data.ticket_no]);
                    if (ticketRows.length === 0) {
                        await replyMessage(event.replyToken, '❌ ไม่พบใบงานที่ระบุ');
                        continue;
                    }

                    const ticket = ticketRows[0];
                    if (ticket.status_id !== 1) { // 1 = Pending
                        await replyMessage(event.replyToken, '⚠️ ใบงานนี้ถูกรับไปแล้วหรือไม่อยู่ในสถานะรอดำเนินการ');
                        continue;
                    }

                    // ค) ดึงข้อมูล Vendor (ถ้ามี)
                    const [vendorRows] = await db.query('SELECT vendor_name FROM vendors WHERE vendor_id = ?', [technician.vendor_id]);
                    const vendorName = vendorRows[0]?.vendor_name || 'In-house';

                    // ง) บันทึกการรับงาน
                    await db.query(
                        `UPDATE tickets SET 
                            assigned_to = ?, 
                            assigned_to_name_snap = ?, 
                            assigned_to_vendor_snap = ?, 
                            status_id = 2, 
                            status = "In Progress", 
                            acknowledged_at = NOW(), 
                            updated_at = NOW() 
                        WHERE ticket_id = ?`, 
                        [technician.user_id, techName, vendorName, ticket.ticket_id]
                    );

                    // จ) ตอบกลับและแจ้งเตือนกลุ่ม
                    await replyMessage(event.replyToken, `✅ รับงานเลขที่ ${data.ticket_no} สำเร็จ!\nผู้ดำเนินการ: ${techName}`);
                    
                    // แจ้งอัปเดตในกลุ่มด้วย Flex Message
                    await sendUpdateTicketFlex({
                        no: data.ticket_no,
                        status: '🛠️ กำลังดำเนินการ (In Progress)',
                        by: techName
                    });
                }
            }

            // --- 2. Handle Text Messages (Optional: e.g., Register) ---
            if (event.type === 'message' && event.message.type === 'text') {
                const text = event.message.text.trim();
                if (text.toLowerCase() === 'id') {
                    await replyMessage(event.replyToken, `LINE ID ของคุณคือ:\n${event.source.userId}`);
                }
            }
        }
        res.sendStatus(200);
    } catch (err) { 
        console.error('❌ Webhook Error:', err.message);
        res.sendStatus(500); 
    }
};

// 📡 Ngrok Controller (Robust Spawn Method)
exports.startNgrok = async (req, res) => {
    const { authtoken } = req.body;
    const port = process.env.PORT || 3000;
    const ngrokBin = path.resolve(__dirname, '..', 'node_modules', 'ngrok', 'bin', 'ngrok.exe');

    try {
        console.log('🔄 Ngrok Start Initiated...');
        
        // 1. Kill any existing ngrok
        await new Promise(r => exec('taskkill /F /IM ngrok.exe /T', () => r()));
        currentNgrokUrl = null;

        // 2. Set token
        if (authtoken) {
            await new Promise(r => exec(`"${ngrokBin}" authtoken ${authtoken}`, () => r()));
        }

        // 3. Spawn background process
        const proc = spawn(ngrokBin, ['http', port], { detached: true, stdio: 'ignore' });
        proc.unref();

        // 4. Poll Local API (localhost:4040) to get the URL
        let found = false;
        for (let i = 0; i < 15; i++) { // Retry 15 times (15s)
            await new Promise(r => setTimeout(r, 1000));
            try {
                const apiRes = await axios.get('http://127.0.0.1:4040/api/tunnels');
                if (apiRes.data?.tunnels?.[0]?.public_url) {
                    currentNgrokUrl = apiRes.data.tunnels[0].public_url;
                    found = true;
                    break;
                }
            } catch (e) {}
        }

        if (found) {
            console.log(`✅ Ngrok Active: ${currentNgrokUrl}`);
            res.json({ success: true, url: `${currentNgrokUrl}/api/settings/webhook` });
        } else {
            res.status(500).json({ error: 'Ngrok API Timeout', tip: 'กรุณาตรวจสอบว่าใส่ Authtoken หรือยัง' });
        }

    } catch (err) {
        res.status(500).json({ error: 'Ngrok Failure', details: err.message });
    }
};

exports.stopNgrok = async (req, res) => {
    try {
        await new Promise(r => exec('taskkill /F /IM ngrok.exe /T', () => r()));
        currentNgrokUrl = null;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Stop failed' }); }
};

exports.getWebhookStatus = (req, res) => {
    res.json({ ngrok_url: currentNgrokUrl ? `${currentNgrokUrl}/api/settings/webhook` : null, last_captured_id: lastCapturedLineId });
};
