const db = require('../config/db');

const projectService = {
    /**
     * ดึงรายชื่อโปรเจกต์ทั้งหมด
     */
    async getProjects() {
        const [rows] = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
        return rows;
    },

    /**
     * ดึงข้อมูลงวดงานทั้งหมด
     */
    async getMilestones() {
        const [rows] = await db.query('SELECT * FROM project_milestones ORDER BY installment_no ASC');
        return rows;
    },

    /**
     * ดึงรายการงานแยกตามงวดงาน
     */
    async getTasksByMilestone(milestoneId) {
        const [rows] = await db.query(`
            SELECT t.*, 
                   u1.username as responsible_username, CONCAT(u1.first_name, ' ', u1.last_name) as responsible_name,
                   u2.username as executor_username, CONCAT(u2.first_name, ' ', u2.last_name) as executor_name 
            FROM project_tasks t 
            LEFT JOIN users u1 ON t.responsible_id = u1.user_id 
            LEFT JOIN users u2 ON t.executor_id = u2.user_id 
            WHERE t.milestone_id = ? 
            ORDER BY t.tor_clause ASC
        `, [milestoneId]);
        return rows;
    },

    /**
     * ดึงรายการงานทั้งหมด (ภาพรวม)
     */
    async getAllTasks() {
        const [rows] = await db.query(`
            SELECT t.*, m.title as milestone_title,
                   CONCAT(u1.first_name, ' ', u1.last_name) as responsible_name,
                   CONCAT(u2.first_name, ' ', u2.last_name) as executor_name 
            FROM project_tasks t 
            JOIN project_milestones m ON t.milestone_id = m.milestone_id 
            LEFT JOIN users u1 ON t.responsible_id = u1.user_id 
            LEFT JOIN users u2 ON t.executor_id = u2.user_id 
            ORDER BY m.installment_no ASC, t.tor_clause ASC
        `);
        return rows;
    },

    /**
     * อัปเดตสถานะงาน
     */
    async updateTaskStatus(taskId, status, completionDate = null) {
        const sql = completionDate 
            ? 'UPDATE project_tasks SET status = ?, completion_date = ? WHERE task_id = ?'
            : 'UPDATE project_tasks SET status = ? WHERE task_id = ?';
        const params = completionDate ? [status, completionDate, taskId] : [status, taskId];
        await db.query(sql, params);
        
        // คำนวณ Progress ของ Milestone อัตโนมัติ
        const [taskRow] = await db.query('SELECT milestone_id FROM project_tasks WHERE task_id = ?', [taskId]);
        if (taskRow.length > 0) {
            await this.calculateMilestoneProgress(taskRow[0].milestone_id);
        }
    },

    /**
     * อัปเดตข้อมูลงานทั้งหมด (สถานะ, ผู้รับผิดชอบ, ผู้ดำเนินการ, รายละเอียด)
     */
    async updateTask(taskId, data) {
        const { tor_clause, description, responsible_id, executor_id, status, completion_date, maintenance_type } = data;
        const sql = `
            UPDATE project_tasks 
            SET tor_clause = ?, description = ?, responsible_id = ?, executor_id = ?, status = ?, completion_date = ?, maintenance_type = ? 
            WHERE task_id = ?
        `;
        await db.query(sql, [tor_clause, description, responsible_id || null, executor_id || null, status, completion_date || null, maintenance_type || 'General', taskId]);
        
        // คำนวณ Progress ของ Milestone อัตโนมัติ
        const [taskRow] = await db.query('SELECT milestone_id FROM project_tasks WHERE task_id = ?', [taskId]);
        if (taskRow.length > 0) {
            await this.calculateMilestoneProgress(taskRow[0].milestone_id);
        }
    },

    /**
     * อัปเดตข้อมูลงวดงาน (สำหรับการเบิกจ่ายเงิน)
     */
    async updateMilestone(milestoneId, data) {
        const { payment_amount, payment_status } = data;
        const sql = `
            UPDATE project_milestones 
            SET payment_amount = ?, payment_status = ? 
            WHERE milestone_id = ?
        `;
        await db.query(sql, [payment_amount || 0.00, payment_status || 'Pending', milestoneId]);
    },

    /**
     * ดึงรายชื่อผู้ใช้งานที่เกี่ยวข้องกับโครงการ
     */
    async getProjectUsers(projectId) {
        const [rows] = await db.query(`
            SELECT user_id, CONCAT(first_name, ' ', last_name) as full_name, role 
            FROM users 
            WHERE (project_id = ? OR role = 'admin') AND status = 'active'
        `, [projectId]);
        return rows;
    },

    /**
     * คำนวณเปอร์เซ็นต์ความคืบหน้าของ Milestone
     */
    async calculateMilestoneProgress(milestoneId) {
        const [tasks] = await db.query('SELECT status FROM project_tasks WHERE milestone_id = ?', [milestoneId]);
        if (tasks.length === 0) return;

        const doneTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Verified').length;
        const progress = Math.round((doneTasks / tasks.length) * 100);
        
        let status = 'In Progress';
        if (progress === 100) status = 'Completed';
        else if (progress === 0) status = 'Pending';

        await db.query('UPDATE project_milestones SET progress_percent = ?, status = ? WHERE milestone_id = ?', [progress, status, milestoneId]);
    },

    /**
     * ดึงข้อมูล SLA Logs
     */
    async getSLALogs(projectId) {
        const [rows] = await db.query('SELECT * FROM project_sla_logs WHERE project_id = ? ORDER BY reported_at DESC', [projectId]);
        return rows;
    },

    /**
     * ดึงข้อมูล Deliverables
     */
    async getDeliverables(milestoneId) {
        const [rows] = await db.query('SELECT * FROM project_deliverables WHERE milestone_id = ?', [milestoneId]);
        return rows;
    },

    /**
     * ดึงข้อมูลขอบเขตงาน (TOR Scope) พร้อมการจับคู่หมวดหมู่และงวดงาน (Multi-milestone)
     */
    async getTORScope() {
        const [rows] = await db.query(`
            SELECT c.*, 
                   m.category_id, m.annex_table_no,
                   cat.category_name,
                   (SELECT GROUP_CONCAT(ms.title SEPARATOR ', ') 
                    FROM project_tor_milestones tm 
                    JOIN project_milestones ms ON tm.milestone_id = ms.milestone_id 
                    WHERE tm.clause_id = c.clause_id) as milestone_titles,
                   (SELECT GROUP_CONCAT(tm.milestone_id) 
                    FROM project_tor_milestones tm 
                    WHERE tm.clause_id = c.clause_id) as milestone_ids
            FROM project_tor_clauses c
            LEFT JOIN project_tor_mapping m ON c.clause_id = m.clause_id
            LEFT JOIN categories cat ON m.category_id = cat.category_id
            ORDER BY c.clause_no ASC
        `);
        return rows;
    },

    /**
     * อัปเดตการจับคู่ TOR กับงวดงาน (หลายงวด) และหมวดหมู่
     */
    async updateTORMapping(clauseId, data) {
        const { milestone_ids, category_id, annex_table_no } = data;
        
        // 1. จัดการข้อมูลหมวดหมู่และภาคผนวก
        await db.query('DELETE FROM project_tor_mapping WHERE clause_id = ?', [clauseId]);
        if (category_id || annex_table_no) {
            await db.query(`
                INSERT INTO project_tor_mapping (clause_id, category_id, annex_table_no)
                VALUES (?, ?, ?)
            `, [clauseId, category_id || null, annex_table_no || null]);
        }

        // 2. จัดการข้อมูลหลายงวดงาน (Many-to-Many)
        await db.query('DELETE FROM project_tor_milestones WHERE clause_id = ?', [clauseId]);
        if (milestone_ids && milestone_ids.length > 0) {
            const values = milestone_ids.map(mId => [clauseId, mId]);
            await db.query('INSERT INTO project_tor_milestones (clause_id, milestone_id) VALUES ?', [values]);
        }
    }
};

module.exports = projectService;
