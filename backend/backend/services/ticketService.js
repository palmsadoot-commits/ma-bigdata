const db = require('../config/db');

/**
 * Service handling all Ticket-related operations
 */
const ticketService = {
    /**
     * ดึงรายการใบงานทั้งหมด (พร้อมข้อมูลความสัมพันธ์)
     */
    async getAllTickets(projectId = null) {
        let sql = `
            SELECT 
                t.ticket_id, t.ticket_number, t.equipment_no, t.software_no, 
                LEFT(REGEXP_REPLACE(t.problem_detail, '<[^>]*>?', ''), 100) AS problem_detail, 
                t.status_id, t.status, ts.status_name, ts.status_color,
                t.created_at, t.attachment, t.is_cm, t.sla_deadline, 
                t.is_sla_breached, t.penalty_amount, t.acknowledged_at,
                t.reporter_name_snap, t.reporter_agency_snap,
                t.assigned_to_name_snap, t.assigned_to_vendor_snap,
                c.category_name, c.category_type, 
                CONCAT(u.first_name, ' ', u.last_name) AS reporter_name,
                CONCAT(tech.first_name, ' ', tech.last_name) AS assigned_to_name 
            FROM tickets t 
            LEFT JOIN ticket_statuses ts ON t.status_id = ts.status_id
            LEFT JOIN categories c ON t.category_id = c.category_id 
            LEFT JOIN users u ON t.reporter_id = u.user_id
            LEFT JOIN users tech ON t.assigned_to = tech.user_id
        `;
        let params = [];
        if (projectId && projectId !== 'null' && projectId !== 'undefined') {
            sql += ' WHERE c.project_id = ?';
            params.push(projectId);
        }
        sql += ' ORDER BY t.created_at DESC LIMIT 100';
        const [rows] = await db.query(sql, params);
        return rows;
    },

    /**
     * ดึงข้อมูลใบงานตาม ID
     */
    async getTicketById(id) {
        const [rows] = await db.query(`
            SELECT 
                t.*, ts.status_name, ts.status_color, c.category_name, 
                CONCAT(u.first_name, ' ', u.last_name) AS reporter_name,
                CONCAT(tech.first_name, ' ', tech.last_name) AS assigned_to_name 
            FROM tickets t 
            LEFT JOIN ticket_statuses ts ON t.status_id = ts.status_id
            LEFT JOIN categories c ON t.category_id = c.category_id 
            LEFT JOIN users u ON t.reporter_id = u.user_id 
            LEFT JOIN users tech ON t.assigned_to = tech.user_id
            WHERE t.ticket_id = ?`, [id]);
        return rows[0] || null;
    },

    /**
     * คำนวณ SLA และสร้างใบงานใหม่
     */
    async createTicket(data) {
        const { reporter_id, category_id, equipment_no, software_no, problem_detail, is_cm, attachment, settings } = data;
        
        const currentYearBE = new Date().getFullYear() + 543; 
        const [rows] = await db.query('SELECT COUNT(*) as count FROM tickets WHERE ticket_number LIKE ?', [`%/${currentYearBE}`]);
        const ticket_number = `${rows[0].count + 1}/${currentYearBE}`; 

        const [userRows] = await db.query('SELECT CONCAT(first_name, " ", last_name) as full_name, agency FROM users WHERE user_id = ?', [reporter_id]);
        const reporterNameSnap = userRows[0]?.full_name || 'ไม่ระบุชื่อ';
        const reporterAgencySnap = userRows[0]?.agency || 'ไม่ระบุหน่วยงาน';

        const [catRows] = await db.query('SELECT project_id, category_name, category_type FROM categories WHERE category_id = ?', [category_id]);
        const projectId = catRows[0]?.project_id;
        const categoryName = catRows[0]?.category_name;
        const categoryType = catRows[0]?.category_type;
        
        let slaHours = settings.default_sla_hours || 24;
        if (Number(is_cm) === 1) {
            if (categoryType === 'Hardware') slaHours = settings.sla_hardware_hours || 6;
            else if (categoryType === 'Software') slaHours = settings.sla_software_hours || 6;
            else if (categoryType === 'Application') slaHours = settings.sla_app_hours || 12;
        }

        let vendorId = null;
        if (projectId) {
            const [contractRows] = await db.query('SELECT vendor_id FROM contracts WHERE project_id = ? AND is_active = 1 ORDER BY contract_id DESC LIMIT 1', [projectId]);
            if (contractRows.length > 0) vendorId = contractRows[0].vendor_id;
        }

        const [result] = await db.query(
            `INSERT INTO tickets (ticket_number, reporter_id, reporter_name_snap, reporter_agency_snap, category_id, equipment_no, software_no, problem_detail, status_id, status, attachment, is_cm, sla_hours, sla_deadline, vendor_id, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'Pending', ?, ?, ?, IF(? = '1', DATE_ADD(NOW(), INTERVAL ? HOUR), NULL), ?, NOW())`, 
            [
                ticket_number, reporter_id || null, reporterNameSnap, reporterAgencySnap, category_id || null, 
                equipment_no || null, software_no || null, problem_detail || '', attachment || null, 
                is_cm || 0, slaHours || 0, is_cm || 0, slaHours || 0, vendorId || null
            ]
        );

        return { ticket_id: result.insertId, ticket_number, categoryName };
    },

    /**
     * อัปเดตสถานะใบงาน พร้อมคำนวณค่าปรับ (SLA Breach Calculation)
     */
    async updateTicketStatus(id, updateData) {
        const { status_id, technician_id, root_cause_and_solution } = updateData;
        
        const [ticketRows] = await db.query(`
            SELECT t.*, ts.status_name as old_status_name, c.project_id 
            FROM tickets t 
            LEFT JOIN ticket_statuses ts ON t.status_id = ts.status_id
            LEFT JOIN categories c ON t.category_id = c.category_id 
            WHERE t.ticket_id = ?`, [id]
        );
        const ticket = ticketRows[0];
        if (!ticket) throw new Error('Ticket not found');

        // Map status ID to String Name for 'status' column
        const statusNameMap = { 1: 'Pending', 2: 'In Progress', 3: 'Returned', 4: 'Resolved', 5: 'WaitManual', 6: 'Closed' };
        const statusString = statusNameMap[status_id] || 'Unknown';

        let penaltyAmount = 0.00;
        let isBreached = 0;

        // Resolved (ID = 4) - คำนวณค่าปรับ
        if (Number(status_id) === 4 && ticket.is_cm === 1 && ticket.sla_deadline) {
            const [timeCheck] = await db.query('SELECT NOW() as current_time_db');
            const resolvedAt = new Date(timeCheck[0].current_time_db);
            const deadline = new Date(ticket.sla_deadline);

            if (resolvedAt > deadline) {
                isBreached = 1;
                const delayMs = resolvedAt - deadline;
                const delayDays = Math.ceil(delayMs / (1000 * 60 * 60 * 24));
                
                // ค้นหาสัญญาและอัตราค่าปรับ
                const [contractRows] = await db.query(`SELECT contract_value, penalty_rate FROM contracts WHERE project_id = ? AND vendor_id = ? AND is_active = 1 ORDER BY contract_id DESC LIMIT 1`, [ticket.project_id || 0, ticket.vendor_id || 0]);
                
                // ค้นหาน้ำหนักของอุปกรณ์
                const [eqRows] = await db.query(`SELECT weighting_factor FROM equipments WHERE serial_number = ? LIMIT 1`, [ticket.equipment_no || '']);
                const weight = eqRows.length > 0 ? parseFloat(eqRows[0].weighting_factor) : 1.0;
                
                const [totalWeightRows] = await db.query(`SELECT SUM(weighting_factor) as total_weight FROM equipments e JOIN categories c ON e.category_id = c.category_id WHERE c.project_id = ?`, [ticket.project_id || 0]);
                const totalWeight = totalWeightRows[0].total_weight || 1.0;

                if (contractRows.length > 0) {
                    const contractValue = parseFloat(contractRows[0].contract_value);
                    const penaltyRate = parseFloat(contractRows[0].penalty_rate); 
                    penaltyAmount = (contractValue * (weight / totalWeight)) * penaltyRate * delayDays;
                }
            }
            
            // อัปเดตข้อมูลพร้อมสถานะ
            await db.query(
                `UPDATE tickets SET status_id = ?, status = ?, resolved_at = NOW(), is_sla_breached = ?, penalty_amount = ?, updated_at = NOW() WHERE ticket_id = ?`, 
                [status_id, statusString, isBreached, penaltyAmount, id]
            );
        } else {
            // อัปเดตเฉพาะสถานะ
            await db.query(
                'UPDATE tickets SET status_id = ?, status = ?, updated_at = NOW() WHERE ticket_id = ?', 
                [status_id, statusString, id]
            );
        }

        // บันทึกวิธีแก้ไขในตาราง resolutions
        if (Number(status_id) === 4 && root_cause_and_solution) {
            await db.query(
                `INSERT INTO ticket_resolutions (ticket_id, technician_id, root_cause_and_solution, resolved_at) 
                 VALUES (?, ?, ?, NOW()) 
                 ON DUPLICATE KEY UPDATE root_cause_and_solution = VALUES(root_cause_and_solution), resolved_at = NOW()`, 
                [id, technician_id, root_cause_and_solution]
            );
        }

        const [statusRows] = await db.query('SELECT status_name FROM ticket_statuses WHERE status_id = ?', [status_id]);
        return { 
            ticket_number: ticket.ticket_number, 
            oldStatusName: ticket.old_status_name, 
            newStatusName: statusRows[0]?.status_name || statusString,
            isBreached,
            penaltyAmount
        };
    }
};

module.exports = ticketService;
