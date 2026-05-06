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
const sendLineNotify = async (message) => {
    try {
        const [rows] = await db.query('SELECT line_notify_token, line_group_id, enable_line FROM system_settings WHERE id = 1');
        const config = rows[0];

        if (!config || config.enable_line !== 1 || !config.line_notify_token || !config.line_group_id) return;

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
    } catch (err) {
        console.error('❌ Failed to send LINE Group:', err.response?.data || err.message);
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

module.exports = { sendLineNotify, sendEmail, sendLineMention, sendLineToUser, sendBackupNotification };
