const db = require('../config/db');

/**
 * Service handling all Ticket Status management operations
 */
const statusService = {
    /**
     * ดึงรายการป้ายสถานะทั้งหมด
     */
    async getAllStatuses() {
        const [rows] = await db.query('SELECT * FROM ticket_statuses ORDER BY sort_order ASC');
        return rows;
    },

    /**
     * สร้างป้ายสถานะใหม่
     */
    async createStatus(data) {
        const { status_name, status_color, sort_order, is_active } = data;
        const [result] = await db.query(
            'INSERT INTO ticket_statuses (status_name, status_color, sort_order, is_active) VALUES (?, ?, ?, ?)',
            [status_name, status_color || '#1890ff', sort_order || 0, is_active === undefined ? 1 : is_active]
        );
        return result.insertId;
    },

    /**
     * อัปเดตข้อมูลป้ายสถานะ
     */
    async updateStatus(id, data) {
        const { status_name, status_color, sort_order, is_active } = data;
        
        // กรองเฉพาะฟิลด์ที่มีการส่งมาจริง (Partial Update support)
        let sql = 'UPDATE ticket_statuses SET ';
        let params = [];
        let updates = [];

        if (status_name !== undefined) { updates.push('status_name = ?'); params.push(status_name); }
        if (status_color !== undefined) { updates.push('status_color = ?'); params.push(status_color); }
        if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }
        if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

        if (updates.length === 0) return;

        sql += updates.join(', ') + ' WHERE status_id = ?';
        params.push(id);

        await db.query(sql, params);
    },

    /**
     * ลบป้ายสถานะ
     */
    async deleteStatus(id) {
        // ตรวจสอบก่อนว่ามีการใช้งานสถานะนี้ใน Ticket หรือไม่
        const [tickets] = await db.query('SELECT COUNT(*) as count FROM tickets WHERE status_id = ?', [id]);
        if (tickets[0].count > 0) throw new Error('Cannot delete: this status is currently being used by active tickets');
        
        await db.query('DELETE FROM ticket_statuses WHERE status_id = ?', [id]);
    }
};

module.exports = statusService;
