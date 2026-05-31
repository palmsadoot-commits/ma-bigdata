const db = require('../config/db');
const ticketService = require('../services/ticketService'); 
const { simpleSanitize } = require('../utils/dataHelper');
const { logAction, sysLog } = require('../utils/logger');
const { sendLineNotify, sendEmail, sendNewTicketFlex, sendUpdateTicketFlex } = require('../services/notificationService');

/**
 * Controller handling Ticket requests
 */

const getNotifySettings = async () => {
    const [rows] = await db.query('SELECT * FROM system_settings WHERE id = 1');
    return rows[0] || {};
};

const parseTemplate = (template, data) => {
    if (!template) return '';
    return template
        .replace(/{no}|\[ticket_no\]/g, data.no || '')
        .replace(/{cat}|\[category\]/g, data.cat || '')
        .replace(/{detail}|\[problem\]/g, data.detail || '')
        .replace(/{status}|\[status\]/g, data.status || '')
        .replace(/{by}|\[technician\]/g, data.by || '')
        .replace(/\[reporter\]/g, data.reporter || '');
};

exports.getTickets = async (req, res, next) => {
    try {
        const tickets = await ticketService.getAllTickets(req.query.project_id);
        res.json(tickets);
    } catch (err) { next(err); }
};

exports.createTicket = async (req, res, next) => {
    try {
        const reporter_id = req.user.user_id;
        let { category_id, equipment_no, software_no, problem_detail, is_cm } = req.body;
        const attachment = req.file ? req.file.filename : null;

        const settings = await getNotifySettings();
        if (settings.maintenance_mode === 1) {
            return res.status(503).json({ error: 'ระบบปิดปรับปรุงชั่วคราว กรุณาลองใหม่ภายหลัง' });
        }

        problem_detail = simpleSanitize(problem_detail);

        const result = await ticketService.createTicket({
            reporter_id, category_id, equipment_no, software_no, problem_detail, is_cm, attachment, settings
        });

        await sysLog('INFO', 'OPERATIONAL', `สร้างใบงานใหม่: ${result.ticket_number}`, {
            userId: reporter_id, req, 
            metadata: { action: 'TICKET_CREATED', ticket_number: result.ticket_number, category: result.categoryName, is_cm }
        });
        await logAction(reporter_id, 'TICKET_CREATED', `Ticket ${result.ticket_number} created`, req);

        if (settings.notify_new_ticket === 1 && settings.enable_line === 1) {
            const cleanText = problem_detail.replace(/<[^>]*>?/gm, '').substring(0, 100);
            await sendNewTicketFlex({
                no: result.ticket_number,
                cat: result.categoryName,
                detail: cleanText
            });
            if (settings.enable_email === 1 && settings.admin_email) sendEmail(`🔔 แจ้งซ่อมใหม่: ${result.ticket_number}`, cleanText);
        }

        res.status(201).json({ message: 'บันทึกใบแจ้งซ่อมสำเร็จ!', ticket_number: result.ticket_number });
    } catch (err) { next(err); }
};

exports.updateTicketStatus = async (req, res, next) => {
    const ticket_id = req.params.id;
    const auth_user_id = req.user.user_id;
    let { status, status_id, technician_id, root_cause_and_solution } = req.body;

    const statusMap = { 'Pending': 1, 'In Progress': 2, 'Returned': 3, 'Resolved': 4, 'WaitManual': 5, 'Closed': 6 };
    if (status && !status_id) status_id = statusMap[status];
    if (!status_id) return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
    if (!technician_id) technician_id = auth_user_id;

    try {
        if (root_cause_and_solution) root_cause_and_solution = simpleSanitize(root_cause_and_solution);
        
        const result = await ticketService.updateTicketStatus(ticket_id, {
            status_id, technician_id, root_cause_and_solution
        });

        const settings = await getNotifySettings();

        if (result.oldStatusName !== result.newStatusName) {
            await sysLog('INFO', 'OPERATIONAL', `อัปเดตสถานะใบงาน ${result.ticket_number}`, {
                userId: auth_user_id, req,
                metadata: { action: 'TICKET_STATUS_UPDATED', ticket_id, ticket_number: result.ticket_number, old_status: result.oldStatusName, new_status: result.newStatusName, technician_id }
            });
        }
        
        const [actorRows] = await db.query('SELECT CONCAT(first_name, " ", last_name) as full_name FROM users WHERE user_id = ?', [auth_user_id]);
        const actorFullName = actorRows[0]?.full_name || 'เจ้าหน้าที่';

        await logAction(auth_user_id, 'TICKET_STATUS_UPDATED', `Ticket ${result.ticket_number} status changed to ${result.newStatusName} by ${actorFullName}`, req);

        if (settings.notify_status_change === 1 && settings.enable_line === 1) {
            await sendUpdateTicketFlex({
                no: result.ticket_number,
                status: result.newStatusName,
                by: actorFullName
            });
            if (settings.enable_email === 1 && settings.admin_email) sendEmail(`🔧 อัปเดตใบงาน: ${result.ticket_number}`, `สถานะ: ${result.newStatusName}`);
        }

        res.json({ success: true, message: result.isBreached ? `สำเร็จล่าช้า! ค่าปรับ: ${result.penaltyAmount.toLocaleString()} บาท` : 'อัปเดตสำเร็จ' });
    } catch (err) { next(err); }
};

exports.assignTicket = async (req, res, next) => {
    try {
        const ticket_id = req.params.id;
        const { technician_id, assigned_to } = req.body;
        const active_tech_id = technician_id || assigned_to;
        
        if (!active_tech_id) return res.status(400).json({ error: 'กรุณาระบุช่างผู้รับผิดชอบ' });

        const [techRows] = await db.query(`
            SELECT CONCAT(u.first_name, ' ', u.last_name) as full_name, v.vendor_name 
            FROM users u 
            LEFT JOIN vendors v ON u.vendor_id = v.vendor_id 
            WHERE u.user_id = ?`, [active_tech_id]);
        
        const techNameSnap = techRows[0]?.full_name || 'ไม่ระบุชื่อช่าง';
        const vendorNameSnap = techRows[0]?.vendor_name || 'ไม่ระบุบริษัท (In-house)';

        const [ticketRows] = await db.query('SELECT ticket_number FROM tickets WHERE ticket_id = ?', [ticket_id]);
        const ticket_number = ticketRows[0]?.ticket_number;

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
            [active_tech_id, techNameSnap, vendorNameSnap, ticket_id]
        );
        
        await sysLog('INFO', 'OPERATIONAL', `มอบหมายงาน Ticket ID ${ticket_id} ให้ ${techNameSnap} (${vendorNameSnap})`, { userId: req.user.user_id, req });

        const settings = await getNotifySettings();
        if (settings.notify_status_change === 1 && settings.enable_line === 1) {
            await sendUpdateTicketFlex({
                no: ticket_number,
                status: '🛠️ กำลังดำเนินการ (In Progress)',
                by: techNameSnap
            });
            if (settings.enable_email === 1 && settings.admin_email) sendEmail(`🔧 รับมอบหมายงาน: ${ticket_number}`, `ช่าง ${techNameSnap} รับงานแล้ว`);
        }

        res.json({ success: true, message: 'มอบหมายงานสำเร็จ' });
    } catch (err) { next(err); }
};

exports.getTicketById = async (req, res, next) => {
    try {
        const ticket = await ticketService.getTicketById(req.params.id);
        if (!ticket) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        res.json(ticket);
    } catch (err) { next(err); }
};

exports.deleteTicket = async (req, res, next) => {
    try {
        await db.query('DELETE FROM tickets WHERE ticket_id = ?', [req.params.id]);
        res.json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
    } catch (err) { next(err); }
};

exports.getTicketLogs = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM ticket_logs WHERE ticket_id = ? ORDER BY created_at DESC', [req.params.id]);
        res.json(rows);
    } catch (err) { next(err); }
};

exports.createTicketLog = async (req, res, next) => {
    let { action, actor_name, detail } = req.body;
    try {
        if (!actor_name && req.user) {
            const [userRows] = await db.query('SELECT CONCAT(first_name, " ", last_name) as full_name FROM users WHERE user_id = ?', [req.user.user_id]);
            actor_name = userRows[0]?.full_name || 'ไม่ระบุชื่อ';
        }

        await db.query(
            'INSERT INTO ticket_logs (ticket_id, action, actor_name, detail, created_at) VALUES (?, ?, ?, ?, NOW())',
            [req.params.id, action, actor_name, detail]
        );
        res.json({ success: true });
    } catch (err) { next(err); }
};
