const axios = require('axios');
const nodemailer = require('nodemailer');
const db = require('../config/db');

/**
 * Send a notification via Email (SMTP)
 */
const sendEmail = async (subject, text, overrideTo = null) => {
    try {
        const [rows] = await db.query('SELECT smtp_host, smtp_port, smtp_user, smtp_pass, system_name, admin_email, enable_email FROM system_settings WHERE id = 1');
        const config = rows[0];

        if (!config || config.enable_email !== 1) return;
        if (!config.smtp_host || !config.smtp_user) return;

        let recipients = overrideTo || config.admin_email || config.smtp_user;
        const toList = recipients.split(',').map(email => email.trim()).filter(email => email !== '');

        const transporter = nodemailer.createTransport({
            host: config.smtp_host,
            port: parseInt(config.smtp_port) || 587,
            secure: config.smtp_port == 465,
            auth: { user: config.smtp_user, pass: config.smtp_pass },
            tls: { rejectUnauthorized: false }
        });

        await transporter.sendMail({
            from: `"${config.system_name || 'LMIS'}" <${config.smtp_user}>`,
            to: toList.join(', '),
            subject: subject,
            text: text
        });
        console.log(`✅ Email sent to: ${toList.join(', ')}`);
    } catch (err) {
        console.error('❌ Failed to send Email:', err.message);
    }
};

/**
 * Send a notification via LINE Messaging API (To Group)
 */
const sendLineNotify = async (message, throwOnError = false) => {
    try {
        const [rows] = await db.query('SELECT line_notify_token, line_group_id, enable_line FROM system_settings WHERE id = 1');
        const config = rows[0];

        if (!config || config.enable_line !== 1 || !config.line_notify_token || !config.line_group_id) {
            const msg = 'ระบบปิดการส่ง LINE หรือไม่ได้ระบุ Token / Group ID';
            if (throwOnError) throw new Error(msg);
            return false;
        }

        await axios.post('https://api.line.me/v2/bot/message/push', {
            to: config.line_group_id,
            messages: [{ type: 'text', text: message }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.line_notify_token}`
            }
        });
        console.log('✅ LINE Group Notification sent');
        return true;
    } catch (err) {
        const errDetail = err.response?.data?.message || err.message;
        console.error('❌ Failed to send LINE Group:', err.response?.data || err.message);

        try {
            const { sysLog } = require('../utils/logger');
            await sysLog('ERROR', 'SYSTEM', `การส่งแจ้งเตือน LINE ล้มเหลว: ${errDetail}`, {
                metadata: { error: err.response?.data || err.message, status: err.response?.status }
            });
        } catch (e) {}

        if (throwOnError) {
            if (err.response?.status === 429 || errDetail.includes('monthly limit')) {
                throw new Error('โควต้าข้อความรายเดือนของ LINE เต็มแล้ว (You have reached your monthly limit.)');
            }
            throw new Error(errDetail);
        }
        return false;
    }
};

/**
 * 🎯 Send a notification and MENTION a specific user in a group
 * @param {string} lineId - The LINE user ID to mention
 * @param {string} message - The message text
 */
const sendLineMention = async (lineId, message) => {
    try {
        const [rows] = await db.query('SELECT line_notify_token, line_group_id, enable_line FROM system_settings WHERE id = 1');
        const config = rows[0];

        if (!config || config.enable_line !== 1 || !config.line_notify_token || !config.line_group_id) return;
        if (!lineId) return sendLineNotify(message); // ถ้าไม่มี lineId ให้ส่งแบบปกติ

        // LINE Messaging API Mention Format
        await axios.post('https://api.line.me/v2/bot/message/push', {
            to: config.line_group_id,
            messages: [{
                type: 'text',
                text: `@User ${message}`,
                mention: {
                    mentions: [{
                        index: 0,
                        length: 5,
                        userId: lineId
                    }]
                }
            }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.line_notify_token}`
            }
        });
        console.log(`✅ LINE Mention sent to ${lineId}`);
    } catch (err) {
        console.error('❌ Failed to send LINE Mention:', err.response?.data || err.message);
    }
};

/**
 * 👤 Send a Direct Message to a specific user
 */
const sendLineToUser = async (lineId, message) => {
    try {
        const [rows] = await db.query('SELECT line_notify_token, enable_line FROM system_settings WHERE id = 1');
        const config = rows[0];

        if (!config || config.enable_line !== 1 || !config.line_notify_token || !lineId) return;

        await axios.post('https://api.line.me/v2/bot/message/push', {
            to: lineId,
            messages: [{ type: 'text', text: message }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.line_notify_token}`
            }
        });
        console.log(`✅ LINE Direct Message sent to ${lineId}`);
    } catch (err) {
        console.error('❌ Failed to send LINE Direct:', err.response?.data || err.message);
    }
};

/**
 * 📦 Send a notification for Backup/Sync Status
 * @param {string} type - 'Database', 'Source Code', 'GitHub', 'GDrive'
 * @param {string} status - 'Success', 'Failed'
 * @param {string} details - Additional info (filename, error, etc.)
 */
const sendBackupNotification = async (type, status, details) => {
    try {
        const [rows] = await db.query('SELECT line_notify_token, line_group_id, enable_line, notify_backup_status FROM system_settings WHERE id = 1');
        const config = rows[0];

        if (!config || config.enable_line !== 1 || config.notify_backup_status !== 1 || !config.line_notify_token || !config.line_group_id) return;

        const isSuccess = status.toLowerCase().includes('success') || status.includes('สำเร็จ');
        const icon = isSuccess ? '✅' : '❌';
        
        const message = `${icon} [แจ้งเตือนระบบสำรองข้อมูล]\n` +
                        `📂 ประเภท: ${type}\n` +
                        `📊 สถานะ: ${status}\n` +
                        `📝 รายละเอียด: ${details}\n` +
                        `⏰ เวลา: ${new Date().toLocaleString('th-TH')}`;

        await axios.post('https://api.line.me/v2/bot/message/push', {
            to: config.line_group_id,
            messages: [{ type: 'text', text: message }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.line_notify_token}`
            }
        });
        console.log(`✅ LINE Backup Notification sent: ${type} - ${status}`);
    } catch (err) {
        console.error('❌ Failed to send Backup Notification:', err.response?.data || err.message);
    }
};

/**
 * 🎨 Send a LINE Flex Message
 * @param {string} to - Destination ID (Group or User)
 * @param {string} altText - Alternative text for devices not supporting Flex
 * @param {object} flexContents - The Flex Message JSON structure
 */
const sendLineFlex = async (to, altText, flexContents) => {
    try {
        const [rows] = await db.query('SELECT line_notify_token, enable_line FROM system_settings WHERE id = 1');
        const config = rows[0];

        if (!config || config.enable_line !== 1 || !config.line_notify_token || !to) return;

        await axios.post('https://api.line.me/v2/bot/message/push', {
            to: to,
            messages: [{
                type: 'flex',
                altText: altText,
                contents: flexContents
            }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.line_notify_token}`
            }
        });
        console.log(`✅ LINE Flex Message sent to: ${to}`);
    } catch (err) {
        console.error('❌ Failed to send LINE Flex:', err.response?.data || err.message);
    }
};

/**
 * 🎫 Template: New Ticket Flex Message
 */
const sendNewTicketFlex = async (ticketData) => {
    const [rows] = await db.query('SELECT line_group_id FROM system_settings WHERE id = 1');
    const target = rows[0]?.line_group_id;
    if (!target) return;

    const flexJson = {
        "type": "bubble",
        "header": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                { "type": "text", "text": "🔔 มีใบงานแจ้งซ่อมใหม่", "weight": "bold", "color": "#ffffff", "size": "lg" }
            ],
            "backgroundColor": "#10b981"
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                { "type": "text", "text": `เลขที่: ${ticketData.no}`, "weight": "bold", "size": "xl", "margin": "md" },
                { "type": "separator", "margin": "lg" },
                {
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "spacing": "sm",
                    "contents": [
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                { "type": "text", "text": "หมวดหมู่", "color": "#aaaaaa", "size": "sm", "flex": 2 },
                                { "type": "text", "text": ticketData.cat, "wrap": true, "color": "#666666", "size": "sm", "flex": 5 }
                            ]
                        },
                        {
                            "type": "box",
                            "layout": "baseline",
                            "spacing": "sm",
                            "contents": [
                                { "type": "text", "text": "ปัญหา", "color": "#aaaaaa", "size": "sm", "flex": 2 },
                                { "type": "text", "text": ticketData.detail, "wrap": true, "color": "#666666", "size": "sm", "flex": 5 }
                            ]
                        }
                    ]
                }
            ]
        },
        "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
                {
                    "type": "button",
                    "style": "primary",
                    "height": "sm",
                    "color": "#1e293b",
                    "action": {
                        "type": "postback",
                        "label": "รับงาน (Accept Job)",
                        "data": `action=accept_job&ticket_no=${ticketData.no}`
                    }
                },
                {
                    "type": "button",
                    "style": "link",
                    "height": "sm",
                    "action": {
                        "type": "uri",
                        "label": "ดูรายละเอียดในระบบ",
                        "uri": "https://ma-bigdata.mol.go.th"
                    }
                }
            ],
            "flex": 0
        }
    };

    await sendLineFlex(target, `แจ้งซ่อมใหม่: ${ticketData.no}`, flexJson);
};

/**
 * 🔄 Template: Status Update Flex Message
 */
const sendUpdateTicketFlex = async (ticketData) => {
    const [rows] = await db.query('SELECT line_group_id FROM system_settings WHERE id = 1');
    const target = rows[0]?.line_group_id;
    if (!target) return;

    const flexJson = {
        "type": "bubble",
        "header": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                { "type": "text", "text": "🔄 อัปเดตสถานะใบงาน", "weight": "bold", "color": "#ffffff", "size": "lg" }
            ],
            "backgroundColor": "#3b82f6"
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
                { "type": "text", "text": `เลขที่: ${ticketData.no}`, "weight": "bold", "size": "xl", "margin": "md" },
                {
                    "type": "box",
                    "layout": "vertical",
                    "margin": "lg",
                    "contents": [
                        { "type": "text", "text": "สถานะใหม่", "color": "#aaaaaa", "size": "sm" },
                        { "type": "text", "text": ticketData.status, "weight": "bold", "size": "md", "color": "#1e293b" }
                    ]
                },
                { "type": "separator", "margin": "lg" },
                {
                    "type": "box",
                    "layout": "baseline",
                    "margin": "lg",
                    "contents": [
                        { "type": "text", "text": "โดย", "color": "#aaaaaa", "size": "sm", "flex": 1 },
                        { "type": "text", "text": ticketData.by, "color": "#666666", "size": "sm", "flex": 4 }
                    ]
                }
            ]
        }
    };

    await sendLineFlex(target, `อัปเดตใบงาน: ${ticketData.no}`, flexJson);
};

/**
 * 💬 Reply to a LINE message
 */
const replyMessage = async (replyToken, messages) => {
    try {
        const [rows] = await db.query('SELECT line_notify_token FROM system_settings WHERE id = 1');
        const config = rows[0];
        if (!config || !config.line_notify_token) return;

        await axios.post('https://api.line.me/v2/bot/message/reply', {
            replyToken: replyToken,
            messages: Array.isArray(messages) ? messages : [{ type: 'text', text: messages }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.line_notify_token}`
            }
        });
    } catch (err) {
        console.error('❌ Failed to reply to LINE:', err.response?.data || err.message);
    }
};

module.exports = { sendLineNotify, sendEmail, sendLineMention, sendLineToUser, sendBackupNotification, sendLineFlex, sendNewTicketFlex, sendUpdateTicketFlex, replyMessage };
