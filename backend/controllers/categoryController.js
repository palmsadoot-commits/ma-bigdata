const db = require('../config/db');
const masterService = require('../services/masterService');

exports.getCategories = async (req, res) => {
    try {
        const categories = await masterService.getAllCategories();
        res.json(categories);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch categories' }); }
};

exports.createCategory = async (req, res) => {
    try {
        await masterService.createCategory(req.body);
        res.json({ success: true, message: 'เพิ่มหมวดหมู่เรียบร้อยแล้ว' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถเพิ่มหมวดหมู่ได้' }); }
};

exports.updateCategory = async (req, res) => {
    try {
        await masterService.updateCategory(req.params.id, req.body);
        res.json({ success: true, message: 'อัปเดตหมวดหมู่เรียบร้อยแล้ว' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถอัปเดตหมวดหมู่ได้' }); }
};

exports.deleteCategory = async (req, res) => {
    try {
        await db.query('DELETE FROM categories WHERE category_id = ?', [req.params.id]);
        res.json({ success: true, message: 'ลบหมวดหมู่เรียบร้อยแล้ว' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถลบได้' }); }
};

exports.getCategoryTypes = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM category_types ORDER BY type_id ASC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch category types' }); }
};

exports.createCategoryType = async (req, res) => {
    const { type_code, type_name } = req.body;
    try {
        await db.query(`INSERT INTO category_types (type_code, type_name) VALUES (?, ?)`, [type_code, type_name]);
        res.json({ success: true, message: 'เพิ่มประเภทเรียบร้อย' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถเพิ่มได้ (ชื่อ Type อาจซ้ำ)' }); }
};

exports.updateCategoryType = async (req, res) => {
    const { type_code, type_name } = req.body;
    try {
        const [oldRows] = await db.query('SELECT type_code FROM category_types WHERE type_id = ?', [req.params.id]);
        if (oldRows.length > 0) {
            await db.query(`UPDATE categories SET category_type = ? WHERE category_type = ?`, [type_code, oldRows[0].type_code]);
        }
        await db.query(`UPDATE category_types SET type_code = ?, type_name = ? WHERE type_id = ?`, [type_code, type_name, req.params.id]);
        res.json({ success: true, message: 'อัปเดตประเภทเรียบร้อย' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถอัปเดตได้' }); }
};

exports.deleteCategoryType = async (req, res) => {
    try {
        await db.query('DELETE FROM category_types WHERE type_id = ?', [req.params.id]);
        res.json({ success: true, message: 'ลบประเภทเรียบร้อย' });
    } catch (err) { res.status(500).json({ error: 'ไม่สามารถลบได้' }); }
};
