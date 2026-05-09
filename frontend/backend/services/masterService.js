const db = require('../config/db');

/**
 * Enterprise Master Data Service
 * Handles: Projects, Categories, Equipments, Vendors
 */
const masterService = {
    // --- 1. Project Operations ---
    async getAllProjects() {
        const sql = `SELECT p.*, v.vendor_name FROM projects p LEFT JOIN vendors v ON p.vendor_id = v.vendor_id ORDER BY p.project_id DESC`;
        const [rows] = await db.query(sql);
        return rows;
    },

    async createProject(data) {
        const { project_name, project_contract, description, vendor_id, contract_value, penalty_rate } = data;
        const [result] = await db.query(
            `INSERT INTO projects (project_name, project_contract, description, vendor_id, contract_value, penalty_rate) VALUES (?, ?, ?, ?, ?, ?)`, 
            [project_name, project_contract || null, description || null, vendor_id || null, contract_value || 0, penalty_rate || 0]
        );
        return result.insertId;
    },

    async updateProject(id, data) {
        const { project_name, project_contract, description, vendor_id, contract_value, penalty_rate } = data;
        await db.query(
            `UPDATE projects SET project_name = ?, project_contract = ?, description = ?, vendor_id = ?, contract_value = ?, penalty_rate = ? WHERE project_id = ?`, 
            [project_name, project_contract || null, description || null, vendor_id || null, contract_value || 0, penalty_rate || 0, id]
        );
    },

    async deleteProject(id) {
        const [cats] = await db.query('SELECT COUNT(*) as count FROM categories WHERE project_id = ?', [id]);
        if (cats[0].count > 0) throw new Error('Cannot delete project: existing categories are linked to this project');
        await db.query('DELETE FROM projects WHERE project_id = ?', [id]);
    },

    // --- 2. Category Operations ---
    async getAllCategories() {
        const sql = `SELECT c.*, p.project_name FROM categories c LEFT JOIN projects p ON c.project_id = p.project_id ORDER BY c.category_id DESC`;
        const [rows] = await db.query(sql);
        return rows;
    },

    async createCategory(data) {
        const { category_name, category_type, project_id, weighting_factor } = data;
        await db.query(
            `INSERT INTO categories (category_name, category_type, project_id, weighting_factor) VALUES (?, ?, ?, ?)`, 
            [category_name, category_type || null, project_id || null, weighting_factor || 1.00]
        );
    },

    async updateCategory(id, data) {
        const { category_name, category_type, project_id, weighting_factor } = data;
        await db.query(
            `UPDATE categories SET category_name = ?, category_type = ?, project_id = ?, weighting_factor = ? WHERE category_id = ?`, 
            [category_name, category_type || null, project_id || null, weighting_factor || 1.00, id]
        );
    },

    // --- 3. Equipment Operations ---
    async getAllEquipments() {
        const sql = `SELECT e.*, c.category_name, c.project_id FROM equipments e LEFT JOIN categories c ON e.category_id = c.category_id ORDER BY e.equipment_id DESC`;
        const [rows] = await db.query(sql);
        return rows;
    },

    async createEquipment(data) {
        const { category_id, equipment_name, serial_number } = data;
        await db.query(`INSERT INTO equipments (category_id, equipment_name, serial_number) VALUES (?, ?, ?)`, [category_id, equipment_name, serial_number || null]);
    },

    async updateEquipment(id, data) {
        const { category_id, equipment_name, serial_number } = data;
        await db.query(`UPDATE equipments SET category_id=?, equipment_name=?, serial_number=? WHERE equipment_id=?`, [category_id, equipment_name, serial_number || null, id]);
    },

    // --- 4. Vendor Operations ---
    async getAllVendors() {
        const [rows] = await db.query('SELECT * FROM vendors ORDER BY vendor_id DESC');
        return rows;
    },

    async createVendor(data) {
        const { vendor_name, contact_name, contact_phone, contact_email } = data;
        await db.query(`INSERT INTO vendors (vendor_name, contact_name, contact_phone, contact_email) VALUES (?, ?, ?, ?)`, [vendor_name, contact_name || null, contact_phone || null, contact_email || null]);
    },

    async updateVendor(id, data) {
        const { vendor_name, contact_name, contact_phone, contact_email } = data;
        await db.query(`UPDATE vendors SET vendor_name=?, contact_name=?, contact_phone=?, contact_email=? WHERE vendor_id=?`, [vendor_name, contact_name || null, contact_phone || null, contact_email || null, id]);
    }
};

module.exports = masterService;
